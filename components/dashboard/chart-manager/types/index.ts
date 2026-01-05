import type { DashboardChart } from "@/lib/db";

/**
 * Chart types available for dashboard charts
 */
export type ChartType = "bar" | "line" | "area" | "pie" | "radar" | "radial";

/**
 * Form data structure for chart creation/editing
 */
export interface ChartFormData {
  title: string;
  description: string;
  chartType: ChartType;
  tableName: string;
  schemaName: string;
  query: string;
  xAxisColumn: string;
  yAxisColumn: string;
  seriesColumn: string;
  dateColumn: string;
}

/**
 * Props for ChartManager component
 */
export interface ChartManagerProps {
  onChartChange?: () => void;
  externalEditChart?: DashboardChart | null;
  externalDeleteChartId?: string | null;
  onExternalEditChange?: (chart: DashboardChart | null) => void;
  onExternalDeleteChange?: (chartId: string | null) => void;
}

/**
 * Props for ChartForm component
 */
export interface ChartFormProps {
  editingChart: DashboardChart | null;
  onSubmit: (data: ChartFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  tables: Array<{ tableName: string; schemaName: string }>;
}

/**
 * Props for DeleteChartDialog component
 */
export interface DeleteChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Result of query generation
 */
export interface QueryGenerationResult {
  query: string;
  xAxisColumn: string;
  yAxisColumn: string;
  seriesColumn?: string;
}

