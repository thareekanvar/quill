"use client";

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
import { useTranslation } from "@/contexts/translation-context";
import { getQueryOperationType } from "@/lib/utils/query-utils";
import { truncateQuery } from "@/lib/helpers/sql-console-helpers";

interface WriteOperationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  useTransaction: boolean;
  onUseTransactionChange: (use: boolean) => void;
  onConfirm: () => void;
}

export function WriteOperationDialog({
  open,
  onOpenChange,
  query,
  useTransaction,
  onUseTransactionChange,
  onConfirm,
}: WriteOperationDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
            <p className="font-medium">
              {t.queryHistory.operationType}:{" "}
              <span className="text-amber-600 dark:text-amber-400">
                {getQueryOperationType(query)}
              </span>
            </p>
            <div className="mt-3 p-3 bg-muted rounded-md">
              <p className="text-xs font-mono text-muted-foreground break-all">
                {truncateQuery(query, 200)}
              </p>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useTransaction}
                  onChange={(e) => onUseTransactionChange(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">
                  {t.queryHistory.useTransaction}
                </span>
              </label>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                {t.queryHistory.transactionModeDescription}
              </p>
            </div>
            {!useTransaction && (
              <p className="text-sm font-medium text-destructive">
                {t.queryHistory.writeOperationConfirm}
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              useTransaction
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }
          >
            {useTransaction
              ? t.queryHistory.executeInTransaction
              : t.queryHistory.executeAnyway}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

