/**
 * Table-related helper functions
 */

import type { TableInfo, TablePreference } from '@/types';

/**
 * Table row data type - a record of column names to values
 */
export type TableRow = Record<string, unknown>;

/**
 * Generate a unique key for a table (schema.table)
 * @param tableName - The table name
 * @param schemaName - The schema name
 * @returns Unique key string in format "schema.table"
 */
export function getTableKey(tableName: string, schemaName: string): string {
  return `${schemaName}.${tableName}`;
}

/**
 * Sort tables by their preference order
 * @param tables - Array of table info objects
 * @param preferences - Record of table preferences keyed by table key
 * @returns Sorted array of table info objects
 */
export function sortTablesByPreference(
  tables: TableInfo[],
  preferences: Record<string, TablePreference>
): TableInfo[] {
  return [...tables].sort((a, b) => {
    const keyA = getTableKey(a.tableName, a.schemaName);
    const keyB = getTableKey(b.tableName, b.schemaName);
    const prefA = preferences[keyA];
    const prefB = preferences[keyB];
    const orderA = prefA?.order ?? 999;
    const orderB = prefB?.order ?? 999;
    return orderA - orderB;
  });
}

/**
 * Filter tables based on visibility preference
 * @param tables - Array of table info objects
 * @param preferences - Record of table preferences keyed by table key
 * @returns Filtered array of visible table info objects
 */
export function filterVisibleTables(
  tables: TableInfo[],
  preferences: Record<string, TablePreference>
): TableInfo[] {
  return tables.filter((table) => {
    const key = getTableKey(table.tableName, table.schemaName);
    const pref = preferences[key];
    return pref?.visible !== false; // Show by default if no preference
  });
}

/**
 * Get sorted and filtered tables based on preferences
 * @param tables - Array of table info objects
 * @param preferences - Record of table preferences keyed by table key
 * @returns Sorted and filtered array of table info objects
 */
export function getSortedAndFilteredTables(
  tables: TableInfo[],
  preferences: Record<string, TablePreference>
): TableInfo[] {
  const sorted = sortTablesByPreference(tables, preferences);
  return filterVisibleTables(sorted, preferences);
}

/**
 * Find primary key column from schema
 * Looks for columns with 'id' in the name, or returns the first column as fallback
 * @param schema - Array of column definitions with at least columnName property
 * @returns Primary key column name, or undefined if not found
 */
export function findPrimaryKeyColumn(
  schema: Array<{ columnName: string }>
): string | undefined {
  return (
    schema.find((col) => col.columnName.toLowerCase().includes('id'))?.columnName ||
    schema[0]?.columnName
  );
}

/**
 * Check if a column looks like a foreign key based on naming patterns
 * Common patterns: *_id, *Id, *_uuid, etc.
 * @param columnName - The column name to check
 * @param isPrimaryKey - Whether this column is a primary key (foreign keys are never primary keys)
 * @returns True if the column name matches foreign key patterns
 */
export function looksLikeForeignKey(
  columnName: string,
  isPrimaryKey: boolean = false
): boolean {
  if (isPrimaryKey) return false;
  
  const lowerName = columnName.toLowerCase();
  return (
    lowerName.endsWith('_id') ||
    lowerName.endsWith('_uuid') ||
    lowerName.endsWith('id') && lowerName !== 'id' ||
    lowerName.includes('_id_') ||
    lowerName.includes('foreign')
  );
}

