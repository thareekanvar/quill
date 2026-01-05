import type { SavedQuery } from "@/lib/db";
import type { FilteredQueries } from "@/types/sql-console";

/**
 * Filter queries based on search text
 */
export function filterQueries(
  queries: SavedQuery[],
  searchText: string
): SavedQuery[] {
  if (!searchText.trim()) {
    return queries;
  }

  const searchLower = searchText.toLowerCase();
  return queries.filter(
    (q) =>
      q.query.toLowerCase().includes(searchLower) ||
      (q.name && q.name.toLowerCase().includes(searchLower))
  );
}

/**
 * Get filtered queries for both history and saved
 */
export function getFilteredQueries(
  history: SavedQuery[],
  savedQueries: SavedQuery[],
  searchText: string
): FilteredQueries {
  return {
    history: filterQueries(history, searchText),
    saved: filterQueries(savedQueries, searchText),
  };
}

/**
 * Format query result message
 */
export function formatQueryResultMessage(
  result: {
    data?: Record<string, unknown>[];
    affectedRows?: number;
    transactionId?: string;
  }
): string {
  if (result.transactionId) {
    return `Query executed in transaction. ${
      result.affectedRows || 0
    } row(s) affected. Use Commit or Rollback to finalize.`;
  }

  if (result.data && Array.isArray(result.data)) {
    return `Query executed successfully. Returned ${result.data.length} row(s)`;
  }

  if (result.affectedRows !== undefined) {
    return `Query executed successfully. ${result.affectedRows} row(s) affected`;
  }

  return "Query executed successfully";
}

/**
 * Get columns from query result
 */
export function getResultColumns(
  result: Record<string, unknown>[] | null
): string[] {
  if (!result || result.length === 0) {
    return [];
  }
  return Object.keys(result[0]);
}

/**
 * Validate query before execution
 */
export function validateQuery(query: string): { valid: boolean; error?: string } {
  if (!query || !query.trim()) {
    return { valid: false, error: "Please enter a SQL query" };
  }
  return { valid: true };
}

/**
 * Format date for display
 */
export function formatQueryDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Truncate query text for display
 */
export function truncateQuery(query: string, maxLength: number = 200): string {
  if (query.length <= maxLength) {
    return query;
  }
  return query.substring(0, maxLength) + "...";
}

