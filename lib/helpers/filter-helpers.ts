/**
 * Filter-related helper functions
 */

import type { TableColumn } from "@/types";
import type { FilterType, FilterOperator, FilterConfig } from "@/types/filters";
import { looksLikeForeignKey } from "./table-helpers";
import { isDateTimeType } from "./type-helpers";

/**
 * Determine the appropriate filter type for a column based on its data type and name
 * @param column - The table column definition
 * @returns The appropriate filter type for the column
 */
export function getFilterType(column: TableColumn): FilterType {
  const dataType = column.dataType.toLowerCase();
  const columnName = column.columnName.toLowerCase();

  // Check for foreign key first
  if (looksLikeForeignKey(column.columnName, false)) {
    return "foreignKey";
  }

  // Check for boolean
  if (dataType === "boolean") {
    return "boolean";
  }

  // Check for date/time types
  if (isDateTimeType(column.dataType)) {
    return "date";
  }

  // Check for numeric types
  if (
    dataType.includes("int") ||
    dataType.includes("decimal") ||
    dataType.includes("numeric") ||
    dataType.includes("real") ||
    dataType.includes("double") ||
    dataType.includes("float") ||
    dataType.includes("serial") ||
    dataType.includes("money")
  ) {
    return "number";
  }

  // Default to text
  return "text";
}

/**
 * Get available operators for a filter type
 * @param filterType - The filter type
 * @returns Array of available operators for the filter type
 */
export function getOperatorsForFilterType(filterType: FilterType): FilterOperator[] {
  switch (filterType) {
    case "text":
      return ["equals", "notEquals", "contains", "notContains", "startsWith", "endsWith"];
    case "number":
      return [
        "equals",
        "notEquals",
        "greaterThan",
        "greaterThanOrEqual",
        "lessThan",
        "lessThanOrEqual",
      ];
    case "range":
      return ["between"];
    case "date":
      return ["equals", "notEquals", "before", "after", "on", "isNull", "isNotNull"];
    case "dateRange":
      return ["between"];
    case "boolean":
      return ["equals"];
    case "select":
      return ["equals", "notEquals", "in", "notIn"];
    case "multiSelect":
      return ["in", "notIn"];
    case "foreignKey":
      return ["equals", "notEquals", "in", "notIn"];
    default:
      return ["equals"];
  }
}

/**
 * Get operator label for display
 * @param operator - The filter operator
 * @returns Human-readable label for the operator
 */
export function getOperatorLabel(operator: FilterOperator): string {
  const labels: Record<FilterOperator, string> = {
    equals: "Equals",
    notEquals: "Not equals",
    contains: "Contains",
    notContains: "Does not contain",
    startsWith: "Starts with",
    endsWith: "Ends with",
    greaterThan: "Greater than",
    greaterThanOrEqual: "Greater than or equal",
    lessThan: "Less than",
    lessThanOrEqual: "Less than or equal",
    between: "Between",
    in: "In",
    notIn: "Not in",
    isNull: "Is null",
    isNotNull: "Is not null",
    before: "Before",
    after: "After",
    on: "On",
  };
  return labels[operator] || operator;
}

/**
 * Build filter configuration for a column
 * @param column - The table column definition
 * @returns Filter configuration with type and available operators
 */
export function buildFilterConfig(column: TableColumn): FilterConfig {
  const filterType = getFilterType(column);
  const operators = getOperatorsForFilterType(filterType);

  return {
    column,
    filterType,
    operators,
  };
}

/**
 * Check if a filter has a valid value
 * Handles special cases like null checks, arrays, dates, etc.
 * @param filter - The filter object to check
 * @returns True if the filter has a valid value, false otherwise
 */
export function hasFilterValue(filter: { value?: unknown; value2?: unknown; type?: string; operator?: string }): boolean {
  // Handle null checks - they don't need values
  if (filter.operator === "isNull" || filter.operator === "isNotNull") {
    return true;
  }
  
  // For array-based filters (multiSelect, foreignKey with IN), check array length
  if (filter.type === "multiSelect" || 
      (filter.type === "foreignKey" && (filter.operator === "in" || filter.operator === "notIn"))) {
    const arrayValue = Array.isArray(filter.value) ? filter.value : [];
    return arrayValue.length > 0 && arrayValue.every(v => v !== undefined && v !== null && v !== "");
  }
  
  // For foreign key with equals/notEquals, any non-empty value is valid (including 0, false)
  if (filter.type === "foreignKey") {
    return filter.value !== undefined && filter.value !== null && filter.value !== "";
  }
  
  // For date filters, Date objects are valid values
  if (filter.type === "date" || filter.type === "dateRange") {
    if (filter.value instanceof Date) {
      return !isNaN(filter.value.getTime());
    }
    if (typeof filter.value === "string" && filter.value.trim() !== "") {
      const date = new Date(filter.value);
      return !isNaN(date.getTime());
    }
  }
  
  // Standard check for other types (including text filters)
  // For text filters, also check if value is not just whitespace
  if (filter.type === "text") {
    if (filter.value === undefined || filter.value === null) {
      return false;
    }
    const textValue = String(filter.value).trim();
    return textValue !== "";
  }
  
  if (filter.value === undefined || filter.value === null || filter.value === "") {
    return false;
  }
  
  // For range filters, check both values
  if ("value2" in filter) {
    if (filter.type === "dateRange") {
      // For date ranges, check if both dates are valid
      const date1 = filter.value instanceof Date ? filter.value : new Date(filter.value as string);
      const date2 = filter.value2 instanceof Date ? filter.value2 : new Date(filter.value2 as string);
      return !isNaN(date1.getTime()) && !isNaN(date2.getTime());
    }
    if (filter.value2 === undefined || filter.value2 === null || filter.value2 === "") {
      return false;
    }
  }
  
  return true;
}

