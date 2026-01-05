/**
 * Chart type labels for display
 */
export const CHART_TYPE_LABELS: Record<string, string> = {
  bar: "Bar Chart",
  line: "Line Chart",
  area: "Area Chart",
  pie: "Pie Chart",
  radar: "Radar Chart",
  radial: "Radial Chart",
} as const;

/**
 * Chart types that support multiple series
 */
export const MULTI_SERIES_CHART_TYPES = ["bar", "line", "area", "radar"] as const;

/**
 * Chart types that require X and Y axes
 */
export const XY_AXIS_CHART_TYPES = ["bar", "line", "area", "radar"] as const;

/**
 * Chart types that use categories/labels
 */
export const CATEGORY_CHART_TYPES = ["pie", "radial"] as const;

