/**
 * Filter-related type definitions
 */

import type { TableColumn } from "./table";

export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "between"
  | "in"
  | "notIn"
  | "isNull"
  | "isNotNull"
  | "before"
  | "after"
  | "on";

export type FilterType =
  | "text"
  | "number"
  | "range"
  | "date"
  | "dateRange"
  | "boolean"
  | "select"
  | "multiSelect"
  | "foreignKey";

export interface BaseFilter {
  id: string;
  column: string;
  type: FilterType;
  operator: FilterOperator;
  value?: unknown;
  value2?: unknown; // For range filters
}

export interface TextFilter extends BaseFilter {
  type: "text";
  operator: "equals" | "notEquals" | "contains" | "notContains" | "startsWith" | "endsWith";
  value: string;
}

export interface NumberFilter extends BaseFilter {
  type: "number";
  operator: "equals" | "notEquals" | "greaterThan" | "greaterThanOrEqual" | "lessThan" | "lessThanOrEqual";
  value?: number;
}

export interface RangeFilter extends BaseFilter {
  type: "range";
  operator: "between";
  value?: number; // min
  value2?: number; // max
}

export interface DateFilter extends BaseFilter {
  type: "date";
  operator: "equals" | "notEquals" | "before" | "after" | "on" | "isNull" | "isNotNull";
  value?: string | Date; // ISO date string or Date object
}

export interface DateRangeFilter extends BaseFilter {
  type: "dateRange";
  operator: "between";
  value?: string | Date; // start date
  value2?: string | Date; // end date
}

export interface BooleanFilter extends BaseFilter {
  type: "boolean";
  operator: "equals";
  value: boolean;
}

export interface SelectFilter extends BaseFilter {
  type: "select";
  operator: "equals" | "notEquals" | "in" | "notIn";
  value?: string | string[];
}

export interface MultiSelectFilter extends BaseFilter {
  type: "multiSelect";
  operator: "in" | "notIn";
  value: string[];
}

export interface ForeignKeyFilter extends BaseFilter {
  type: "foreignKey";
  operator: "equals" | "notEquals" | "in" | "notIn";
  value: unknown | unknown[];
  foreignTable?: string;
  foreignSchema?: string;
  foreignColumn?: string; // Column to display/search in foreign table
  foreignIdColumn?: string; // ID column in foreign table
}

export type Filter =
  | TextFilter
  | NumberFilter
  | RangeFilter
  | DateFilter
  | DateRangeFilter
  | BooleanFilter
  | SelectFilter
  | MultiSelectFilter
  | ForeignKeyFilter;

export interface FilterConfig {
  column: TableColumn;
  filterType: FilterType;
  operators: FilterOperator[];
  options?: string[]; // For select/multiSelect
  foreignTable?: string; // For foreignKey
  foreignSchema?: string; // For foreignKey
  foreignColumn?: string; // For foreignKey
  foreignIdColumn?: string; // For foreignKey
}

