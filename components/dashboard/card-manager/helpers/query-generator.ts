import type { CardFormData, QueryGenerationResult } from "../types";
import type { DashboardCard } from "@/lib/db";
import { buildQualifiedTableName, buildSafeColumnName } from "@/lib/helpers/query-helpers";

/**
 * Generates SQL query based on query type and form data
 */
export function generateQuery(data: CardFormData): QueryGenerationResult {
  const { queryType, schemaName, tableName, aggregateColumn, query } = data;

  // Build qualified table name with proper quoting for case sensitivity
  const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
  
  // Build safe column name for aggregate column if provided
  const safeAggregateColumn = aggregateColumn ? buildSafeColumnName(aggregateColumn) : null;

  switch (queryType) {
    case "rowCount":
      return {
        query: `SELECT COUNT(*) as count FROM ${qualifiedTableName}`,
        valueColumn: "count",
      };

    case "sum":
      if (!aggregateColumn) {
        throw new Error("Aggregate column is required for sum query");
      }
      return {
        query: `SELECT SUM(${safeAggregateColumn}) as sum FROM ${qualifiedTableName}`,
        valueColumn: "sum",
      };

    case "avg":
      if (!aggregateColumn) {
        throw new Error("Aggregate column is required for average query");
      }
      return {
        query: `SELECT AVG(${safeAggregateColumn}) as avg FROM ${qualifiedTableName}`,
        valueColumn: "avg",
      };

    case "min":
      if (!aggregateColumn) {
        throw new Error("Aggregate column is required for minimum query");
      }
      return {
        query: `SELECT MIN(${safeAggregateColumn}) as min FROM ${qualifiedTableName}`,
        valueColumn: "min",
      };

    case "max":
      if (!aggregateColumn) {
        throw new Error("Aggregate column is required for maximum query");
      }
      return {
        query: `SELECT MAX(${safeAggregateColumn}) as max FROM ${qualifiedTableName}`,
        valueColumn: "max",
      };

    case "countDistinct":
      if (!aggregateColumn) {
        throw new Error("Aggregate column is required for count distinct query");
      }
      return {
        query: `SELECT COUNT(DISTINCT ${safeAggregateColumn}) as count FROM ${qualifiedTableName}`,
        valueColumn: "count",
      };

    case "custom":
      return {
        query: query,
        valueColumn: data.valueColumn,
      };

    default:
      throw new Error(`Unknown query type: ${queryType}`);
  }
}

/**
 * Converts CardFormData to DashboardCard data structure
 */
export function formDataToCardData(
  data: CardFormData
): Omit<DashboardCard, "id" | "createdAt" | "updatedAt" | "order" | "connectionId" | "dashboardId"> & {
  order?: number;
} {
  const { query, valueColumn } = generateQuery(data);

  return {
    title: data.title,
    description: data.description,
    queryType: data.queryType,
    query,
    tableName: data.queryType !== "custom" ? data.tableName : undefined,
    schemaName: data.queryType !== "custom" ? data.schemaName : undefined,
    valueColumn: valueColumn || undefined,
    aggregateColumn: data.aggregateColumn || undefined,
    footerText: data.footerText || undefined,
    dateColumn: data.dateColumn || undefined,
  };
}

