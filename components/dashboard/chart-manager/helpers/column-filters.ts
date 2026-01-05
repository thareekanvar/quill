import { NUMERIC_DATA_TYPES } from "@/components/dashboard/card-manager/constants";

/**
 * Filter columns by data type for chart axes
 */
export function filterColumnsForChart(columns: Array<{ columnName: string; dataType: string }>) {
  return {
    // All columns can be used for X-axis (categories/labels)
    xAxisColumns: columns,
    // Numeric columns for Y-axis (values)
    yAxisColumns: columns.filter((col) =>
      NUMERIC_DATA_TYPES.some((type) => col.dataType.toLowerCase().includes(type))
    ),
    // Text/categorical columns for series grouping
    seriesColumns: columns.filter(
      (col) =>
        !NUMERIC_DATA_TYPES.some((type) => col.dataType.toLowerCase().includes(type)) &&
        !col.dataType.toLowerCase().includes("date") &&
        !col.dataType.toLowerCase().includes("time")
    ),
  };
}

