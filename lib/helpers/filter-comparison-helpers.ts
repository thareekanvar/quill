/**
 * Filter comparison helper functions
 */

import type { Filter } from "@/types/filters";
import { hasFilterValue } from "./filter-helpers";

/**
 * Serialize a filter for comparison purposes
 * @param filter - The filter to serialize
 * @returns Serialized filter object
 */
function serializeFilter(filter: Filter) {
  return {
    column: filter.column,
    type: filter.type,
    operator: filter.operator,
    value: filter.value,
    value2: filter.value2,
  };
}

/**
 * Compare two arrays of filters to determine if they have changed
 * @param previousFilters - Previous filter array
 * @param newFilters - New filter array
 * @returns True if the active filters have changed, false otherwise
 */
export function haveActiveFiltersChanged(
  previousFilters: Filter[],
  newFilters: Filter[]
): boolean {
  const previousActive = previousFilters.filter(hasFilterValue);
  const newActive = newFilters.filter(hasFilterValue);

  // Serialize filters for comparison
  const previousActiveKey = JSON.stringify(
    previousActive.map(serializeFilter)
  );
  const newActiveKey = JSON.stringify(newActive.map(serializeFilter));

  return previousActiveKey !== newActiveKey;
}

