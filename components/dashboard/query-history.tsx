"use client";

import { useState } from "react";
import { useQueryHistory } from "@/hooks/use-query-history";
import { useExecuteQuery } from "@/hooks/use-postgres-query";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  Bookmark,
  MagnifyingGlass,
  Play,
  Trash,
  FloppyDisk,
  X,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/translation-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SQLEditor } from "@/components/dashboard/sql-editor";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Warning } from "@phosphor-icons/react";
import { isWriteOperation, getQueryOperationType } from "@/lib/utils/query-utils";

type Tab = "history" | "saved";

export function QueryHistory() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("history");
  const [searchText, setSearchText] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [queryToSave, setQueryToSave] = useState<{
    query: string;
    params?: unknown[];
  } | null>(null);
  const [saveName, setSaveName] = useState("");
  const [queryResult, setQueryResult] = useState<Record<string, unknown>[] | null>(null);
  const [lastExecutedQuery, setLastExecutedQuery] = useState<string>("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<{ query: string; params?: unknown[] } | null>(null);

  const {
    history,
    savedQueries,
    isLoadingHistory,
    isLoadingSaved,
    saveToHistory,
    saveQuery: saveQueryFn,
    deleteQuery,
    searchQueries: searchQueriesFn,
  } = useQueryHistory();

  const queryClient = useQueryClient();
  const { connectionId } = useAuthStore();

  const executeQuery = useExecuteQuery();

  // Filter queries based on search
  const filteredHistory = searchText
    ? history.filter(
        (q) =>
          q.query.toLowerCase().includes(searchText.toLowerCase()) ||
          (q.name && q.name.toLowerCase().includes(searchText.toLowerCase()))
      )
    : history;

  const filteredSaved = searchText
    ? savedQueries.filter(
        (q) =>
          q.query.toLowerCase().includes(searchText.toLowerCase()) ||
          (q.name && q.name.toLowerCase().includes(searchText.toLowerCase()))
      )
    : savedQueries;

  const executeQueryInternal = async (query: string, params?: unknown[]) => {
    try {
      const result = await executeQuery.mutateAsync({ query, params });
      // Save to history
      await saveToHistory({ query, params });
      
      // Store the executed query and results
      setLastExecutedQuery(query);
      
      // Show results
      if (result.data && Array.isArray(result.data)) {
        setQueryResult(result.data);
        toast.success(
          `${t.queryHistory.queryExecuted}. ${result.data.length} row(s) returned`
        );
      } else if (result.affectedRows !== undefined) {
        setQueryResult(null);
        toast.success(
          `${t.queryHistory.queryExecuted}. ${result.affectedRows} row(s) affected`
        );
      } else {
        setQueryResult(null);
        toast.success(t.queryHistory.queryExecuted);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t.queryHistory.failedToExecute;
      toast.error(errorMessage);
      setQueryResult(null);
    }
  };

  const handleExecuteQuery = async (query: string, params?: unknown[]) => {
    // Check if it's a write operation
    if (isWriteOperation(query)) {
      setPendingQuery({ query, params });
      setConfirmDialogOpen(true);
    } else {
      // Safe to execute read-only queries directly
      await executeQueryInternal(query, params);
    }
  };

  const handleConfirmExecute = async () => {
    setConfirmDialogOpen(false);
    if (pendingQuery) {
      await executeQueryInternal(pendingQuery.query, pendingQuery.params);
      setPendingQuery(null);
    }
  };

  const handleSaveQuery = async () => {
    if (!queryToSave || !saveName.trim()) {
      toast.error(t.queryHistory.nameRequired);
      return;
    }

    try {
      await saveQueryFn({
        name: saveName.trim(),
        query: queryToSave.query,
        params: queryToSave.params,
      });
      // Invalidate and refetch queries to update the list
      await queryClient.invalidateQueries({ queryKey: ["saved-queries", connectionId] });
      await queryClient.invalidateQueries({ queryKey: ["query-history", connectionId] });
      toast.success(t.queryHistory.querySaved);
      setSaveDialogOpen(false);
      setQueryToSave(null);
      setSaveName("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t.queryHistory.failedToSave;
      toast.error(errorMessage);
    }
  };

  const handleDeleteQuery = async (id: string) => {
    try {
      await deleteQuery(id);
      // Invalidate and refetch queries to update the list
      await queryClient.invalidateQueries({ queryKey: ["saved-queries", connectionId] });
      await queryClient.invalidateQueries({ queryKey: ["query-history", connectionId] });
      toast.success(t.queryHistory.queryDeleted);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t.queryHistory.failedToDelete;
      toast.error(errorMessage);
    }
  };

  const displayQueries = activeTab === "history" ? filteredHistory : filteredSaved;
  const isLoading = activeTab === "history" ? isLoadingHistory : isLoadingSaved;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.queryHistory.title}</CardTitle>
        <CardDescription>
          {t.queryHistory.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === "history" ? "default" : "ghost"}
            onClick={() => setActiveTab("history")}
            className="rounded-b-none"
          >
            <Clock className="size-4 mr-2" />
            {t.queryHistory.history}
          </Button>
          <Button
            variant={activeTab === "saved" ? "default" : "ghost"}
            onClick={() => setActiveTab("saved")}
            className="rounded-b-none"
          >
            <Bookmark className="size-4 mr-2" />
            {t.queryHistory.saved}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t.queryHistory.searchPlaceholder}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Query List */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t.common.loading}
          </div>
        ) : displayQueries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {activeTab === "history"
              ? t.queryHistory.noHistory
              : t.queryHistory.noSaved}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    {activeTab === "saved"
                      ? t.queryHistory.name
                      : t.queryHistory.executedAt}
                  </TableHead>
                  <TableHead>{t.queryHistory.query}</TableHead>
                  <TableHead className="w-[100px]">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayQueries.map((query) => (
                  <TableRow key={query.id}>
                    <TableCell className="font-medium">
                      {activeTab === "saved" ? (
                        query.name || t.queryHistory.unnamed
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {new Date(query.executedAt).toLocaleString()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded block truncate max-w-md">
                        {query.query}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {activeTab === "saved" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() => handleExecuteQuery(query.query, query.params)}
                            title={t.queryHistory.execute}
                          >
                            <Play className="size-4" />
                          </Button>
                        )}
                        {activeTab === "history" && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8"
                              onClick={() => handleExecuteQuery(query.query, query.params)}
                              title={t.queryHistory.execute}
                            >
                              <Play className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8"
                              onClick={() => {
                                setQueryToSave({ query: query.query, params: query.params });
                                setSaveDialogOpen(true);
                              }}
                              title={t.queryHistory.save}
                            >
                              <FloppyDisk className="size-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteQuery(query.id)}
                          title={t.common.delete}
                        >
                          <Trash className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Query Results */}
      {queryResult !== null && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>{t.queryHistory.queryResults}</CardTitle>
            <CardDescription>
              {queryResult
                ? `${queryResult.length} row(s) returned`
                : "Query executed successfully"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {executeQuery.isPending ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : queryResult && queryResult.length > 0 ? (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(queryResult[0]).map((column) => (
                        <TableHead key={column}>{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queryResult.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {Object.keys(queryResult[0]).map((column) => (
                          <TableCell key={column} className="max-w-xs truncate">
                            {String(row[column] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {t.queryHistory.noRowsReturned}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Query Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.queryHistory.saveQuery}</DialogTitle>
            <DialogDescription>
              {t.queryHistory.saveQueryDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="query-name">
                {t.queryHistory.queryName}
              </Label>
              <Input
                id="query-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={t.queryHistory.queryNamePlaceholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveQuery();
                  }
                }}
              />
            </div>
            {queryToSave && (
              <div>
                <Label>{t.queryHistory.query}</Label>
                <SQLEditor
                  value={queryToSave.query}
                  onChange={(value) => {
                    if (queryToSave) {
                      setQueryToSave({ ...queryToSave, query: value });
                    }
                  }}
                  height="200px"
                  readOnly={false}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSaveDialogOpen(false);
                  setQueryToSave(null);
                  setSaveName("");
                }}
              >
                {t.common.cancel}
              </Button>
              <Button onClick={handleSaveQuery}>
                {t.queryHistory.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Write Operations */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Warning className="size-5 text-amber-500" />
              {t.queryHistory.confirmWriteOperation}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {t.queryHistory.writeOperationWarning}
              </p>
              {pendingQuery && (
                <>
                  <p className="font-medium">
                    {t.queryHistory.operationType}:{" "}
                    <span className="text-amber-600 dark:text-amber-400">
                      {getQueryOperationType(pendingQuery.query)}
                    </span>
                  </p>
                  <div className="mt-3 p-3 bg-muted rounded-md">
                    <p className="text-xs font-mono text-muted-foreground break-all">
                      {pendingQuery.query.substring(0, 200)}
                      {pendingQuery.query.length > 200 ? "..." : ""}
                    </p>
                  </div>
                </>
              )}
              <p className="text-sm font-medium text-destructive">
                {t.queryHistory.writeOperationConfirm}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t.common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExecute}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.queryHistory.executeAnyway}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

