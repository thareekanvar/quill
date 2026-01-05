import type { CardFormData } from "../types";
import type { DashboardCard } from "@/lib/db";
import { VALUE_COLUMN_NAMES } from "../constants";

/**
 * Default form values for creating a new card
 */
export function getDefaultFormValues(): CardFormData {
  return {
    title: "",
    description: "",
    queryType: "rowCount",
    tableName: "",
    schemaName: "public",
    query: "",
    valueColumn: "",
    aggregateColumn: "",
    footerText: "",
    dateColumn: "",
  };
}

/**
 * Converts a DashboardCard to CardFormData for editing
 */
export function cardToFormData(card: DashboardCard): CardFormData {
  const valueColumn =
    card.queryType !== "custom"
      ? VALUE_COLUMN_NAMES[card.queryType] || ""
      : card.valueColumn || "";

  return {
    title: card.title,
    description: card.description,
    queryType: card.queryType,
    tableName: card.tableName || "",
    schemaName: card.schemaName || "public",
    query: card.query,
    valueColumn,
    aggregateColumn: card.aggregateColumn || "",
    footerText: card.footerText || "",
    dateColumn: card.dateColumn || "",
  };
}

