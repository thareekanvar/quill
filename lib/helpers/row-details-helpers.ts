/**
 * Row details component helper functions
 */

import type { TableDataResponse, TableColumn } from '@/types';
import { parseValueFromInput, isDateTimeType } from './type-helpers';

/**
 * Generate a UUID v4
 * @returns A randomly generated UUID v4 string
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate default value for a column based on its type and name
 * @param column - The table column definition
 * @returns Default value for the column, or null if no default should be set
 */
export function generateDefaultValue(column: TableColumn): unknown {
  const dataType = column.dataType.toLowerCase();
  const columnName = column.columnName.toLowerCase();

  // Handle UUID types
  if (dataType === 'uuid' || dataType === 'uuidv4') {
    return generateUUID();
  }

  // Handle SERIAL types - these are auto-generated, so return null
  // The database will handle the generation
  if (dataType === 'serial' || dataType === 'bigserial' || dataType === 'smallserial') {
    return null; // Let the database auto-generate
  }

  // Handle timestamp fields (createdAt, updatedAt, etc.)
  if (isDateTimeType(dataType)) {
    if (columnName.includes('created') || columnName.includes('updated')) {
      return new Date().toISOString();
    }
  }

  // For other types, return null (user will fill in)
  return null;
}

/**
 * Note: isDateTimeType is imported from type-helpers.ts to avoid duplication
 */

/**
 * Build UPDATE query for a table row
 * @param schemaName - The schema name
 * @param tableName - The table name
 * @param columns - Array of column names to update
 * @param primaryKeyColumn - The primary key column name for WHERE clause
 * @returns SQL UPDATE query string
 */
export function buildUpdateQuery(
  schemaName: string,
  tableName: string,
  columns: string[],
  primaryKeyColumn: string
): string {
  const setClauses = columns
    .map((col, index) => `"${col}" = $${index + 1}`)
    .join(', ');

  return `UPDATE "${schemaName}"."${tableName}" SET ${setClauses} WHERE "${primaryKeyColumn}" = $${
    columns.length + 1
  }`;
}

/**
 * Prepare parameters for UPDATE query
 * @param formData - Form data containing field values
 * @param columns - Array of column names to update
 * @param schema - Table schema for type information
 * @param primaryKeyColumn - The primary key column name
 * @returns Array of parameter values for the UPDATE query
 */
export function prepareUpdateParams(
  formData: Record<string, unknown>,
  columns: string[],
  schema: TableColumn[],
  primaryKeyColumn: string
): unknown[] {
  const params = columns.map((col) => {
    const value = formData[col];
    const column = schema.find((c) => c.columnName === col);
    if (!column) return value;
    
    // Handle JSON/JSONB types - need to stringify objects
    const dataType = column.dataType.toLowerCase();
    if ((dataType === 'json' || dataType === 'jsonb') && typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    // For other types, use the existing parser
    // But if value is already an object/array and not JSON type, stringify it
    if (typeof value === 'object' && value !== null && dataType !== 'json' && dataType !== 'jsonb') {
      return JSON.stringify(value);
    }
    
    return parseValueFromInput(String(value ?? ''), column.dataType);
  });

  params.push(formData[primaryKeyColumn]);
  return params;
}

/**
 * Build INSERT query for a new table row
 * @param schemaName - The schema name
 * @param tableName - The table name
 * @param columns - Array of column names to insert
 * @returns SQL INSERT query string with RETURNING clause
 */
export function buildInsertQuery(
  schemaName: string,
  tableName: string,
  columns: string[]
): string {
  const columnNames = columns.map((col) => `"${col}"`).join(', ');
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

  return `INSERT INTO "${schemaName}"."${tableName}" (${columnNames}) VALUES (${placeholders}) RETURNING *`;
}

/**
 * Prepare parameters for INSERT query
 * @param formData - Form data containing field values
 * @param columns - Array of column names to insert
 * @param schema - Table schema for type information
 * @returns Array of parameter values for the INSERT query
 */
export function prepareInsertParams(
  formData: Record<string, unknown>,
  columns: string[],
  schema: TableColumn[]
): unknown[] {
  return columns.map((col) => {
    const value = formData[col];
    const column = schema.find((c) => c.columnName === col);
    if (!column) return value;
    
    // If value is null/undefined and column has a default, use null (DB will use default)
    if ((value === null || value === undefined || value === '') && column.columnDefault) {
      return null;
    }
    
    // Handle Date objects - convert to ISO string for PostgreSQL
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // Handle JSON/JSONB types - need to stringify objects
    const dataType = column.dataType.toLowerCase();
    if ((dataType === 'json' || dataType === 'jsonb') && typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    // For other types, use the existing parser
    // But if value is already an object/array and not JSON type, stringify it
    if (typeof value === 'object' && value !== null && dataType !== 'json' && dataType !== 'jsonb') {
      return JSON.stringify(value);
    }
    
    return parseValueFromInput(String(value ?? ''), column.dataType);
  });
}

/**
 * Check if a column is auto-generated (SERIAL types or has a default value)
 */
function isAutoGenerated(column: TableColumn): boolean {
  const dataType = column.dataType.toLowerCase();
  // SERIAL types are auto-generated
  if (dataType === 'serial' || dataType === 'bigserial' || dataType === 'smallserial') {
    return true;
  }
  // If column has a default value that looks like a sequence or function, it's auto-generated
  if (column.columnDefault && (
    column.columnDefault.includes('nextval') ||
    column.columnDefault.includes('gen_random_uuid()') ||
    column.columnDefault.includes('uuid_generate')
  )) {
    return true;
  }
  return false;
}

/**
 * Get insertable columns (exclude auto-generated columns like SERIAL)
 * @param schema - Table schema
 * @param primaryKeyColumn - Optional primary key column to exclude if needed
 * @returns Array of column names that can be inserted
 */
export function getInsertableColumns(
  schema: TableColumn[],
  primaryKeyColumn?: string
): string[] {
  return schema
    .filter((col) => !isAutoGenerated(col))
    .map((col) => col.columnName);
}

/**
 * Get updatable columns (excluding primary key)
 * @param schema - Table schema
 * @param primaryKeyColumn - Primary key column to exclude
 * @returns Array of column names that can be updated
 */
export function getUpdatableColumns(
  schema: TableColumn[],
  primaryKeyColumn: string
): string[] {
  return schema
    .filter((col) => col.columnName !== primaryKeyColumn)
    .map((col) => col.columnName);
}

