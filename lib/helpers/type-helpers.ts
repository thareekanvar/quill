/**
 * Type detection and formatting helpers
 */

import { formatISO, parseISO, isValid } from 'date-fns';
import type { TableColumn } from '@/types';

/**
 * Check if a data type is boolean
 * @param dataType - The data type string to check
 * @returns True if the data type is boolean
 */
export function isBooleanType(dataType: string): boolean {
  const normalized = dataType.toLowerCase();
  return normalized === 'boolean' || normalized === 'bool';
}

/**
 * Check if a data type is an array
 * @param dataType - The data type string to check
 * @returns True if the data type is an array type
 */
export function isArrayType(dataType: string): boolean {
  const normalized = dataType.toLowerCase();
  return normalized.includes('[]') || normalized.includes('array');
}

/**
 * Check if a value is an array
 * @param value - The value to check
 * @returns True if the value is an array
 */
export function isArrayValue(value: unknown): boolean {
  return Array.isArray(value);
}

/**
 * Check if a value is an object (but not null or array)
 * @param value - The value to check
 * @returns True if the value is an object (not null, not array)
 */
export function isObjectValue(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if a data type is numeric
 * @param dataType - The data type string to check
 * @returns True if the data type is numeric
 */
export function isNumericType(dataType: string): boolean {
  const normalized = dataType.toLowerCase();
  return (
    normalized.includes('int') ||
    normalized.includes('decimal') ||
    normalized.includes('numeric') ||
    normalized.includes('float') ||
    normalized.includes('double') ||
    normalized.includes('real') ||
    normalized === 'serial' ||
    normalized === 'bigserial'
  );
}

/**
 * Check if a data type is a date/time type
 * @param dataType - The data type string to check
 * @returns True if the data type is a date or time type
 */
export function isDateTimeType(dataType: string): boolean {
  const normalized = dataType.toLowerCase();
  return (
    normalized.includes('date') ||
    normalized.includes('time') ||
    normalized === 'timestamp' ||
    normalized === 'timestamptz'
  );
}

/**
 * Get the appropriate input type for a column based on its data type
 * @param column - The table column definition
 * @returns Input type string (e.g., "switch", "number", "datetime-local", "array", "text")
 */
export function getInputType(column: TableColumn): string {
  if (isBooleanType(column.dataType)) {
    return 'switch';
  }
  if (isNumericType(column.dataType)) {
    return 'number';
  }
  if (isDateTimeType(column.dataType)) {
    return 'datetime-local';
  }
  if (isArrayType(column.dataType)) {
    return 'array';
  }
  return 'text';
}

/**
 * Format value for display in input fields
 * @param value - The value to format
 * @param dataType - The data type for type-specific formatting
 * @returns Formatted string value for input fields
 */
export function formatValueForInput(value: unknown, dataType: string): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (isDateTimeType(dataType)) {
    // Handle both Date objects and date strings (from PostgreSQL JSON serialization)
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
          return value;
        }
      } catch {
        // If parseISO fails, try regular Date constructor as fallback
        date = new Date(value);
        if (!isValid(date)) {
          return value;
        }
      }
    } else {
      // Not a date, return as string
      return String(value);
    }
    
    // Format date for datetime-local input (YYYY-MM-DDTHH:mm) using date-fns
    // formatISO with representation: 'complete' gives us the full datetime
    // We need to truncate to minutes only (remove seconds and timezone)
    const isoString = formatISO(date, { representation: 'complete' });
    // Extract YYYY-MM-DDTHH:mm from the ISO string
    return isoString.slice(0, 16);
  }
  
  return String(value);
}

/**
 * Parse value from input based on data type
 * @param value - The string value from input
 * @param dataType - The target data type
 * @returns Parsed value of the appropriate type, or null if empty/invalid
 */
export function parseValueFromInput(value: string, dataType: string): unknown {
  if (!value || value.trim() === '') {
    return null;
  }
  
  if (isBooleanType(dataType)) {
    return value === 'true' || value === '1';
  }
  
  if (isNumericType(dataType)) {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  
  if (isDateTimeType(dataType)) {
    // Use date-fns parseISO for better date parsing
    try {
      const parsed = parseISO(value);
      if (isValid(parsed)) {
        return parsed;
      }
    } catch {
      // Fallback to regular Date constructor
    }
    return new Date(value);
  }
  
  return value;
}

