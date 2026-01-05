/**
 * Numeric data types in PostgreSQL that can be used for aggregation
 */
export const NUMERIC_DATA_TYPES = [
  "integer",
  "bigint",
  "smallint",
  "decimal",
  "numeric",
  "real",
  "double precision",
  "money",
] as const;

/**
 * Query types that require numeric columns
 */
export const NUMERIC_QUERY_TYPES = ["sum", "avg", "min", "max"] as const;

/**
 * Query type labels for display
 */
export const QUERY_TYPE_LABELS: Record<string, string> = {
  rowCount: "Row Count",
  sum: "Sum of Column",
  avg: "Average of Column",
  min: "Minimum of Column",
  max: "Maximum of Column",
  countDistinct: "Count Distinct",
  custom: "Custom Query",
} as const;

/**
 * Aggregate function labels
 */
export const AGGREGATE_LABELS: Record<string, string> = {
  sum: "Sum",
  avg: "Average",
  min: "Find Minimum",
  max: "Find Maximum",
  countDistinct: "Count Distinct",
} as const;

/**
 * Value column names for each query type
 */
export const VALUE_COLUMN_NAMES: Record<string, string> = {
  rowCount: "count",
  sum: "sum",
  avg: "avg",
  min: "min",
  max: "max",
  countDistinct: "count",
} as const;

