import type { ChartFormData } from "../types";
import type { DashboardChart } from "@/lib/db";

/**
 * Default form values for creating a new chart
 */
export function getDefaultFormValues(): ChartFormData {
  return {
    title: "",
    description: "",
    chartType: "bar",
    tableName: "",
    schemaName: "public",
    query: "",
    xAxisColumn: "",
    yAxisColumn: "",
    seriesColumn: "",
    dateColumn: "",
  };
}

/**
 * Converts a DashboardChart to ChartFormData for editing
 */
export function chartToFormData(chart: DashboardChart): ChartFormData {
  return {
    title: chart.title,
    description: chart.description,
    chartType: chart.chartType,
    tableName: chart.tableName || "",
    schemaName: chart.schemaName || "public",
    query: chart.query,
    xAxisColumn: chart.xAxisColumn || "",
    yAxisColumn: chart.yAxisColumn || "",
    seriesColumn: chart.seriesColumn || "",
    dateColumn: chart.dateColumn || "",
  };
}

