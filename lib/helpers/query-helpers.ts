/**
 * Query-related helper functions
 */

/**
 * Check if a query is a mutation (UPDATE, INSERT, DELETE, etc.)
 */
export function isMutation(query: string): boolean {
  const trimmedQuery = query.trim().toUpperCase();
  return (
    trimmedQuery.startsWith('UPDATE') ||
    trimmedQuery.startsWith('INSERT') ||
    trimmedQuery.startsWith('DELETE') ||
    trimmedQuery.startsWith('ALTER') ||
    trimmedQuery.startsWith('DROP') ||
    trimmedQuery.startsWith('CREATE') ||
    trimmedQuery.startsWith('TRUNCATE')
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

