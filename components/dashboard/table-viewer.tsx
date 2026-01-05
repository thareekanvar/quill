"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTableData, useExecuteQuery } from "@/hooks/use-postgres-query";
import { PasswordModal } from "./password-modal";
import { FilterPanel } from "./filter-panel";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pencil,
  Trash,
  CaretLeft,
  CaretRight,
  ArrowsDownUp,
  CaretUp,
  CaretDown,
  Plus,
  WarningCircle,
  Download,
} from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { TableViewerProps, PendingAction } from "@/types";
import type { Filter } from "@/types/filters";
import {
  createDeleteHandler,
  formatCellValue,
} from "@/lib/helpers/table-viewer-helpers";
import {
  calculateTotalPages,
  getPaginationRangeText,
} from "@/lib/helpers/pagination-helpers";
import {
  findPrimaryKeyColumn,
  buildRowDetailsUrl,
  buildNewRowUrl,
} from "@/lib/helpers";
import { hasFilterValue } from "@/lib/helpers/filter-helpers";
import { haveActiveFiltersChanged } from "@/lib/helpers/filter-comparison-helpers";
import { useTableSchemaStore } from "@/lib/stores/table-schema-store";
import { DEFAULT_SCHEMA, DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { useTranslation } from "@/contexts/translation-context";
import { exportToCSV, exportToJSON } from "@/lib/utils/export-helpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * TableViewer component displays a paginated, sortable, and filterable table
 * @param tableName - The name of the table to display
 * @param schemaName - The schema name (defaults to "public")
 */
export function TableViewer({
  tableName,
  schemaName = DEFAULT_SCHEMA,
}: TableViewerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_PAGE_SIZE);
  const [sortColumn, setSortColumn] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );

  // Only send filters that have values to avoid unnecessary refreshes
  const activeFilters = filters.filter(hasFilterValue);

  const { data, isLoading, error, refetch } = useTableData({
    tableName,
    schemaName,
    page,
    limit,
    sort: sortColumn,
    order: sortOrder,
    filters: activeFilters,
  });

  const { setSchema, getSchema } = useTableSchemaStore();

  // Save schema to store when data is available
  useEffect(() => {
    if (data?.schema && data.schema.length > 0) {
      setSchema(tableName, schemaName, data.schema);
    }
  }, [data?.schema, tableName, schemaName, setSchema]);

  // Use current schema or fallback to persisted schema from store
  const persistedSchema = getSchema(tableName, schemaName);
  const availableSchema =
    data?.schema && data.schema.length > 0
      ? data.schema
      : persistedSchema || [];

  const executeQuery = useExecuteQuery();

  /**
   * Handle column sort click - cycles through ASC -> DESC -> Reset
   */
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Cycle through: ASC -> DESC -> Reset
      if (sortOrder === "ASC") {
        setSortOrder("DESC");
      } else {
        // Reset sort
        setSortColumn(undefined);
        setSortOrder("ASC");
      }
    } else {
      setSortColumn(column);
      setSortOrder("ASC");
    }
    // Reset to first page when sorting changes
    setPage(1);
  };

  /**
   * Handle filter changes and reset page if active filters changed
   */
  const handleFiltersChange = (newFilters: Filter[]) => {
    setFilters(newFilters);

    // If active filters changed, reset to page 1
    if (haveActiveFiltersChanged(filters, newFilters)) {
      setPage(1);
    }
  };

  /**
   * Handle row click to navigate to row details
   */
  const handleRowClick = (
    row: Record<string, unknown>,
    e: React.MouseEvent
  ) => {
    // Don't navigate if clicking on action buttons
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }

    if (!data) return;

    // Get primary key value from row
    const primaryKey = findPrimaryKeyColumn(data.schema);
    if (!primaryKey) {
      toast.error(t.table.cannotDeterminePrimaryKey);
      return;
    }

    const primaryKeyValue = row[primaryKey];
    if (primaryKeyValue === undefined || primaryKeyValue === null) {
      toast.error(t.table.primaryKeyMissing);
      return;
    }

    router.push(
      buildRowDetailsUrl(tableName, String(primaryKeyValue), schemaName)
    );
  };

  /**
   * Handle add button click to navigate to new row page
   */
  const handleAdd = () => {
    router.push(buildNewRowUrl(tableName, schemaName));
  };

  /**
   * Handle export to CSV
   */
  const handleExportCSV = () => {
    if (!data || !data.data || data.data.length === 0) {
      toast.error(t.table.noDataToExport);
      return;
    }

    const columns = data.schema.map((col) => col.columnName);
    const filename = `${tableName}-${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(data.data, filename, columns);
    toast.success(t.table.exportedSuccessfully);
  };

  /**
   * Handle export to JSON
   */
  const handleExportJSON = () => {
    if (!data || !data.data || data.data.length === 0) {
      toast.error(t.table.noDataToExport);
      return;
    }

    const filename = `${tableName}-${new Date().toISOString().split('T')[0]}.json`;
    exportToJSON(data.data, filename);
    toast.success(t.table.exportedSuccessfully);
  };

  /**
   * Handle edit button click to navigate to row details
   */
  const handleEdit = (row: Record<string, unknown>, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!data) return;

    // Get primary key value from row
    const primaryKey = findPrimaryKeyColumn(data.schema);
    if (!primaryKey) {
      toast.error(t.table.cannotDeterminePrimaryKey);
      return;
    }

    const primaryKeyValue = row[primaryKey];
    if (primaryKeyValue === undefined || primaryKeyValue === null) {
      toast.error(t.table.primaryKeyMissing);
      return;
    }

    router.push(
      buildRowDetailsUrl(tableName, String(primaryKeyValue), schemaName)
    );
  };

  /**
   * Handle delete button click to open password confirmation modal
   */
  const handleDelete = (row: Record<string, unknown>, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingAction({ type: "delete", row });
    setPasswordModalOpen(true);
  };

  /**
   * Handle password confirmation for delete/edit actions
   */
  const handlePasswordConfirm = async () => {
    if (!pendingAction || !data) return;

    try {
      if (pendingAction.type === "delete") {
        const deleteHandler = createDeleteHandler(
          data,
          tableName,
          pendingAction
        );

        if (!deleteHandler) {
          throw new Error("Failed to create delete handler");
        }

        await executeQuery.mutateAsync({
          query: deleteHandler.query,
          params: deleteHandler.params,
        });

        toast.success(t.table.rowDeletedSuccessfully);
      } else if (pendingAction.type === "edit") {
        // For edit, we'll show a simple message - full edit form can be added later
        toast.info("Edit functionality - to be implemented with form");
      }

      refetch();
      setPendingAction(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t.table.operationFailed;
      toast.error(errorMessage);
    }
  };

  const columns = data?.schema?.map((col) => col.columnName) || [];
  const totalPages = data ? calculateTotalPages(data.total, data.limit) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {data?.schemaName || schemaName}.{tableName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? t.table.loading
              : error
              ? t.table.errorLoading
              : data
              ? `${data.total} ${t.table.totalRows}`
              : t.common.noData}
          </p>
        </div>
        <div className="flex gap-2">
          {data && data.data && data.data.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isLoading || !!error}
                >
                  <Download className="size-4 mr-2" />
                  {t.table.export}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  {t.table.exportCSV}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJSON}>
                  {t.table.exportJSON}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            onClick={handleAdd}
            variant="default"
            disabled={isLoading || !!error}
          >
            <Plus className="size-4 mr-2" />
            {t.table.addRow}
          </Button>
        </div>
      </div>

      <FilterPanel
        columns={availableSchema}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        schemaName={schemaName}
      />

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            {columns.length > 0 && (
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column}
                      className="bg-muted/50 cursor-pointer select-none hover:bg-muted transition-colors"
                      onClick={() => handleSort(column)}
                    >
                      <div className="flex items-center gap-2">
                        {column}
                        {sortColumn === column ? (
                          sortOrder === "ASC" ? (
                            <CaretUp
                              className="size-3 text-foreground"
                              weight="fill"
                            />
                          ) : (
                            <CaretDown
                              className="size-3 text-foreground"
                              weight="fill"
                            />
                          )
                        ) : (
                          <ArrowsDownUp className="size-3 text-muted-foreground opacity-50" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-24 bg-muted sticky right-0 z-10 border-l-2 border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
            )}
            <TableBody>
              {isLoading ? (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {columns.length > 0 ? (
                        <>
                          {columns.map((_, j) => (
                            <TableCell key={j} className="w-full">
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                          <TableCell className="w-24 sticky right-0 z-10 bg-background border-l-2 border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                            <div className="flex gap-2">
                              <Skeleton className="h-8 w-8" />
                              <Skeleton className="h-8 w-8" />
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <TableCell key={j} className="w-full">
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                          <TableCell className="w-24 sticky right-0 z-10 bg-background border-l-2 border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                            <div className="flex gap-2">
                              <Skeleton className="h-8 w-8" />
                              <Skeleton className="h-8 w-8" />
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="h-32 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <WarningCircle className="size-8 text-destructive" />
                      <p className="text-sm font-medium text-destructive">
                        {t.table.errorLoadingTable}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {error.message ||
                          t.table.errorOccurred}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !data || !data.data || data.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="h-32 text-center"
                  >
                    <p className="text-muted-foreground">
                      {t.table.noDataFound}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map(
                  (row: Record<string, unknown>, rowIndex: number) => (
                    <TableRow
                      key={rowIndex}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={(e) => handleRowClick(row, e)}
                    >
                      {columns.map((column) => {
                        const columnSchema = data.schema.find(
                          (col) => col.columnName === column
                        );
                        const dataType = columnSchema?.dataType;
                        return (
                          <TableCell key={column} className="max-w-xs truncate">
                            {formatCellValue(row[column], dataType)}
                          </TableCell>
                        );
                      })}
                      <TableCell onClick={(e) => e.stopPropagation()} className="sticky right-0 z-10 bg-background border-l-2 border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={(e) => handleEdit(row, e)}
                            title={t.table.edit}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={(e) => handleDelete(row, e)}
                            title={t.table.delete}
                          >
                            <Trash className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {data && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {getPaginationRangeText(page, limit, data.total, {
              showing: t.pagination.showing,
              to: t.pagination.to,
              of: t.pagination.of,
              results: t.pagination.results,
            })}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <CaretLeft className="size-4" />
              {t.common.previous}
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {t.common.page} {page} {t.common.of} {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              {t.common.next}
              <CaretRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <PasswordModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        onConfirm={handlePasswordConfirm}
        title={t.table.confirmPassword}
        description={t.table.confirmPasswordDescription}
      />
    </div>
  );
}
