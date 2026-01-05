import type { ChartFormData, QueryGenerationResult } from "../types";
import type { DashboardChart } from "@/lib/db";
import { buildQualifiedTableName, buildSafeColumnName } from "@/lib/helpers/query-helpers";

/**
 * Generates SQL query based on chart type and form data
 */
export function generateChartQuery(data: ChartFormData): QueryGenerationResult {
  const { chartType, schemaName, tableName, xAxisColumn, yAxisColumn, seriesColumn, query } = data;

  // If custom query, return as-is (but still require column names)
  if (query.trim()) {
    if (!xAxisColumn || !yAxisColumn) {
      throw new Error("X-axis and Y-axis column names are required for custom queries");
    }
    return {
      query: query.trim(),
      xAxisColumn: xAxisColumn,
      yAxisColumn: yAxisColumn,
      seriesColumn: seriesColumn || undefined,
    };
  }

  // Build qualified table name with proper quoting for case sensitivity
  const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
  
  // Build safe column names
  const safeXAxisColumn = xAxisColumn ? buildSafeColumnName(xAxisColumn) : null;
  const safeYAxisColumn = yAxisColumn ? buildSafeColumnName(yAxisColumn) : null;
  const safeSeriesColumn = seriesColumn ? buildSafeColumnName(seriesColumn) : null;

  if (!safeXAxisColumn || !safeYAxisColumn) {
    throw new Error("X-axis and Y-axis columns are required");
  }

  // Build SELECT clause - for charts, we typically want to aggregate Y-axis values
  // But for now, let's just select the columns as-is and let the user write custom queries for aggregations
  const selectColumns = [safeXAxisColumn, safeYAxisColumn];
  if (safeSeriesColumn) {
    selectColumns.push(safeSeriesColumn);
  }

  // Generate query - simple SELECT for now
  // Users can write custom queries for more complex aggregations
  let generatedQuery = `SELECT ${selectColumns.join(", ")} FROM ${qualifiedTableName}`;

  // Add ORDER BY for better visualization
  generatedQuery += ` ORDER BY ${safeXAxisColumn} LIMIT 100`;

  return {
    query: generatedQuery,
    xAxisColumn: xAxisColumn,
    yAxisColumn: yAxisColumn,
    seriesColumn: seriesColumn || undefined,
  };
}

/**
 * Converts ChartFormData to DashboardChart data structure
 */
export function formDataToChartData(
  data: ChartFormData
): Omit<DashboardChart, "id" | "createdAt" | "updatedAt" | "order"> & {
  order?: number;
} {
  const { query, xAxisColumn, yAxisColumn, seriesColumn } = generateChartQuery(data);

  return {
    title: data.title,
    description: data.description,
    chartType: data.chartType,
    query,
    tableName: data.query.trim() ? undefined : data.tableName,
    schemaName: data.query.trim() ? undefined : data.schemaName,
    xAxisColumn: xAxisColumn || undefined,
    yAxisColumn: yAxisColumn || undefined,
    seriesColumn: seriesColumn || undefined,
    dateColumn: data.dateColumn || undefined,
  };
}

