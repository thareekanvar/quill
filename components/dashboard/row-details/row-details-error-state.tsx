"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WarningCircle } from "@phosphor-icons/react";
import { useTranslation } from "@/contexts/translation-context";

interface RowDetailsErrorStateProps {
  message?: string;
}

export function RowDetailsErrorState({
  message,
}: RowDetailsErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div className="p-8">
      <Alert variant="destructive">
        <WarningCircle />
        <AlertTitle>{t.pages.errorLoadingRowDetails}</AlertTitle>
        <AlertDescription>
          {message || t.pages.errorLoadingRowDetails}
        </AlertDescription>
      </Alert>
    </div>
  );
}

