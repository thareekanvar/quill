/**
 * Pagination-related helper functions
 */

/**
 * Calculate offset from page and limit
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Offset value for database queries
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calculate total pages from total items and limit
 * @param total - Total number of items
 * @param limit - Number of items per page
 * @returns Total number of pages (rounded up)
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

/**
 * Get pagination range text for display (e.g., "Showing 1 to 50 of 200 rows")
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @param total - Total number of items
 * @param translations - Optional translation object
 * @returns Formatted pagination range string
 */
export function getPaginationRangeText(
  page: number,
  limit: number,
  total: number,
  translations?: { showing: string; to: string; of: string; results: string }
): string {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  if (translations) {
    return `${translations.showing} ${start} ${translations.to} ${end} ${translations.of} ${total} ${translations.results}`;
  }
  return `Showing ${start} to ${end} of ${total} rows`;
}

/**
 * Validate page number and return valid page within bounds
 * @param page - Page number to validate
 * @param totalPages - Total number of pages
 * @returns Validated page number (clamped between 1 and totalPages)
 */
export function validatePage(page: number, totalPages: number): number {
  if (page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
}

