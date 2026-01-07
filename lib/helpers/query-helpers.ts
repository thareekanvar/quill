/**
 * Query-related helper functions
 */

/**
 * Check if a query is a mutation (UPDATE, INSERT, DELETE, etc.)
 * This includes all write/modification operations that should be blocked
 */
export function isMutation(query: string): boolean {
  if (!query || typeof query !== 'string') {
    return false;
  }
  const trimmedQuery = query.trim().toUpperCase();
  return (
    trimmedQuery.startsWith('UPDATE') ||
    trimmedQuery.startsWith('INSERT') ||
    trimmedQuery.startsWith('DELETE') ||
    trimmedQuery.startsWith('ALTER') ||
    trimmedQuery.startsWith('DROP') ||
    trimmedQuery.startsWith('CREATE') ||
    trimmedQuery.startsWith('TRUNCATE') ||
    trimmedQuery.startsWith('GRANT') ||
    trimmedQuery.startsWith('REVOKE') ||
    trimmedQuery.startsWith('COMMENT') ||
    trimmedQuery.startsWith('REINDEX') ||
    trimmedQuery.startsWith('VACUUM') ||
    trimmedQuery.startsWith('ANALYZE') ||
    trimmedQuery.startsWith('REPLACE') ||
    trimmedQuery.startsWith('MERGE') ||
    trimmedQuery.startsWith('COPY')
  );
}

/**
 * Build a DELETE query for a table
 */
export function buildDeleteQuery(
  schemaName: string,
  tableName: string,
  primaryKey: string
): string {
  return `DELETE FROM "${schemaName}"."${tableName}" WHERE "${primaryKey}" = $1`;
}

/**
 * Build a qualified table name (schema.table)
 */
export function buildQualifiedTableName(schemaName: string, tableName: string): string {
  return `"${schemaName}"."${tableName}"`;
}

/**
 * Build a safe column name for SQL queries
 */
export function buildSafeColumnName(columnName: string): string {
  return `"${columnName}"`;
}

