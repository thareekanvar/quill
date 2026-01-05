import type { TableColumn } from "@/types";
import { NUMERIC_DATA_TYPES, NUMERIC_QUERY_TYPES } from "../constants";
import type { QueryType } from "../types";

/**
 * Filters columns to only include date/timestamp types
 */
export function filterDateColumns(columns: TableColumn[]): TableColumn[] {
  return columns.filter((col) => {
    const dataType = col.dataType.toLowerCase();
    return (
      dataType.includes("date") ||
      dataType.includes("time") ||
      dataType.includes("timestamp")
    );
  });
}

/**
 * Filters columns based on query type requirements
 * - For numeric aggregations (sum/avg/min/max): only numeric columns
 * - For countDistinct: all columns
 */
export function filterColumnsByQueryType(
  columns: TableColumn[],
  queryType: QueryType
): TableColumn[] {
  if (NUMERIC_QUERY_TYPES.includes(queryType as any)) {
    return columns.filter((col) => {
      const dataType = col.dataType.toLowerCase();
      return NUMERIC_DATA_TYPES.some((type) => dataType.includes(type));
    });
  }

  // For countDistinct and other types, return all columns
  return columns;
}

/**
 * Checks if a column is numeric
 */
export function isNumericColumn(column: TableColumn): boolean {
  const dataType = column.dataType.toLowerCase();
  return NUMERIC_DATA_TYPES.some((type) => dataType.includes(type));
}

/**
 * Checks if a column is a date/timestamp type
 */
export function isDateColumn(column: TableColumn): boolean {
  const dataType = column.dataType.toLowerCase();
  return (
    dataType.includes("date") ||
    dataType.includes("time") ||
    dataType.includes("timestamp")
  );
}

