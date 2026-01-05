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
import type { ChartFormProps, ChartFormData } from "../types";
import { filterColumnsForChart } from "../helpers/column-filters";
import { getDefaultFormValues, chartToFormData } from "../utils/form-defaults";
import { CHART_TYPE_LABELS, MULTI_SERIES_CHART_TYPES, XY_AXIS_CHART_TYPES } from "../constants";
import { useTranslation } from "@/contexts/translation-context";
import { SQLEditor } from "@/components/dashboard/sql-editor";

export function ChartForm({
  editingChart,
  onSubmit,
  onCancel,
  isSubmitting,
  tables,
}: ChartFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChartFormData>({
    defaultValues: editingChart
      ? chartToFormData(editingChart)
      : getDefaultFormValues(),
  });

  const chartType = watch("chartType");
  const tableName = watch("tableName");
  const schemaName = watch("schemaName");
  const query = watch("query");
  const useCustomQuery = !!query?.trim();

  // Fetch columns when table is selected
  const { data: columnsData } = useTableColumns(
    !useCustomQuery ? tableName : undefined,
    schemaName
  );

  const columns = columnsData?.columns || [];
  const { xAxisColumns, yAxisColumns, seriesColumns } = filterColumnsForChart(columns);

  useEffect(() => {
    if (editingChart) {
      const formData = chartToFormData(editingChart);
      reset({
        ...formData,
        schemaName: formData.schemaName || "public",
        tableName: formData.tableName || "",
      });
    } else {
      reset(getDefaultFormValues());
    }
  }, [editingChart, reset]);

  const needsXYAxis = XY_AXIS_CHART_TYPES.includes(chartType as any) || chartType === "pie" || chartType === "radial";
  const supportsMultiSeries = MULTI_SERIES_CHART_TYPES.includes(chartType as any);
  const { t } = useTranslation();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-6 py-4">
      <FieldGroup>
        <Field>
          <Label htmlFor="title">{t.chart.title}</Label>
          <Input
            id="title"
            placeholder={t.chart.titlePlaceholder}
            {...register("title", { required: t.chart.titleRequired })}
          />
          {errors.title && (
            <p className="text-sm text-destructive mt-1">
              {errors.title.message}
            </p>
          )}
        </Field>

        <Field>
          <Label htmlFor="description">{t.chart.description}</Label>
          <Input
            id="description"
            placeholder={t.chart.descriptionPlaceholder}
            {...register("description", {
              required: t.chart.descriptionRequired,
            })}
          />
          {errors.description && (
            <p className="text-sm text-destructive mt-1">
              {errors.description.message}
            </p>
          )}
        </Field>

        <Field>
          <Label htmlFor="chartType">{t.chart.chartType}</Label>
          <Controller
            name="chartType"
            control={control}
            rules={{ required: t.chart.chartTypeRequired }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">{t.chart.barChart}</SelectItem>
                  <SelectItem value="line">{t.chart.lineChart}</SelectItem>
                  <SelectItem value="area">{t.chart.areaChart}</SelectItem>
                  <SelectItem value="pie">{t.chart.pieChart}</SelectItem>
                  <SelectItem value="radar">{t.chart.radarChart}</SelectItem>
                  <SelectItem value="radial">{t.chart.radialChart}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.chartType && (
            <p className="text-sm text-destructive mt-1">
              {errors.chartType.message}
            </p>
          )}
        </Field>

        <Field>
          <Label htmlFor="query">{t.chart.sqlQuery}</Label>
          <Controller
            name="query"
            control={control}
            render={({ field }) => (
              <SQLEditor
                value={field.value || ""}
                onChange={field.onChange}
                placeholder={t.chart.sqlQueryPlaceholder}
                height="250px"
                tables={tables}
              />
            )}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t.chart.sqlQueryDescription}
          </p>
        </Field>

        {!useCustomQuery ? (
          <>
            <Field>
              <Label htmlFor="schemaName">{t.chart.schema}</Label>
              <Controller
                name="schemaName"
                control={control}
                rules={{
                  required: t.chart.schemaRequired,
                }}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    key={`schema-${editingChart?.id || "new"}-${
                      field.value || ""
                    }`}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.chart.selectSchema} />
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
              <Label htmlFor="tableName">{t.chart.table}</Label>
              <Controller
                name="tableName"
                control={control}
                rules={{
                  required: t.chart.tableRequired,
                }}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={!schemaName}
                    key={`table-${editingChart?.id || "new"}-${
                      schemaName || ""
                    }-${field.value || ""}`}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.chart.selectTable} />
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
            </Field>
          </>
        ) : null}

        {needsXYAxis && (
          <>
            <Field>
              <Label htmlFor="xAxisColumn">
                {chartType === "pie" || chartType === "radial" ? t.chart.labelColumn : t.chart.xAxisColumn}
              </Label>
              {useCustomQuery ? (
                <Input
                  id="xAxisColumn"
                  placeholder={t.chart.categoryPlaceholder}
                  {...register("xAxisColumn", {
                    required: !useCustomQuery ? false : t.chart.xAxisColumnRequired,
                  })}
                />
              ) : xAxisColumns.length > 0 ? (
                <Controller
                  name="xAxisColumn"
                  control={control}
                  rules={{ required: t.chart.xAxisColumnRequired }}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={!tableName}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.chart.selectColumn} />
                      </SelectTrigger>
                      <SelectContent>
                        {xAxisColumns.map((col) => (
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
                  id="xAxisColumn"
                  placeholder={
                    !tableName
                      ? t.chart.selectTableFirst
                      : t.chart.noColumnsAvailable
                  }
                  disabled
                  className="bg-muted"
                />
              )}
              {errors.xAxisColumn && (
                <p className="text-sm text-destructive mt-1">
                  {errors.xAxisColumn.message}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="yAxisColumn">
                {chartType === "pie" || chartType === "radial" ? t.chart.valueColumn : t.chart.yAxisColumn}
              </Label>
              {useCustomQuery ? (
                <Input
                  id="yAxisColumn"
                  placeholder={t.chart.totalPlaceholder}
                  {...register("yAxisColumn", {
                    required: !useCustomQuery ? false : t.chart.yAxisColumnRequired,
                  })}
                />
              ) : yAxisColumns.length > 0 ? (
                <Controller
                  name="yAxisColumn"
                  control={control}
                  rules={{ required: t.chart.yAxisColumnRequired }}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={!tableName}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.chart.selectColumn} />
                      </SelectTrigger>
                      <SelectContent>
                        {yAxisColumns.map((col) => (
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
                  id="yAxisColumn"
                  placeholder={
                    !tableName
                      ? t.chart.selectTableFirst
                      : t.chart.noNumericColumnsAvailable
                  }
                  disabled
                  className="bg-muted"
                />
              )}
              {errors.yAxisColumn && (
                <p className="text-sm text-destructive mt-1">
                  {errors.yAxisColumn.message}
                </p>
              )}
            </Field>

            {supportsMultiSeries && (
              <Field>
                <Label htmlFor="seriesColumn">{t.chart.seriesColumn}</Label>
                {useCustomQuery ? (
                  <Input
                    id="seriesColumn"
                    placeholder={t.chart.seriesColumnPlaceholder}
                    {...register("seriesColumn")}
                  />
                ) : seriesColumns.length > 0 ? (
                  <Controller
                    name="seriesColumn"
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
                          <SelectValue placeholder={t.chart.noneSingleSeries} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{t.chart.noneSingleSeries}</SelectItem>
                          {seriesColumns.map((col) => (
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
                    id="seriesColumn"
                    placeholder={t.chart.noSuitableColumns}
                    disabled
                    className="bg-muted"
                  />
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t.chart.seriesColumnDescription}
                </p>
              </Field>
            )}
          </>
        )}

        {!useCustomQuery && (
          <Field>
            <Label htmlFor="dateColumn">{t.chart.dateColumn}</Label>
            {columns.filter((col) =>
              col.dataType.toLowerCase().includes("date") ||
              col.dataType.toLowerCase().includes("time")
            ).length > 0 ? (
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
                      <SelectValue placeholder={t.chart.selectDateColumn} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t.chart.none}</SelectItem>
                      {columns
                        .filter(
                          (col) =>
                            col.dataType.toLowerCase().includes("date") ||
                            col.dataType.toLowerCase().includes("time")
                        )
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
                id="dateColumn"
                placeholder={t.chart.noDateColumns}
                disabled
                className="bg-muted"
              />
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t.chart.dateColumnDescription}
            </p>
          </Field>
        )}
      </FieldGroup>

      <SheetFooter className="flex flex-row justify-end gap-2 p-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {editingChart ? t.chart.updateChart : t.chart.createChart}
        </Button>
      </SheetFooter>
    </form>
  );
}

