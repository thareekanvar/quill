/**
 * Table viewer component helper functions
 */

import { format, parseISO, isValid } from 'date-fns';
import type { TableDataResponse, PendingAction } from '@/types';
import { findPrimaryKeyColumn } from './table-helpers';
import { buildDeleteQuery } from './query-helpers';
import { isDateTimeType } from './type-helpers';

/**
 * Create a delete handler for a table row
 * @param data - Table data response containing schema information
 * @param tableName - The name of the table
 * @param pendingAction - The pending delete action
 * @returns Delete query and parameters, or null if action is not delete
 */
export function createDeleteHandler(
  data: TableDataResponse,
  tableName: string,
  pendingAction: PendingAction
): { query: string; params: unknown[] } | null {
  if (pendingAction.type !== 'delete') {
    return null;
  }

  const primaryKey = findPrimaryKeyColumn(data.schema);

  if (!primaryKey) {
    throw new Error('Cannot determine primary key for deletion');
  }

  const deleteQuery = buildDeleteQuery(data.schemaName, tableName, primaryKey);

  return {
    query: deleteQuery,
    params: [pendingAction.row[primaryKey]],
  };
}

/**
 * Format cell value for display in table cells
 * @param value - The cell value to format
 * @param dataType - Optional data type for type-specific formatting
 * @returns Formatted string representation of the value
 */
export function formatCellValue(value: unknown, dataType?: string): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  // Format dates nicely for display using date-fns
  if (dataType && isDateTimeType(dataType)) {
    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      // Try to parse the string as a date using date-fns
      try {
        date = parseISO(value);
        // Check if the date is valid
        if (!isValid(date)) {
          // If parsing failed, return the string as-is
          return String(value);
        }
      } catch {
        // If parseISO fails, try regular Date constructor as fallback
        date = new Date(value);
        if (!isValid(date)) {
          return String(value);
        }
      }
    } else {
      // Not a date, return as string
      return String(value);
    }
    
    // Format as: DD/MM/YYYY, HH:MM using date-fns
    return format(date, 'dd/MM/yyyy, HH:mm');
  }
  
  return String(value);
}

