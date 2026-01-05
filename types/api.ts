/**
 * API-related type definitions
 */

export interface RouteContext {
  params: Promise<{
    tableName: string;
  }>;
}

export interface QueryRequest {
  connectionString: string;
  password?: string;
  query: string;
  params?: unknown[];
}

export interface QueryResponse {
  success: boolean;
  data?: unknown[];
  message?: string;
  affectedRows?: number;
}

export interface TablesResponse {
  tables: Array<{
    tableName: string;
    schemaName: string;
  }>;
}

export interface TableDataRequest {
  connectionString: string;
}

