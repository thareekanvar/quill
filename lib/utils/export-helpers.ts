/**
 * Data Export Utilities
 * 
 * Provides functions to export table data to CSV and JSON formats.
 * Uses the existing blob download pattern from settings-export.ts
 */

/**
 * Convert an array of objects to CSV format
 */
export function convertToCSV(
  data: Record<string, unknown>[],
  headers?: string[]
): string {
  if (data.length === 0) {
    return '';
  }

  // Use provided headers or extract from first row
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Escape CSV values (handle commas, quotes, newlines)
  const escapeCSVValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    const stringValue = String(value);
    
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  };

  // Create CSV rows
  const rows = [
    csvHeaders.map(escapeCSVValue).join(','),
    ...data.map(row =>
      csvHeaders.map(header => escapeCSVValue(row[header])).join(',')
    ),
  ];

  return rows.join('\n');
}

/**
 * Convert data to JSON format with pretty printing
 */
export function convertToJSON(data: Record<string, unknown>[]): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Download data as a file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  if (typeof window === 'undefined') {
    throw new Error('Download can only be performed in browser environment');
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV file
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename?: string,
  headers?: string[]
): void {
  const csvContent = convertToCSV(data, headers);
  const defaultFilename = `export-${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csvContent, filename || defaultFilename, 'text/csv');
}

/**
 * Export data to JSON file
 */
export function exportToJSON(
  data: Record<string, unknown>[],
  filename?: string
): void {
  const jsonContent = convertToJSON(data);
  const defaultFilename = `export-${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(jsonContent, filename || defaultFilename, 'application/json');
}

