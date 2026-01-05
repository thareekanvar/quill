/**
 * Application-wide constants
 */

/**
 * Default schema name
 */
export const DEFAULT_SCHEMA = "public";

/**
 * Default page size for table pagination
 */
export const DEFAULT_PAGE_SIZE = 50;

/**
 * Default page number
 */
export const DEFAULT_PAGE = 1;

/**
 * Sort order options
 */
export const SORT_ORDER = {
  ASC: "ASC" as const,
  DESC: "DESC" as const,
} as const;

export type SortOrder = typeof SORT_ORDER[keyof typeof SORT_ORDER];

