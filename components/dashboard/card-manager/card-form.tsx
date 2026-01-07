"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import { useTableColumns } from "@/hooks/use-table-columns";
import type { CardFormProps, CardFormData } from "./types";
import { filterDateColumns, filterColumnsByQueryType } from "./helpers/column-filters";
import { getDefaultFormValues, cardToFormData } from "./utils/form-defaults";
import { QUERY_TYPE_LABELS, AGGREGATE_LABELS, VALUE_COLUMN_NAMES } from "./constants";

export function CardForm({
  editingCard,
  onSubmit,
  onCancel,
  isSubmitting,
  tables,
}: CardFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<CardFormData>({
    defaultValues: getDefaultFormValues(),
  });

  const queryType = watch("queryType");
  const tableName = watch("tableName");
  const schemaName = watch("schemaName");
  const valueColumn = watch("valueColumn");
  
  // Fetch columns when table is selected
  const { data: columnsData } = useTableColumns(
    queryType !== "custom" ? tableName : undefined,
    schemaName
  );
  
  const columns = columnsData?.columns || [];
  const dateColumns = filterDateColumns(columns);
  const filteredColumns = filterColumnsByQueryType(columns, queryType);

  useEffect(() => {
    if (editingCard) {
      reset({
        title: editingCard.title,
        description: editingCard.description,
        queryType: editingCard.queryType,
        tableName: editingCard.tableName || "",
        schemaName: editingCard.schemaName || "public",
        query: editingCard.query,
        valueColumn: editingCard.queryType === "rowCount" ? "count" : editingCard.queryType === "sum" ? "sum" : editingCard.queryType === "avg" ? "avg" : editingCard.queryType === "min" ? "min" : editingCard.queryType === "max" ? "max" : editingCard.queryType === "countDistinct" ? "count" : (editingCard.valueColumn || ""),
        aggregateColumn: editingCard.aggregateColumn || "",
        footerText: editingCard.footerText || "",
        dateColumn: editingCard.dateColumn || "",
      });
    } else {
      reset({
        title: "",
        description: "",
        queryType: "rowCount",
        tableName: "",
        schemaName: "public",
        query: "",
        valueColumn: "count",
        aggregateColumn: "",
        footerText: "",
        dateColumn: "",
      });
    }
  }, [editingCard, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-6 py-4">
      <FieldGroup>
        <Field>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="Total Revenue"
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && (
            <p className="text-sm text-destructive mt-1">
              {errors.title.message}
            </p>
          )}
        </Field>

        <Field>
          <Label htmlFor="description">Description *</Label>
          <Input
            id="description"
            placeholder="Total Revenue"
            {...register("description", {
              required: "Description is required",
            })}
          />
          {errors.description && (
            <p className="text-sm text-destructive mt-1">
              {errors.description.message}
            </p>
          )}
        </Field>

        <Field>
          <Label htmlFor="queryType">Query Type *</Label>
          <Controller
            name="queryType"
            control={control}
            rules={{ required: "Query type is required" }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rowCount">Row Count</SelectItem>
                  <SelectItem value="sum">Sum of Column</SelectItem>
                  <SelectItem value="avg">Average of Column</SelectItem>
                  <SelectItem value="min">Minimum of Column</SelectItem>
                  <SelectItem value="max">Maximum of Column</SelectItem>
                  <SelectItem value="countDistinct">Count Distinct</SelectItem>
                  <SelectItem value="custom">Custom Query</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.queryType && (
            <p className="text-sm text-destructive mt-1">
              {errors.queryType.message}
            </p>
          )}
        </Field>

        {queryType !== "custom" ? (
          <>
            <Field>
              <Label htmlFor="schemaName">Schema</Label>
              <Input
                id="schemaName"
                placeholder="public"
                {...register("schemaName")}
              />
            </Field>

            <Field>
              <Label htmlFor="tableName">Table *</Label>
              <Controller
                name="tableName"
                control={control}
                rules={{
                  required: "Table is required",
                }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map((table) => (
                        <SelectItem
                          key={`${table.schemaName}.${table.tableName}`}
                          value={table.tableName}
                        >
                          {table.schemaName}.{table.tableName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.tableName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.tableName.message}
                </p>
              )}
            </Field>
          </>
        ) : (
          <Field>
            <Label htmlFor="query">SQL Query *</Label>
            <Textarea
              id="query"
              placeholder="SELECT COUNT(*) as count FROM users"
              rows={6}
              {...register("query", {
                required:
                  queryType === "custom" ? "SQL query is required" : false,
              })}
            />
            {errors.query && (
              <p className="text-sm text-destructive mt-1">
                {errors.query.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              The query should return at least one row. The first row will be
              used to extract the value.
            </p>
          </Field>
        )}

        {queryType !== "custom" && queryType !== "rowCount" && (
          <Field>
            <Label htmlFor="aggregateColumn">Column to {queryType === "sum" ? "Sum" : queryType === "avg" ? "Average" : queryType === "min" ? "Find Minimum" : queryType === "max" ? "Find Maximum" : "Count Distinct"} *</Label>
            {columns.length > 0 ? (
              <Controller
                name="aggregateColumn"
                control={control}
                rules={{ required: "Column is required" }}
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns
                        .filter((col) => {
                          // For sum/avg/min/max, only show numeric columns
                          if (["sum", "avg", "min", "max"].includes(queryType)) {
                            const numericTypes = ["integer", "bigint", "smallint", "decimal", "numeric", "real", "double precision", "money"];
                            return numericTypes.some((type) => col.dataType.toLowerCase().includes(type));
                          }
                          return true; // For countDistinct, show all columns
                        })
                        .map((col) => (
                          <SelectItem key={col.columnName} value={col.columnName}>
                            {col.columnName} ({col.dataType})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <Input
                id="aggregateColumn"
                placeholder="column_name"
                {...register("aggregateColumn", { required: "Column is required" })}
              />
            )}
            {errors.aggregateColumn && (
              <p className="text-sm text-destructive mt-1">
                {errors.aggregateColumn.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {queryType === "sum" && "Select a numeric column to sum"}
              {queryType === "avg" && "Select a numeric column to calculate average"}
              {queryType === "min" && "Select a numeric column to find minimum value"}
              {queryType === "max" && "Select a numeric column to find maximum value"}
              {queryType === "countDistinct" && "Select a column to count distinct values"}
            </p>
          </Field>
        )}

        <Field>
          <Label htmlFor="valueColumn">Value Column Name</Label>
          {queryType === "rowCount" ? (
            <Input
              id="valueColumn"
              value="count"
              readOnly
              className="bg-muted cursor-not-allowed"
              {...register("valueColumn")}
            />
          ) : queryType === "custom" ? (
            <Input
              id="valueColumn"
              placeholder="count, total, amount, etc."
              {...register("valueColumn")}
            />
          ) : (
            <Input
              id="valueColumn"
              value={queryType === "sum" ? "sum" : queryType === "avg" ? "avg" : queryType === "min" ? "min" : queryType === "max" ? "max" : "count"}
              readOnly
              className="bg-muted cursor-not-allowed"
              {...register("valueColumn")}
            />
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {queryType === "rowCount" && "For Row Count, this is automatically set to 'count'"}
            {queryType === "sum" && "For Sum, this is automatically set to 'sum'"}
            {queryType === "avg" && "For Average, this is automatically set to 'avg'"}
            {queryType === "min" && "For Minimum, this is automatically set to 'min'"}
            {queryType === "max" && "For Maximum, this is automatically set to 'max'"}
            {queryType === "countDistinct" && "For Count Distinct, this is automatically set to 'count'"}
            {queryType === "custom" && "Column name from query result to display as the main value"}
          </p>
        </Field>

        <Field>
          <Label htmlFor="footerText">Footer Text</Label>
          <Input
            id="footerText"
            placeholder="Additional information"
            {...register("footerText")}
          />
        </Field>

        <Field>
          <Label htmlFor="dateColumn">Date Column (for filtering)</Label>
          {queryType !== "custom" && dateColumns.length > 0 ? (
            <Controller
              name="dateColumn"
              control={control}
              render={({ field }) => (
                <Select 
                  value={field.value || "__none__"} 
                  onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a date column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {dateColumns.map((col) => (
                      <SelectItem key={col.columnName} value={col.columnName}>
                        {col.columnName} ({col.dataType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          ) : (
            <Input
              id="dateColumn"
              placeholder="created_at, updated_at, date, etc."
              {...register("dateColumn")}
            />
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Column name to use for date range filtering (optional). Must be a
            date/timestamp column.
            {queryType !== "custom" && dateColumns.length === 0 && columns.length > 0 && (
              <span className="text-destructive"> No date columns found in this table.</span>
            )}
          </p>
        </Field>
      </FieldGroup>

      <SheetFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {editingCard ? "Update" : "Create"} Card
        </Button>
      </SheetFooter>
    </form>
  );
}

