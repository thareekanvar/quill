/**
 * URL building helper functions for navigation
 */

/**
 * Build a schema query parameter string
 * @param schemaName - The schema name (defaults to "public" if not provided)
 * @returns Query parameter string with schema, or empty string if schema is "public"
 */
export function buildSchemaQueryParam(schemaName: string = "public"): string {
  if (schemaName === "public") {
    return "";
  }
  return `?schema=${encodeURIComponent(schemaName)}`;
}

/**
 * Build URL for table detail page
 * @param tableName - The table name
 * @param schemaName - The schema name (optional, defaults to "public")
 * @returns URL string for the table detail page
 */
export function buildTableUrl(
  tableName: string,
  schemaName: string = "public"
): string {
  const schemaParam = buildSchemaQueryParam(schemaName);
  return `/dashboard/tables/${tableName}${schemaParam}`;
}

/**
 * Build URL for row details page
 * @param tableName - The table name
 * @param rowId - The row ID (primary key value)
 * @param schemaName - The schema name (optional, defaults to "public")
 * @returns URL string for the row details page
 */
export function buildRowDetailsUrl(
  tableName: string,
  rowId: string | number,
  schemaName: string = "public"
): string {
  const encodedRowId = encodeURIComponent(String(rowId));
  const schemaParam = buildSchemaQueryParam(schemaName);
  return `/dashboard/tables/${tableName}/${encodedRowId}${schemaParam}`;
}

/**
 * Build URL for new row page
 * @param tableName - The table name
 * @param schemaName - The schema name (optional, defaults to "public")
 * @returns URL string for the new row page
 */
export function buildNewRowUrl(
  tableName: string,
  schemaName: string = "public"
): string {
  const schemaParam = buildSchemaQueryParam(schemaName);
  return `/dashboard/tables/${tableName}/new${schemaParam}`;
}
