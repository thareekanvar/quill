"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTables, useTableData } from "@/hooks/use-postgres-query";
import { findPrimaryKeyColumn } from "@/lib/helpers/table-helpers";
import { formatCellValue } from "@/lib/helpers/table-viewer-helpers";
import { buildRowDetailsUrl } from "@/lib/helpers/url-helpers";
import { DEFAULT_SCHEMA } from "@/lib/constants";
import { MagnifyingGlass, ArrowRight } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/translation-context";

interface RelatedRowSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue: unknown;
  currentSchemaName?: string;
}

/**
 * RelatedRowSelector component for selecting related rows from foreign key relationships
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback when dialog open state changes
 * @param currentValue - Current selected value
 * @param currentSchemaName - Current schema name (defaults to "public")
 */
export function RelatedRowSelector({
  open,
  onOpenChange,
  currentValue,
  currentSchemaName = DEFAULT_SCHEMA,
}: RelatedRowSelectorProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [selectedSchema, setSelectedSchema] = useState<string>(currentSchemaName);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tablesData, isLoading: tablesLoading } = useTables();

  const { data: tableData, isLoading: tableDataLoading } = useTableData({
    tableName: selectedTable.split(".")[1] || selectedTable,
    schemaName: selectedTable.includes(".")
      ? selectedTable.split(".")[0]
      : selectedSchema,
    page: 1,
    limit: searchQuery ? 50 : 10, // Show more when searching
    sort: undefined,
    order: "ASC",
  });

  // Reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedTable("");
      setSearchQuery("");
      setSelectedSchema(currentSchemaName);
    }
  }, [open, currentSchemaName]);

  /**
   * Handle row click to navigate to row details
   */
  const handleRowClick = (row: Record<string, unknown>) => {
    if (!tableData) return;

    const primaryKey = findPrimaryKeyColumn(tableData.schema);
    if (!primaryKey) return;

    const primaryKeyValue = row[primaryKey];
    if (primaryKeyValue === undefined || primaryKeyValue === null) return;

    const tableName = tableData.tableName;
    const schemaName = tableData.schemaName;

    router.push(buildRowDetailsUrl(tableName, String(primaryKeyValue), schemaName));
    onOpenChange(false);
  };

  // Filter rows based on search query
  const filteredRows = tableData?.data.filter((row) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchLower)
    );
  });

  const tables = tablesData?.tables || [];
  const columns = tableData?.schema.map((col) => col.columnName) || [];
  const primaryKey = tableData
    ? findPrimaryKeyColumn(tableData.schema)
    : undefined;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle>{t.rowDetails.selectRelatedRow}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.rowDetails.selectRelatedRowDescription} {String(currentValue ?? "NULL")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Table Selection */}
          <Field>
            <FieldLabel>{t.rowDetails.selectTable}</FieldLabel>
            {tablesLoading ? (
              <Skeleton className="h-7 w-full" />
            ) : (
              <Select
                value={selectedTable}
                onValueChange={(value) => {
                  setSelectedTable(value);
                  setSearchQuery("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.rowDetails.chooseTable} />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => {
                    const tableKey = `${table.schemaName}.${table.tableName}`;
                    return (
                      <SelectItem key={tableKey} value={tableKey}>
                        {table.schemaName}.{table.tableName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </Field>

          {/* Search Input - only show when table is selected */}
          {selectedTable && (
            <Field>
              <FieldLabel>{t.rowDetails.searchRows}</FieldLabel>
              <div className="relative">
                <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder={t.rowDetails.searchByAnyColumn}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </Field>
          )}

          {/* List of Rows */}
          {selectedTable && (
            <div className="flex-1 overflow-auto border rounded-lg">
              {tableDataLoading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredRows && filteredRows.length > 0 ? (
                <div className="divide-y">
                  {filteredRows.map((row, rowIndex) => {
                    const rowKey = primaryKey
                      ? String(row[primaryKey] ?? rowIndex)
                      : rowIndex;
                    
                    // Get primary key value for display
                    const pkValue = primaryKey ? row[primaryKey] : null;
                    
                    // Get first few non-primary key columns for preview
                    const previewColumns = columns
                      .filter((col) => col !== primaryKey)
                      .slice(0, 3);
                    
                    return (
                      <div
                        key={rowKey}
                        className={cn(
                          "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                          "flex items-center justify-between gap-4"
                        )}
                        onClick={() => handleRowClick(row)}
                      >
                        <div className="flex-1 min-w-0">
                          {pkValue !== null && (
                            <div className="font-medium text-sm mb-1 truncate">
                              <span className="text-muted-foreground">ID:</span>{" "}
                              {formatCellValue(pkValue, tableData?.schema.find(c => c.columnName === primaryKey)?.dataType)}
                            </div>
                          )}
                          {previewColumns.length > 0 && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              {previewColumns.map((column) => {
                                const columnSchema = tableData?.schema.find(
                                  (col) => col.columnName === column
                                );
                                const dataType = columnSchema?.dataType;
                                const value = row[column];
                                if (value === null || value === undefined) return null;
                                return (
                                  <div key={column} className="truncate max-w-xs">
                                    <span className="font-medium">{column}:</span>{" "}
                                    {formatCellValue(value, dataType)}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(row);
                          }}
                          title={t.rowDetails.viewRowDetails}
                        >
                          <ArrowRight className="size-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  {searchQuery
                    ? t.rowDetails.noRowsMatchSearchQuery
                    : t.rowDetails.noRowsFoundInTable}
                </div>
              )}
            </div>
          )}

          {!selectedTable && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              {t.rowDetails.selectTableToViewRows}
            </div>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

