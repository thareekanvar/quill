"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useDashboardCharts,
  useCreateDashboardChart,
  useUpdateDashboardChart,
  useDeleteDashboardChart,
} from "@/hooks/use-dashboard-charts";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { ChartLineIcon } from "@phosphor-icons/react";
import { ChartForm } from "./components/chart-form";
import { DeleteChartDialog } from "./components/delete-chart-dialog";
import type { ChartFormData, ChartManagerProps } from "./types";
import { formDataToChartData } from "./helpers/query-generator";
import { useUIStore } from "@/lib/stores/ui-store";
import { useTranslation } from "@/contexts/translation-context";

export function ChartManager({
  onChartChange,
  externalEditChart,
  externalDeleteChartId,
  onExternalEditChange,
  onExternalDeleteChange,
}: ChartManagerProps) {
  const {
    chartManagerOpen,
    editingChart,
    deleteChartId,
    openChartManager,
    closeChartManager,
    setEditingChart: setStoreEditingChart,
    setDeleteChartId: setStoreDeleteChartId,
  } = useUIStore();

  // Use external state if provided, otherwise use store state
  const currentEditingChart =
    externalEditChart !== undefined ? externalEditChart : editingChart;
  const currentDeleteChartId =
    externalDeleteChartId !== undefined ? externalDeleteChartId : deleteChartId;

  const setEditingChartState = (chart: typeof currentEditingChart) => {
    if (onExternalEditChange) {
      onExternalEditChange(chart);
    } else {
      setStoreEditingChart(chart);
    }
  };

  const setDeleteChartIdState = (chartId: string | null) => {
    if (onExternalDeleteChange) {
      onExternalDeleteChange(chartId);
    } else {
      setStoreDeleteChartId(chartId);
    }
  };

  const { tables } = useSidebarStore();
  const createChart = useCreateDashboardChart();
  const updateChart = useUpdateDashboardChart();
  const deleteChart = useDeleteDashboardChart();
  const isSubmitting = createChart.isPending || updateChart.isPending;
  const { t } = useTranslation();

  // Determine if Sheet should be open
  const sheetOpen = externalEditChart !== undefined 
    ? externalEditChart !== null 
    : chartManagerOpen;

  const handleSubmit = async (data: ChartFormData) => {
    const chartData = formDataToChartData(data);

    try {
      if (currentEditingChart) {
        await updateChart.mutateAsync({
          id: currentEditingChart.id,
          updates: chartData,
        });
      } else {
        await createChart.mutateAsync(chartData);
      }
      closeChartManager();
      setEditingChartState(null);
      onChartChange?.();
    } catch (error) {
      console.error("Error saving chart:", error);
    }
  };

  const handleCancel = () => {
    closeChartManager();
    setEditingChartState(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (externalEditChart === undefined) {
      if (open) {
        openChartManager();
      } else {
        closeChartManager();
      }
    }
    if (!open) {
      setEditingChartState(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (currentDeleteChartId) {
      try {
        await deleteChart.mutateAsync(currentDeleteChartId);
        setDeleteChartIdState(null);
        onChartChange?.();
      } catch (error) {
        console.error("Error deleting chart:", error);
      }
    }
  };

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild onClick={openChartManager}>
          <Button variant="outline" size="sm">
            <ChartLineIcon className="size-4" />
            {t.chart.manageCharts}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto space-y-0"
        >
          <SheetHeader className="pb-2">
            <SheetTitle>
              {currentEditingChart
                ? t.chart.editDashboardChart
                : t.chart.createDashboardChart}
            </SheetTitle>
            <SheetDescription>
              {t.chart.chartDescription}
            </SheetDescription>
          </SheetHeader>

          <ChartForm
            editingChart={currentEditingChart}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            tables={tables}
          />
        </SheetContent>
      </Sheet>

      <DeleteChartDialog
        open={currentDeleteChartId !== null}
        onOpenChange={(open) => !open && setDeleteChartIdState(null)}
        onConfirm={async () => {
          if (currentDeleteChartId) {
            try {
              await deleteChart.mutateAsync(currentDeleteChartId);
              setDeleteChartIdState(null);
              onChartChange?.();
            } catch (error) {
              console.error("Error deleting chart:", error);
            }
          }
        }}
      />
    </>
  );
}

