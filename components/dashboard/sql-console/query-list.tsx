"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Play, Trash, FloppyDisk } from "@phosphor-icons/react";
import { useTranslation } from "@/contexts/translation-context";
import type { SavedQuery } from "@/lib/db";
import type { QueryListMode } from "@/types/sql-console";
import { formatQueryDate, truncateQuery } from "@/lib/helpers/sql-console-helpers";

interface QueryListProps {
  queries: SavedQuery[];
  isLoading: boolean;
  mode: QueryListMode;
  onExecute: (query: string) => void;
  onSave?: (query: SavedQuery) => void;
  onDelete: (id: string) => void;
}

export function QueryList({
  queries,
  isLoading,
  mode,
  onExecute,
  onSave,
  onDelete,
}: QueryListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t.common.loading}
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {mode === "history"
          ? t.queryHistory.noHistory
          : t.queryHistory.noSaved}
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">
              {mode === "history"
                ? t.queryHistory.executedAt
                : t.queryHistory.name}
            </TableHead>
            <TableHead>{t.queryHistory.query}</TableHead>
            <TableHead className="w-[150px]">
              {t.common.actions}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {queries.map((q) => (
            <TableRow key={q.id}>
              <TableCell className="font-medium">
                {mode === "history" ? (
                  <span className="text-xs text-muted-foreground">
                    {formatQueryDate(q.executedAt)}
                  </span>
                ) : (
                  q.name || t.queryHistory.unnamed
                )}
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded block truncate max-w-md">
                  {truncateQuery(q.query, 200)}
                </code>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => onExecute(q.query)}
                    title={t.queryHistory.execute}
                  >
                    <Play className="size-4" />
                  </Button>
                  {mode === "history" && onSave && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      onClick={() => onSave(q)}
                      title={t.queryHistory.save}
                    >
                      <FloppyDisk className="size-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(q.id)}
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
  );
}

