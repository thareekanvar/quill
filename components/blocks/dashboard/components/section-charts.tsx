"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/contexts/translation-context";
import {
  DotsSixVertical,
  WarningCircle,
  PencilIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DateRange } from "@/components/dashboard/date-filter-picker";
import {
  useDashboardCharts,
  useExecuteChartQueries,
  useReorderDashboardCharts,
} from "@/hooks/use-dashboard-charts";
import { useUIStore } from "@/lib/stores/ui-store";
import { ChartRenderer } from "@/components/dashboard/chart-renderer";
import type { DashboardChart } from "@/lib/db";

interface ChartData {
  chartId: string;
  data: Record<string, unknown>[];
  success: boolean;
  error?: string;
}

function SortableChart({
  chart,
  chartData,
  onEdit,
  onDelete,
}: {
  chart: {
    id: string;
    title: string;
    description: string;
  };
  chartData?: ChartData;
  onEdit?: (chart: DashboardChart) => void;
  onDelete?: (chartId: string) => void;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chart.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="@container/chart relative group"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
      >
        <DotsSixVertical className="size-4 text-muted-foreground" />
      </div>
      {(onEdit || onDelete) && (
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(chart as DashboardChart);
              }}
            >
              <PencilIcon className="size-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(chart.id);
              }}
            >
              <TrashIcon className="size-3.5" />
            </Button>
          )}
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{chart.title}</CardTitle>
        <CardDescription>{chart.description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] @[400px]/chart:h-[400px]">
        {chartData?.success !== false ? (
          <ChartRenderer
            chart={chart as DashboardChart}
            data={chartData?.data || []}
            error={chartData?.error}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-destructive cursor-help">
                  <WarningCircle className="size-5" />
                  <span>{t.common.error}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">
                  {chartData?.error || t.sidebar.queryExecutionFailed}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export interface SectionChartsProps {
  dateRange: DateRange;
}

export function SectionCharts({ dateRange }: SectionChartsProps) {
  const { t } = useTranslation();
  const { data: chartsData, isLoading: chartsLoading } = useDashboardCharts();
  const executeQueries = useExecuteChartQueries();
  const reorderCharts = useReorderDashboardCharts();
  const [chartResults, setChartResults] = useState<Record<string, ChartData>>(
    {}
  );
  const { setEditingChart, setDeleteChartId } = useUIStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const charts = chartsData?.charts || [];

  // Execute queries when charts change or date range changes
  useEffect(() => {
    if (charts.length > 0) {
      executeQueries.mutate(
        {
          chartIds: charts.map((c) => c.id),
          dateRange:
            dateRange.from || dateRange.to
              ? {
                  from: dateRange.from?.toISOString(),
                  to: dateRange.to?.toISOString(),
                }
              : undefined,
        },
        {
          onSuccess: (data) => {
            const results: Record<string, ChartData> = {};
            data.results.forEach((result: ChartData) => {
              results[result.chartId] = result;
            });
            setChartResults(results);
          },
          onError: (error) => {
            console.error("Error executing chart queries:", error);
          },
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charts.length, dateRange.from, dateRange.to]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = charts.findIndex((c) => c.id === active.id);
      const newIndex = charts.findIndex((c) => c.id === over.id);

      const newCharts = arrayMove(charts, oldIndex, newIndex);
      const chartIds = newCharts.map((c) => c.id);

      try {
        await reorderCharts.mutateAsync(chartIds);
      } catch (error) {
        console.error("Error reordering charts:", error);
      }
    }
  };

  const handleEdit = (chart: DashboardChart) => {
    setEditingChart(chart);
  };

  const handleDelete = (chartId: string) => {
    setDeleteChartId(chartId);
  };

  if (chartsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">
          {t.sidebar.loadingCharts}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {charts.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">
            {t.sidebar.noDashboardCharts}
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={charts.map((c) => c.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
              {charts.map((chart) => (
                <SortableChart
                  key={chart.id}
                  chart={chart}
                  chartData={chartResults[chart.id]}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
