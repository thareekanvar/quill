"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { useTables, useTableData } from "@/hooks/use-postgres-query";
import { findPrimaryKeyColumn } from "@/lib/helpers/table-helpers";
import { formatCellValue } from "@/lib/helpers/table-viewer-helpers";
import type { TableColumn } from "@/types";
import { ArrowRight } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/contexts/translation-context";

interface ForeignKeyFieldProps {
  column: TableColumn;
  value: unknown;
  onChange: (value: unknown) => void;
  schemaName?: string;
}

export function ForeignKeyField({
  column,
  value,
  onChange,
  schemaName = "public",
}: ForeignKeyFieldProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [rowSearchQuery, setRowSearchQuery] = useState("");

  const { data: tablesData, isLoading: tablesLoading } = useTables();

  // Try to detect table from existing value - check if value exists in any table
  useEffect(() => {
    if (value !== null && value !== undefined && !selectedTable && tablesData?.tables) {
      // We could try to detect the table, but for now, just ensure we show the value
      // The user will need to select the table manually
    }
  }, [value, selectedTable, tablesData]);

  const { data: tableData, isLoading: tableDataLoading } = useTableData({
    tableName: selectedTable.split(".")[1] || selectedTable,
    schemaName: selectedTable.includes(".")
      ? selectedTable.split(".")[0]
      : schemaName,
    page: 1,
    limit: rowSearchQuery ? 50 : 20, // Show more when searching
    sort: undefined,
    order: "ASC",
  });

  // Reset row search when table changes
  useEffect(() => {
    setRowSearchQuery("");
  }, [selectedTable]);

  const tables = tablesData?.tables || [];
  const primaryKey = tableData
    ? findPrimaryKeyColumn(tableData.schema)
    : undefined;

  // Filter rows based on search query
  const filteredRows = useMemo(() => {
    if (!tableData?.data) return [];
    if (!rowSearchQuery) return tableData.data.slice(0, 20);

    const searchLower = rowSearchQuery.toLowerCase();
    return tableData.data.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(searchLower)
      )
    );
  }, [tableData?.data, rowSearchQuery]);

  // Get preview columns (first 2 non-primary key columns)
  const previewColumns = useMemo(() => {
    if (!tableData?.schema) return [];
    return tableData.schema
      .map((col) => col.columnName)
      .filter((col) => col !== primaryKey)
      .slice(0, 2);
  }, [tableData?.schema, primaryKey]);

  const handleRowSelect = (row: Record<string, unknown>) => {
    if (!primaryKey) return;
    const pkValue = row[primaryKey];
    onChange(pkValue);
  };

  // Find currently selected row
  const selectedRow = useMemo(() => {
    if (!tableData?.data || !primaryKey || value === null || value === undefined)
      return null;
    return (
      tableData.data.find(
        (row) => String(row[primaryKey]) === String(value)
      ) || null
    );
  }, [tableData?.data, primaryKey, value]);

  // Format row for display
  const formatRowLabel = (row: Record<string, unknown>) => {
    if (!primaryKey) return "Unknown";
    const pkValue = row[primaryKey];
    const pkDisplay = formatCellValue(
      pkValue,
      tableData?.schema.find((c) => c.columnName === primaryKey)?.dataType
    );

    if (previewColumns.length === 0) return pkDisplay;

    const previews = previewColumns
      .map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return null;
        return `${col}: ${formatCellValue(
          val,
          tableData?.schema.find((c) => c.columnName === col)?.dataType
        )}`;
      })
      .filter(Boolean)
      .join(", ");

    return previews ? `${pkDisplay} (${previews})` : pkDisplay;
  };

  const selectedRowValue = selectedRow
    ? String(selectedRow[primaryKey!])
    : "";

  const handleGoToDetails = () => {
    if (!selectedRow || !tableData || !primaryKey) return;

    const primaryKeyValue = selectedRow[primaryKey];
    if (primaryKeyValue === undefined || primaryKeyValue === null) return;

    const tableName = tableData.tableName;
    const schemaName = tableData.schemaName;
    const encodedRowId = encodeURIComponent(String(primaryKeyValue));
    const schemaParam =
      schemaName !== "public"
        ? `?schema=${encodeURIComponent(schemaName)}`
        : "";

    router.push(`/dashboard/tables/${tableName}/${encodedRowId}${schemaParam}`);
  };

  return (
    <Field>
      <FieldLabel htmlFor={column.columnName}>
        {column.columnName}
        {column.isNullable === "NO" && (
          <span className="text-destructive ml-1">*</span>
        )}
        <span className="text-xs text-muted-foreground ml-2">
          ({t.rowDetails.foreignKey})
        </span>
      </FieldLabel>

      {tablesLoading || (selectedTable && tableDataLoading) ? (
        <Skeleton className="h-7 w-full" />
      ) : (
        <InputGroup className="gap-0 overflow-hidden">
          {/* Prefix: Table Selector */}
          <InputGroupAddon 
            align="inline-start" 
            className="min-w-[160px] max-w-[200px] pr-1.5 shrink-0 relative after:content-[''] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-4 after:w-px after:bg-border"
          >
            {tablesLoading ? (
              <Skeleton className="h-5 w-full" />
            ) : (
              <Select
                value={selectedTable}
                onValueChange={(val) => {
                  setSelectedTable(val);
                  onChange(null);
                }}
              >
                <SelectTrigger className="h-auto border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 p-0 text-xs font-medium hover:bg-transparent">
                  <SelectValue placeholder={t.rowDetails.selectTablePlaceholder} />
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
          </InputGroupAddon>

          {/* Main: Row Selector */}
          {selectedTable ? (
            <div className="flex-1 min-w-0">
              <Combobox
                value={selectedRowValue}
                onValueChange={(val) => {
                  const row = filteredRows.find(
                    (r) => String(r[primaryKey!]) === val
                  );
                  if (row) {
                    handleRowSelect(row);
                    setRowSearchQuery("");
                  }
                }}
              >
                <ComboboxInput
                  value={rowSearchQuery}
                  onChange={(e) => setRowSearchQuery(e.target.value)}
                  placeholder={
                    selectedRow
                      ? formatRowLabel(selectedRow)
                      : t.rowDetails.searchAndSelectRow
                  }
                  showClear={!!rowSearchQuery || !!selectedRow}
                  className="w-full"
                  onFocus={() => {
                    // When focusing, if we have a selected row and no search query,
                    // clear to allow searching
                    if (selectedRow && !rowSearchQuery) {
                      setRowSearchQuery("");
                    }
                  }}
                />
                <ComboboxContent>
                  <ComboboxList>
                    {filteredRows.length > 0 ? (
                      filteredRows.map((row) => {
                        const rowKey = String(row[primaryKey!]);
                        return (
                          <ComboboxItem key={rowKey} value={rowKey}>
                            {formatRowLabel(row)}
                          </ComboboxItem>
                        );
                      })
                    ) : (
                      <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                        {rowSearchQuery
                          ? t.rowDetails.noRowsMatchSearch
                          : t.rowDetails.noRowsFound}
                      </div>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          ) : (
            <div className="flex-1 px-3 py-1.5 text-xs min-h-[28px] flex items-center min-w-0">
              {value !== null && value !== undefined ? (
                <span className="text-foreground truncate">
                  {String(value)}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {t.rowDetails.selectTableToChooseRow}
                </span>
              )}
            </div>
          )}

          {/* Suffix: Go to Details Button */}
          {selectedRow && (
            <InputGroupAddon align="inline-end" className="pl-1.5 shrink-0 relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-px before:bg-border">
              <InputGroupButton
                type="button"
                onClick={handleGoToDetails}
                title={t.rowDetails.goToRowDetails}
                className="hover:bg-accent"
              >
                <ArrowRight className="size-4" />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      )}
    </Field>
  );
}

