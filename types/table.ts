/**
 * Table-related type definitions
 */

export interface TableInfo {
  tableName: string;
  schemaName: string;
}

export interface TableColumn {
  columnName: string;
  dataType: string;
  isNullable: string;
  columnDefault: string | null;
}

export interface TableDataResponse {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  schema: TableColumn[];
  tableName: string;
  schemaName: string;
}

import type { Filter } from "./filters";

export interface TableDataParams {
  tableName: string;
  schemaName?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "ASC" | "DESC";
  filters?: Filter[];
}

export interface TableViewerProps {
  tableName: string;
  schemaName?: string;
}

export interface PendingAction {
  type: "edit" | "delete";
  row: Record<string, unknown>;
}

