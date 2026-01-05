"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Warning, CheckCircle, XCircle } from "@phosphor-icons/react";
import { useTranslation } from "@/contexts/translation-context";

interface TransactionControlsProps {
  transactionId: string;
  onCommit: () => void;
  onRollback: () => void;
  isCommitting?: boolean;
  isRollingBack?: boolean;
}

export function TransactionControls({
  transactionId,
  onCommit,
  onRollback,
  isCommitting = false,
  isRollingBack = false,
}: TransactionControlsProps) {
  const { t } = useTranslation();

  if (!transactionId) {
    return null;
  }

  return (
    <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Warning className="size-5 text-amber-500" />
          {t.queryHistory.activeTransaction}
        </CardTitle>
        <CardDescription>
          {t.queryHistory.transactionPending}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            onClick={onCommit}
            disabled={isCommitting || isRollingBack}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="size-4 mr-2" />
            {t.queryHistory.commitTransaction}
          </Button>
          <Button
            onClick={onRollback}
            disabled={isCommitting || isRollingBack}
            variant="destructive"
          >
            <XCircle className="size-4 mr-2" />
            {t.queryHistory.rollbackTransaction}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

