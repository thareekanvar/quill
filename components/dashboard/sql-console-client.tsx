"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, Clock, Bookmark } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/translation-context";
import { useQueryHistory } from "@/hooks/use-query-history";
import {
  useExecuteQueryWithTransaction,
  useCommitTransaction,
  useRollbackTransaction,
} from "@/hooks/use-transaction";
import { isWriteOperation } from "@/lib/utils/query-utils";
import {
  getFilteredQueries,
  formatQueryResultMessage,
  validateQuery,
} from "@/lib/helpers/sql-console-helpers";
import type { ConsoleTab, QueryToSave } from "@/types/sql-console";
import { ConsoleTab as ConsoleTabComponent, HistoryTab, SavedTab, WriteOperationDialog, SaveQueryDialog } from "@/components/dashboard/sql-console";

export function SQLConsoleClient() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ConsoleTab>("console");
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<
    Record<string, unknown>[] | null
  >(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string>("");
  const [useTransaction, setUseTransaction] = useState(true);
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(
    null
  );
  const [searchText, setSearchText] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [queryToSave, setQueryToSave] = useState<QueryToSave | null>(null);

  const executeQueryMutation = useExecuteQueryWithTransaction();
  const commitTransactionMutation = useCommitTransaction();
  const rollbackTransactionMutation = useRollbackTransaction();
  const {
    history,
    savedQueries,
    isLoadingHistory,
    isLoadingSaved,
    saveToHistory,
    saveQuery: saveQueryFn,
    deleteQuery,
  } = useQueryHistory();

  const { history: filteredHistory, saved: filteredSaved } = getFilteredQueries(
    history,
    savedQueries,
    searchText
  );

  const executeQueryInternal = async (
    queryToExecute: string,
    inTransaction: boolean = false
  ) => {
    const validation = validateQuery(queryToExecute);
    if (!validation.valid) {
      toast.error(validation.error || t.queryHistory.failedToExecute);
      return;
    }

    try {
      const shouldUseTransaction =
        inTransaction && isWriteOperation(queryToExecute);

      const result = await executeQueryMutation.mutateAsync({
        query: queryToExecute,
        useTransaction: shouldUseTransaction,
      });

      if (result.transactionId) {
        setActiveTransactionId(result.transactionId);
        toast.success(formatQueryResultMessage(result));
        setQueryResult(result.data || null);
      } else {
        await saveToHistory({ query: queryToExecute });

        toast.success(formatQueryResultMessage(result));
        if (result.data && Array.isArray(result.data)) {
          setQueryResult(result.data);
        } else {
          setQueryResult(null);
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t.queryHistory.failedToExecute;
      toast.error(errorMessage);
      setQueryResult(null);
    }
  };

  const handleExecute = async () => {
    const validation = validateQuery(query);
    if (!validation.valid) {
      toast.error(validation.error || t.queryHistory.failedToExecute);
      return;
    }

    if (isWriteOperation(query)) {
      setPendingQuery(query);
      setConfirmDialogOpen(true);
    } else {
      await executeQueryInternal(query);
    }
  };

  const handleConfirmExecute = async () => {
    setConfirmDialogOpen(false);
    if (pendingQuery) {
      await executeQueryInternal(pendingQuery, useTransaction);
      setPendingQuery("");
    }
  };

  const handleExecuteFromHistory = async (queryText: string) => {
    setQuery(queryText);
    setActiveTab("console");

    if (isWriteOperation(queryText)) {
      setPendingQuery(queryText);
      setConfirmDialogOpen(true);
    } else {
      await executeQueryInternal(queryText);
    }
  };

  const handleSaveQuery = async (name: string, queryData: QueryToSave) => {
    try {
      await saveQueryFn({
        name,
        query: queryData.query,
        params: queryData.params,
      });
      toast.success(t.queryHistory.querySaved);
      setSaveDialogOpen(false);
      setQueryToSave(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t.queryHistory.failedToSave;
      toast.error(errorMessage);
    }
  };

  const handleDeleteQuery = async (id: string) => {
    try {
      await deleteQuery(id);
      toast.success(t.queryHistory.queryDeleted);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t.queryHistory.failedToDelete;
      toast.error(errorMessage);
    }
  };

  const handleCommit = async () => {
    if (!activeTransactionId) return;

    try {
      await commitTransactionMutation.mutateAsync(activeTransactionId);
      await saveToHistory({ query: pendingQuery || query });
      toast.success(t.queryHistory.transactionCommittedSuccess);
      setActiveTransactionId(null);
      setQueryResult(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t.queryHistory.failedToCommitTransaction;
      toast.error(errorMessage);
    }
  };

  const handleRollback = async () => {
    if (!activeTransactionId) return;

    try {
      await rollbackTransactionMutation.mutateAsync(activeTransactionId);
      toast.success(t.queryHistory.transactionRolledBackSuccess);
      setActiveTransactionId(null);
      setQueryResult(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t.queryHistory.failedToRollbackTransaction;
      toast.error(errorMessage);
    }
  };

  const isLoading =
    executeQueryMutation.isPending ||
    commitTransactionMutation.isPending ||
    rollbackTransactionMutation.isPending;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">{t.queryHistory.consoleTitle}</h1>
        <p className="text-muted-foreground">
          {t.queryHistory.consoleDescription}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ConsoleTab)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="console">
            <Terminal className="size-4 mr-2" />
            {t.queryHistory.console}
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="size-4 mr-2" />
            {t.queryHistory.history}
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Bookmark className="size-4 mr-2" />
            {t.queryHistory.saved}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="console" className="mt-4">
          <ConsoleTabComponent
            query={query}
            onQueryChange={setQuery}
            onExecute={handleExecute}
            queryResult={queryResult}
            isLoading={isLoading}
            transactionId={activeTransactionId}
            onCommit={handleCommit}
            onRollback={handleRollback}
            isCommitting={commitTransactionMutation.isPending}
            isRollingBack={rollbackTransactionMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryTab
            queries={filteredHistory}
            isLoading={isLoadingHistory}
            searchText={searchText}
            onSearchChange={setSearchText}
            onExecute={handleExecuteFromHistory}
            onSave={(q) => {
              setQueryToSave({ query: q.query, params: q.params });
              setSaveDialogOpen(true);
            }}
            onDelete={handleDeleteQuery}
          />
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          <SavedTab
            queries={filteredSaved}
            isLoading={isLoadingSaved}
            searchText={searchText}
            onSearchChange={setSearchText}
            onExecute={handleExecuteFromHistory}
            onDelete={handleDeleteQuery}
          />
        </TabsContent>
      </Tabs>

      <WriteOperationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        query={pendingQuery}
        useTransaction={useTransaction}
        onUseTransactionChange={setUseTransaction}
        onConfirm={handleConfirmExecute}
      />

      <SaveQueryDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        queryToSave={queryToSave}
        onSave={handleSaveQuery}
      />
    </div>
  );
}

