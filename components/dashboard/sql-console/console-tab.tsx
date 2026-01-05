"use client";

import { QueryEditor } from "./query-editor";
import { QueryResults } from "./query-results";
import { TransactionControls } from "./transaction-controls";
import type { QueryResult } from "@/types/sql-console";

interface ConsoleTabProps {
  query: string;
  onQueryChange: (query: string) => void;
  onExecute: () => void;
  queryResult: QueryResult["data"] | null;
  isLoading: boolean;
  transactionId: string | null;
  onCommit: () => void;
  onRollback: () => void;
  isCommitting?: boolean;
  isRollingBack?: boolean;
}

export function ConsoleTab({
  query,
  onQueryChange,
  onExecute,
  queryResult,
  isLoading,
  transactionId,
  onCommit,
  onRollback,
  isCommitting,
  isRollingBack,
}: ConsoleTabProps) {
  return (
    <div className="space-y-4">
      <QueryEditor
        query={query}
        onQueryChange={onQueryChange}
        onExecute={onExecute}
        isLoading={isLoading}
      />

      {transactionId && (
        <TransactionControls
          transactionId={transactionId}
          onCommit={onCommit}
          onRollback={onRollback}
          isCommitting={isCommitting}
          isRollingBack={isRollingBack}
        />
      )}

      <QueryResults result={queryResult} isLoading={isLoading} />
    </div>
  );
}

