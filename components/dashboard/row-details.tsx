"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useExecuteQuery,
  useTableData,
  useTableRow,
} from "@/hooks/use-postgres-query";
import {
  findPrimaryKeyColumn,
  looksLikeForeignKey,
} from "@/lib/helpers/table-helpers";
import {
  buildUpdateQuery,
  buildInsertQuery,
  getUpdatableColumns,
  getInsertableColumns,
  prepareUpdateParams,
  prepareInsertParams,
} from "@/lib/helpers/row-details-helpers";
import {
  getInputType,
  isArrayValue,
  isObjectValue,
  isDateTimeType,
} from "@/lib/helpers/type-helpers";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { TableViewerProps } from "@/types";
import { FloppyDisk, Download } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { PasswordModal } from "./password-modal";
import { buildTableUrl } from "@/lib/helpers/url-helpers";
import { DEFAULT_SCHEMA } from "@/lib/constants";
import { useTranslation } from "@/contexts/translation-context";
import { exportToCSV, exportToJSON } from "@/lib/utils/export-helpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PrimaryKeyField,
  PrimaryKeyInputField,
  BooleanField,
  ArrayField,
  ObjectField,
  TextField,
  DateField,
  ForeignKeyField,
  RowDetailsLoadingState,
  RowDetailsErrorState,
} from "./row-details/index";

interface RowDetailsProps extends TableViewerProps {
  primaryKeyValue: string;
}

/**
 * RowDetails component for viewing and editing a single table row
 * @param tableName - The name of the table
 * @param schemaName - The schema name (defaults to "public")
 * @param primaryKeyValue - The primary key value of the row, or "new" for creating a new row
 */
export function RowDetails({
  tableName,
  schemaName = DEFAULT_SCHEMA,
  primaryKeyValue,
}: RowDetailsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { connectionId } = useAuthStore();

  const form = useForm<Record<string, unknown>>({
    defaultValues: {},
    mode: "onChange",
  });

  const { control, handleSubmit, reset, formState } = form;

  // First, fetch schema to find the primary key column
  const { data: schemaData, isLoading: schemaLoading } = useTableData({
    tableName,
    schemaName,
    page: 1,
    limit: 1, // We only need the schema
  });

  const primaryKeyColumn = schemaData?.schema
    ? findPrimaryKeyColumn(schemaData.schema)
    : undefined;

  const isNewRow = primaryKeyValue === "new";

  // Only fetch row data if we're editing an existing row
  // Pass undefined as primaryKeyValue when creating new row to disable the query
  const {
    data: rowData,
    isLoading: rowLoading,
    error,
  } = useTableRow(
    tableName,
    schemaName,
    primaryKeyColumn || "",
    isNewRow ? undefined : primaryKeyValue
  );

  const executeQuery = useExecuteQuery();

  const isLoading = schemaLoading || (rowLoading && !isNewRow);

  // Update form data when row is loaded (only for existing rows)
  useEffect(() => {
    if (rowData?.row && !isNewRow) {
      reset(rowData.row);
    }
  }, [rowData, reset, isNewRow]);

  const onSubmit = async () => {
    if (!connectionId) {
      toast.error(t.table.noActiveConnection);
      return;
    }
    setPasswordModalOpen(true);
  };

  /**
   * Handle export to CSV
   */
  const handleExportCSV = () => {
    if (!rowData?.row || isNewRow) {
      toast.error(t.table.noDataToExport);
      return;
    }

    const columns = schemaData?.schema.map((col) => col.columnName) || [];
    const filename = `${tableName}-row-${primaryKeyValue}-${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV([rowData.row], filename, columns);
    toast.success(t.table.exportedSuccessfully);
  };

  /**
   * Handle export to JSON
   */
  const handleExportJSON = () => {
    if (!rowData?.row || isNewRow) {
      toast.error(t.table.noDataToExport);
      return;
    }

    const filename = `${tableName}-row-${primaryKeyValue}-${new Date().toISOString().split('T')[0]}.json`;
    exportToJSON([rowData.row], filename);
    toast.success(t.table.exportedSuccessfully);
  };

  const handlePasswordConfirm = async () => {
    if (!schemaData || !connectionId) return;

    setIsSaving(true);
    try {
      const formData = form.getValues();

      if (isNewRow) {
        // Insert new row
        const columns = getInsertableColumns(
          schemaData.schema,
          primaryKeyColumn
        );
        const query = buildInsertQuery(
          schemaData.schemaName,
          tableName,
          columns
        );
        const params = prepareInsertParams(
          formData,
          columns,
          schemaData.schema
        );

        await executeQuery.mutateAsync({
          query,
          params,
        });

        toast.success(t.rowDetails.rowCreatedSuccessfully);
        // Navigate back to table view
        router.push(buildTableUrl(tableName, schemaName));
      } else {
        // Update existing row
        if (!primaryKeyColumn) {
          throw new Error("Primary key column is required for updates");
        }

        const columns = getUpdatableColumns(
          schemaData.schema,
          primaryKeyColumn
        );
        const query = buildUpdateQuery(
          schemaData.schemaName,
          tableName,
          columns,
          primaryKeyColumn
        );
        const params = prepareUpdateParams(
          formData,
          columns,
          schemaData.schema,
          primaryKeyColumn
        );

        await executeQuery.mutateAsync({
          query,
          params,
        });

        toast.success(t.rowDetails.rowSavedSuccessfully);
        router.back();
      }
    } catch (error) {
      // Error - let PasswordModal handle displaying it, don't close modal
      const errorMessage =
        error instanceof Error ? error.message : t.rowDetails.failedToSave;
      // Re-throw so PasswordModal can catch and display it
      throw new Error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <RowDetailsLoadingState />;
  }

  // For new rows, we don't need rowData. For existing rows, we need it.
  if (!isNewRow && (error || !rowData?.row || !schemaData?.schema)) {
    return <RowDetailsErrorState message={error?.message} />;
  }

  // For new rows, we still need schema
  if (isNewRow && !schemaData?.schema) {
    return <RowDetailsErrorState message={t.rowDetails.failedToLoadTableSchema} />;
  }

  // Ensure schemaData exists before rendering
  if (!schemaData?.schema) {
    return <RowDetailsErrorState message={t.rowDetails.failedToLoadTableSchema} />;
  }

  const primaryKey = primaryKeyColumn;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{isNewRow ? t.rowDetails.newRow : t.common.rowDetails}</CardTitle>
            <div className="flex gap-2">
              {!isNewRow && rowData?.row && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSaving}
                    >
                      <Download className="size-4 mr-2" />
                      {t.table["export"]}
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
                type="submit"
                disabled={isSaving || (!isNewRow && !formState.isDirty)}
              >
                <FloppyDisk className="size-4 mr-2" />
                {isSaving
                  ? t.rowDetails.saving
                  : isNewRow
                  ? t.rowDetails.newRow
                  : t.rowDetails.save}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {schemaData.schema.map((column) => {
            const inputType = getInputType(column);
            const isPrimaryKey = column.columnName === primaryKey;
            const dataType = column.dataType.toLowerCase();
            const isSerial =
              dataType === "serial" ||
              dataType === "bigserial" ||
              dataType === "smallserial";

            // Skip auto-generated SERIAL columns when creating new rows
            if (isNewRow && isSerial) {
              return null;
            }

            // Primary keys are read-only when editing, but editable when creating new row
            if (isPrimaryKey && !isNewRow) {
              return (
                <PrimaryKeyField
                  key={column.columnName}
                  column={column}
                  value={form.watch(column.columnName)}
                />
              );
            }

            // For new rows, primary keys should be editable (use PrimaryKeyInputField with generate button)
            if (isPrimaryKey && isNewRow) {
              return (
                <Controller
                  key={column.columnName}
                  name={column.columnName}
                  control={control}
                  render={({ field }) => (
                    <PrimaryKeyInputField
                      column={column}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              );
            }

            // Boolean fields - use Switch with Controller
            if (inputType === "switch") {
              return (
                <Controller
                  key={column.columnName}
                  name={column.columnName}
                  control={control}
                  render={({ field }) => (
                    <BooleanField
                      column={column}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              );
            }

            // Array fields - use Accordion (read-only)
            const arrayValue = form.watch(column.columnName);
            if (inputType === "array" || isArrayValue(arrayValue)) {
              return (
                <ArrayField
                  key={column.columnName}
                  column={column}
                  value={arrayValue}
                />
              );
            }

            // Object/JSON fields - use Textarea with Controller
            const objectValue = form.watch(column.columnName);
            if (isObjectValue(objectValue)) {
              return (
                <Controller
                  key={column.columnName}
                  name={column.columnName}
                  control={control}
                  render={({ field }) => (
                    <ObjectField
                      column={column}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              );
            }

            // Check if column looks like a foreign key
            if (looksLikeForeignKey(column.columnName, false)) {
              return (
                <Controller
                  key={column.columnName}
                  name={column.columnName}
                  control={control}
                  render={({ field }) => (
                    <ForeignKeyField
                      column={column}
                      value={field.value}
                      onChange={field.onChange}
                      schemaName={schemaName}
                    />
                  )}
                />
              );
            }

            // Date/time fields - use Calendar component
            if (isDateTimeType(column.dataType)) {
              return (
                <Controller
                  key={column.columnName}
                  name={column.columnName}
                  control={control}
                  render={({ field }) => (
                    <DateField
                      column={column}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              );
            }

            // Text/number fields - use Input
            return (
              <Controller
                key={column.columnName}
                name={column.columnName}
                control={control}
                render={({ field }) => (
                  <TextField
                    column={column}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            );
          })}
        </CardContent>
      </Card>

      <PasswordModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        onConfirm={handlePasswordConfirm}
        title={t.rowDetails.confirmPassword}
        description={t.rowDetails.confirmPasswordDescription}
      />
    </form>
  );
}
