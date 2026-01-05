import type { SavedQuery } from "@/lib/db";

/**
 * Query result data structure
 */
export interface QueryResult {
  data: Record<string, unknown>[];
  affectedRows?: number;
  transactionId?: string;
  message?: string;
}

/**
 * Query execution parameters
 */
export interface ExecuteQueryParams {
  query: string;
  params?: unknown[];
  useTransaction?: boolean;
}

/**
 * Transaction state
 */
export interface TransactionState {
  transactionId: string | null;
  pendingQuery: string;
}

/**
 * Query to save
 */
export interface QueryToSave {
  query: string;
  params?: unknown[];
}

/**
 * Filtered query lists
 */
export interface FilteredQueries {
  history: SavedQuery[];
  saved: SavedQuery[];
}

/**
 * Tab type
 */
export type ConsoleTab = "console" | "history" | "saved";

/**
 * Query list display mode
 */
export type QueryListMode = "history" | "saved";

