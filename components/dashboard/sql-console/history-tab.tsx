"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QuerySearch } from "./query-search";
import { QueryList } from "./query-list";
import { useTranslation } from "@/contexts/translation-context";
import type { SavedQuery } from "@/lib/db";

interface HistoryTabProps {
  queries: SavedQuery[];
  isLoading: boolean;
  searchText: string;
  onSearchChange: (text: string) => void;
  onExecute: (query: string) => void;
  onSave: (query: SavedQuery) => void;
  onDelete: (id: string) => void;
}

export function HistoryTab({
  queries,
  isLoading,
  searchText,
  onSearchChange,
  onExecute,
  onSave,
  onDelete,
}: HistoryTabProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t.queryHistory.historyTabTitle}
        </CardTitle>
        <CardDescription>
          {t.queryHistory.historyTabDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <QuerySearch value={searchText} onChange={onSearchChange} />
        <QueryList
          queries={queries}
          isLoading={isLoading}
          mode="history"
          onExecute={onExecute}
          onSave={onSave}
          onDelete={onDelete}
        />
      </CardContent>
    </Card>
  );
}

