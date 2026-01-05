"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/contexts/translation-context";
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
import { useTables, useTableData } from "@/hooks/use-postgres-query";
import { findPrimaryKeyColumn } from "@/lib/helpers/table-helpers";
import { formatCellValue } from "@/lib/helpers/table-viewer-helpers";
import { getOperatorLabel } from "@/lib/helpers/filter-helpers";
import type { ForeignKeyFilter } from "@/types/filters";
import { Skeleton } from "@/components/ui/skeleton";

interface ForeignKeyFilterProps {
  filter: ForeignKeyFilter;
  onChange: (filter: ForeignKeyFilter) => void;
  schemaName?: string;
}

export function ForeignKeyFilterComponent({
  filter,
  onChange,
  schemaName = "public",
}: ForeignKeyFilterProps) {
  const { t } = useTranslation();
  const [rowSearchQuery, setRowSearchQuery] = useState("");
  const { data: tablesData, isLoading: tablesLoading } = useTables();

  const foreignTable = filter.foreignTable || "";
  const foreignSchema = filter.foreignSchema || schemaName;
  const tableName = foreignTable.includes(".")
    ? foreignTable.split(".")[1]
    : foreignTable;

  const { data: tableData, isLoading: tableDataLoading } = useTableData({
    tableName: tableName || "",
    schemaName: foreignTable.includes(".")
      ? foreignTable.split(".")[0]
      : foreignSchema,
    page: 1,
    limit: rowSearchQuery ? 50 : 20,
    sort: undefined,
    order: "ASC",
  });

  useEffect(() => {
    if (!filter.foreignTable && tablesData?.tables && tablesData.tables.length > 0) {
      // Auto-detect foreign table from column name if possible
      const columnName = filter.column.toLowerCase();
      const matchingTable = tablesData.tables.find(
        (t) =>
          columnName.includes(t.tableName.toLowerCase()) ||
          columnName.replace(/_id$/, "").includes(t.tableName.toLowerCase())
      );
      if (matchingTable) {
        onChange({
          ...filter,
          foreignTable: `${matchingTable.schemaName}.${matchingTable.tableName}`,
          foreignSchema: matchingTable.schemaName,
        });
      }
    }
  }, [filter, tablesData, onChange]);

  const primaryKey = tableData
    ? findPrimaryKeyColumn(tableData.schema)
    : undefined;

  const foreignIdColumn = filter.foreignIdColumn || primaryKey;
  const foreignDisplayColumn =
    filter.foreignColumn ||
    tableData?.schema
      .filter((col) => col.columnName !== primaryKey)
      .map((col) => col.columnName)[0] ||
    primaryKey;

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

  const isMultiOperator = filter.operator === "in" || filter.operator === "notIn";
  const selectedValues = Array.isArray(filter.value) ? filter.value : filter.value !== undefined ? [filter.value] : [];

  const formatRowLabel = (row: Record<string, unknown>) => {
    if (!foreignIdColumn) return t.rowDetails.unknown;
    const idValue = row[foreignIdColumn];
    const idDisplay = formatCellValue(
      idValue,
      tableData?.schema.find((c) => c.columnName === foreignIdColumn)?.dataType
    );

    if (foreignDisplayColumn && foreignDisplayColumn !== foreignIdColumn) {
      const displayValue = row[foreignDisplayColumn];
      const displayFormatted = formatCellValue(
        displayValue,
        tableData?.schema.find((c) => c.columnName === foreignDisplayColumn)?.dataType
      );
      return `${idDisplay} (${displayFormatted})`;
    }

    return String(idDisplay);
  };

  const handleRowSelect = (row: Record<string, unknown>) => {
    if (!foreignIdColumn) return;
    const pkValue = row[foreignIdColumn];

    if (isMultiOperator) {
      const current = Array.isArray(filter.value) ? filter.value : [];
      if (!current.includes(pkValue)) {
        onChange({ ...filter, value: [...current, pkValue] });
      }
    } else {
      onChange({ ...filter, value: pkValue });
    }
    setRowSearchQuery("");
  };

  const tables = tablesData?.tables || [];

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <Select
          value={filter.operator}
          onValueChange={(operator) =>
            onChange({
              ...filter,
              operator: operator as ForeignKeyFilter["operator"],
              value: isMultiOperator ? [] : undefined,
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">{getOperatorLabel("equals")}</SelectItem>
            <SelectItem value="notEquals">{getOperatorLabel("notEquals")}</SelectItem>
            <SelectItem value="in">{getOperatorLabel("in")}</SelectItem>
            <SelectItem value="notIn">{getOperatorLabel("notIn")}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={foreignTable}
          onValueChange={(val) => {
            const [schema, table] = val.includes(".")
              ? val.split(".")
              : [schemaName, val];
            onChange({
              ...filter,
              foreignTable: val,
              foreignSchema: schema,
              value: undefined,
            });
            setRowSearchQuery("");
          }}
        >
          <SelectTrigger className="flex-1 min-w-[200px]">
            <SelectValue placeholder={t.filters.selectForeignTable} />
          </SelectTrigger>
          <SelectContent>
            {tablesLoading ? (
              <SelectItem value="" disabled>{t.filters.loadingTables}</SelectItem>
            ) : (
              tables.map((table) => {
                const tableKey = `${table.schemaName}.${table.tableName}`;
                return (
                  <SelectItem key={tableKey} value={tableKey}>
                    {table.schemaName}.{table.tableName}
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>
      </div>

      {foreignTable && (
        <div className="space-y-2">
          {tableDataLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              {!isMultiOperator ? (
                <Combobox
                  value={
                    selectedValues.length > 0 ? String(selectedValues[0]) : ""
                  }
                  onValueChange={(val) => {
                    if (!val) {
                      // Clear selection
                      onChange({ ...filter, value: undefined });
                      setRowSearchQuery("");
                      return;
                    }
                    // Search in all table data, not just filtered rows
                    const row =
                      tableData?.data.find(
                        (r) => String(r[foreignIdColumn!]) === val
                      ) ||
                      filteredRows.find(
                        (r) => String(r[foreignIdColumn!]) === val
                      );
                    if (row) {
                      handleRowSelect(row);
                    }
                  }}
                >
                  <ComboboxInput
                    value={rowSearchQuery}
                    onChange={(e) => setRowSearchQuery(e.target.value)}
                    placeholder={
                      selectedValues.length > 0 && tableData?.data
                        ? (() => {
                            const selectedRow = tableData.data.find(
                              (r) =>
                                String(r[foreignIdColumn!]) ===
                                String(selectedValues[0])
                            );
                            return selectedRow
                              ? formatRowLabel(selectedRow)
                              : t.rowDetails.searchAndSelectRow;
                          })()
                        : t.rowDetails.searchAndSelectRow
                    }
                    showClear={!!rowSearchQuery || selectedValues.length > 0}
                    className="w-full"
                    onFocus={() => {
                      // When focusing, if we have a selected row and no search query,
                      // clear to allow searching
                      if (selectedValues.length > 0 && !rowSearchQuery) {
                        setRowSearchQuery("");
                      }
                    }}
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      {filteredRows.length > 0 ? (
                        filteredRows.map((row) => {
                          const rowKey = String(row[foreignIdColumn!]);
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
              ) : (
                <div className="space-y-2">
                  <Combobox
                    value=""
                    onValueChange={(val) => {
                      if (!val) return;
                      // Search in all table data, not just filtered rows
                      const row =
                        tableData?.data.find(
                          (r) => String(r[foreignIdColumn!]) === val
                        ) ||
                        filteredRows.find(
                          (r) => String(r[foreignIdColumn!]) === val
                        );
                      if (row) {
                        handleRowSelect(row);
                      }
                    }}
                  >
                    <ComboboxInput
                      value={rowSearchQuery}
                      onChange={(e) => setRowSearchQuery(e.target.value)}
                      placeholder={t.filters.searchAndAddRows}
                      showClear={!!rowSearchQuery}
                      className="w-full"
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {filteredRows
                          .filter(
                            (row) =>
                              !selectedValues.includes(row[foreignIdColumn!])
                          )
                          .map((row) => {
                            const rowKey = String(row[foreignIdColumn!]);
                            return (
                              <ComboboxItem key={rowKey} value={rowKey}>
                                {formatRowLabel(row)}
                              </ComboboxItem>
                            );
                          })}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {selectedValues.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedValues.map((val) => {
                        const row = tableData?.data.find(
                          (r) => String(r[foreignIdColumn!]) === String(val)
                        );
                        return (
                          <span
                            key={String(val)}
                            className="px-2 py-1 text-xs bg-muted rounded-md flex items-center gap-1"
                          >
                            {row ? formatRowLabel(row) : String(val)}
                            <button
                              onClick={() => {
                                onChange({
                                  ...filter,
                                  value: selectedValues.filter((v) => v !== val),
                                });
                              }}
                              className="hover:text-destructive"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

