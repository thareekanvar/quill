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
import type { CardFormProps, CardFormData } from "../types";
import {
  filterDateColumns,
  filterColumnsByQueryType,
} from "../helpers/column-filters";
import { getDefaultFormValues, cardToFormData } from "../utils/form-defaults";
import {
  QUERY_TYPE_LABELS,
  AGGREGATE_LABELS,
  VALUE_COLUMN_NAMES,
} from "../constants";
import { useTranslation } from "@/contexts/translation-context";
import { SQLEditor } from "@/components/dashboard/sql-editor";

export function CardForm({
  editingCard,
  onSubmit,
  onCancel,
  isSubmitting,
  tables,
}: CardFormProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<CardFormData>({
    defaultValues: editingCard
      ? cardToFormData(editingCard)
      : getDefaultFormValues(),
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
      const formData = cardToFormData(editingCard);
      // Ensure schemaName and tableName are set properly
      reset({
        ...formData,
        schemaName: formData.schemaName || "public",
        tableName: formData.tableName || "",
      });
    } else {
      reset(getDefaultFormValues());
    }
  }, [editingCard, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-6 py-4">
      <FieldGroup>
        <Field>
          <Label htmlFor="title">{t.card.title}</Label>
          <Input
            id="title"
            placeholder={t.card.titlePlaceholder}
            {...register("title", { required: t.card.titleRequired })}
          />
          {errors.title && (
            <p className="text-sm text-destructive mt-1">
              {errors.title.message}
            </p>
          )}
        </Field>

        <Field>
          <Label htmlFor="description">{t.card.description}</Label>
          <Input
            id="description"
            placeholder={t.card.descriptionPlaceholder}
            {...register("description", {
              required: t.card.descriptionRequired,
            })}
          />
          {errors.description && (
            <p className="text-sm text-destructive mt-1">
              {errors.description.message}
            </p>
          )}
        </Field>

        <Field>
          <Label htmlFor="queryType">{t.card.queryType}</Label>
          <Controller
            name="queryType"
            control={control}
            rules={{ required: t.card.queryTypeRequired }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rowCount">{t.card.rowCount}</SelectItem>
                  <SelectItem value="sum">{t.card.sumOfColumn}</SelectItem>
                  <SelectItem value="avg">{t.card.averageOfColumn}</SelectItem>
                  <SelectItem value="min">{t.card.minimumOfColumn}</SelectItem>
                  <SelectItem value="max">{t.card.maximumOfColumn}</SelectItem>
                  <SelectItem value="countDistinct">{t.card.countDistinct}</SelectItem>
                  <SelectItem value="custom">{t.card.customQuery}</SelectItem>
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
              <Label htmlFor="schemaName">{t.card.schema}</Label>
              <Controller
                name="schemaName"
                control={control}
                rules={{
                  required: t.card.schemaRequired,
                }}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    key={`schema-${editingCard?.id || "new"}-${
                      field.value || ""
                    }`}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.card.selectSchema} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set(tables.map((t) => t.schemaName))).map(
                        (schema) => (
                          <SelectItem key={schema} value={schema}>
                            {schema}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.schemaName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.schemaName.message}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="tableName">{t.card.table}</Label>
              <Controller
                name="tableName"
                control={control}
                rules={{
                  required: t.card.tableRequired,
                }}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={!schemaName}
                    key={`table-${editingCard?.id || "new"}-${
                      schemaName || ""
                    }-${field.value || ""}`}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.card.selectTable} />
                    </SelectTrigger>
                    <SelectContent>
                      {tables
                        .filter((table) => table.schemaName === schemaName)
                        .map((table) => (
                          <SelectItem
                            key={`${table.schemaName}.${table.tableName}`}
                            value={table.tableName}
                          >
                            {table.tableName}
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
              {!schemaName && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t.card.selectTableFirst}
                </p>
              )}
            </Field>
          </>
        ) : (
          <Field>
            <Label htmlFor="query">{t.card.sqlQuery}</Label>
            <Controller
              name="query"
              control={control}
              rules={{
                required:
                  queryType === "custom" ? t.card.sqlQueryRequired : false,
              }}
              render={({ field }) => (
                <SQLEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder={t.card.sqlQueryPlaceholder}
                  height="250px"
                  tables={tables}
                />
              )}
            />
            {errors.query && (
              <p className="text-sm text-destructive mt-1">
                {errors.query.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t.card.sqlQueryDescription}
            </p>
          </Field>
        )}

        {queryType !== "custom" && queryType !== "rowCount" && (
          <Field>
            <Label htmlFor="aggregateColumn">
              {t.card.columnToAggregate.replace("{aggregate}", AGGREGATE_LABELS[queryType])}
            </Label>
            {filteredColumns.length > 0 ? (
              <Controller
                name="aggregateColumn"
                control={control}
                rules={{ required: t.card.columnRequired }}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={!tableName}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.card.selectColumn} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredColumns.map((col) => (
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
                placeholder={
                  !tableName
                    ? t.card.selectTableFirstForColumn
                    : t.card.noSuitableColumns
                }
                disabled
                className="bg-muted"
              />
            )}
            {errors.aggregateColumn && (
              <p className="text-sm text-destructive mt-1">
                {errors.aggregateColumn.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {queryType === "sum" && t.card.sumDescription}
              {queryType === "avg" && t.card.avgDescription}
              {queryType === "min" && t.card.minDescription}
              {queryType === "max" && t.card.maxDescription}
              {queryType === "countDistinct" && t.card.countDistinctDescription}
              {!tableName && (
                <span className="text-muted-foreground">
                  {" "}
                  {t.card.selectTableFirstForColumn}
                </span>
              )}
            </p>
          </Field>
        )}

        <Field>
          <Label htmlFor="valueColumn">{t.card.valueColumnName}</Label>
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
              placeholder={t.card.valueColumnPlaceholder}
              {...register("valueColumn")}
            />
          ) : (
            <Input
              id="valueColumn"
              value={VALUE_COLUMN_NAMES[queryType] || ""}
              readOnly
              className="bg-muted cursor-not-allowed"
              {...register("valueColumn")}
            />
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {queryType !== "custom" &&
              t.card.valueColumnDescription
                .replace("{queryType}", QUERY_TYPE_LABELS[queryType])
                .replace("{valueColumn}", VALUE_COLUMN_NAMES[queryType] || "")}
            {queryType === "custom" && t.card.valueColumnCustomDescription}
          </p>
        </Field>

        <Field>
          <Label htmlFor="footerText">{t.card.footerText}</Label>
          <Input
            id="footerText"
            placeholder={t.card.footerTextPlaceholder}
            {...register("footerText")}
          />
        </Field>

        {queryType !== "custom" && (
          <Field>
            <Label htmlFor="dateColumn">{t.card.dateColumn}</Label>
            {dateColumns.length > 0 ? (
              <Controller
                name="dateColumn"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || "__none__"}
                    onValueChange={(value) =>
                      field.onChange(value === "__none__" ? "" : value)
                    }
                    disabled={!tableName}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.card.selectDateColumn} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t.card.none}</SelectItem>
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
                placeholder={t.card.noDateColumns}
                disabled
                className="bg-muted"
              />
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t.card.dateColumnDescription}
              {dateColumns.length === 0 && columns.length > 0 && (
                <span className="text-destructive">
                  {" "}
                  {t.card.noDateColumnsFound}
                </span>
              )}
              {!tableName && (
                <span className="text-muted-foreground">
                  {" "}
                  {t.card.selectTableFirstForColumn}
                </span>
              )}
            </p>
          </Field>
        )}
      </FieldGroup>

      <SheetFooter className="flex flex-row justify-end gap-2 p-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {editingCard ? t.card.updateCard : t.card.createCard}
        </Button>
      </SheetFooter>
    </form>
  );
}
