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

interface SavedTabProps {
  queries: SavedQuery[];
  isLoading: boolean;
  searchText: string;
  onSearchChange: (text: string) => void;
  onExecute: (query: string) => void;
  onDelete: (id: string) => void;
}

export function SavedTab({
  queries,
  isLoading,
  searchText,
  onSearchChange,
  onExecute,
  onDelete,
}: SavedTabProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t.queryHistory.savedTabTitle}
        </CardTitle>
        <CardDescription>
          {t.queryHistory.savedTabDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <QuerySearch value={searchText} onChange={onSearchChange} />
        <QueryList
          queries={queries}
          isLoading={isLoading}
          mode="saved"
          onExecute={onExecute}
          onDelete={onDelete}
        />
      </CardContent>
    </Card>
  );
}

