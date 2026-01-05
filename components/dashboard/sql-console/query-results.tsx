"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/contexts/translation-context";
import { getResultColumns } from "@/lib/helpers/sql-console-helpers";

interface QueryResultsProps {
  result: Record<string, unknown>[] | null;
  isLoading: boolean;
}

export function QueryResults({ result, isLoading }: QueryResultsProps) {
  const { t } = useTranslation();

  if (result === null) {
    return null;
  }

  const columns = getResultColumns(result);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.queryHistory.queryResults}</CardTitle>
        <CardDescription>
          {result
            ? `${result.length} ${t.queryHistory.rowsReturned}`
            : t.queryHistory.queryResultsDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : result && result.length > 0 ? (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((column) => (
                      <TableCell
                        key={column}
                        className="max-w-xs truncate"
                      >
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
  );
}

