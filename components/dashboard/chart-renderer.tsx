"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardChart } from "@/lib/db";
import { WarningCircle } from "@phosphor-icons/react";
import { useTranslation } from "@/contexts/translation-context";

interface ChartRendererProps {
  chart: DashboardChart;
  data: any[];
  error?: string;
}

// Color palette for charts
const CHART_COLORS = [
  "oklch(0.809 0.105 251.813)",
  "oklch(0.623 0.214 259.815)",
  "oklch(0.546 0.245 262.881)",
  "oklch(0.488 0.243 264.376)",
  "oklch(0.424 0.199 265.638)",
];

const DEFAULT_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088fe",
];

export function ChartRenderer({ chart, data, error }: ChartRendererProps) {
  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] text-destructive">
        <div className="text-center">
          <WarningCircle className="size-8 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    const { t } = useTranslation();
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
        <p className="text-sm">{t.pages.noDataAvailable}</p>
      </div>
    );
  }

  // Build chart config from data
  const chartConfig: ChartConfig = {};
  const xAxisKey = chart.xAxisColumn || Object.keys(data[0] || {})[0] || "x";
  const yAxisKey = chart.yAxisColumn || Object.keys(data[0] || {})[1] || "y";
  const seriesKey = chart.seriesColumn;

  // If we have series, create config for each series
  if (seriesKey) {
    const seriesValues = Array.from(new Set(data.map((d) => d[seriesKey])));
    seriesValues.forEach((series, index) => {
      chartConfig[String(series)] = {
        label: String(series),
        color: CHART_COLORS[index % CHART_COLORS.length] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      };
    });
  } else {
    chartConfig[yAxisKey] = {
      label: chart.description || yAxisKey,
      color: CHART_COLORS[0] || DEFAULT_COLORS[0],
    };
  }

  // Transform data for multi-series charts
  const transformedData = seriesKey
    ? data.reduce((acc: any[], item: any) => {
        const existing = acc.find((d) => d[xAxisKey] === item[xAxisKey]);
        if (existing) {
          existing[item[seriesKey]] = item[yAxisKey];
        } else {
          const newItem: any = { [xAxisKey]: item[xAxisKey] };
          newItem[item[seriesKey]] = item[yAxisKey];
          acc.push(newItem);
        }
        return acc;
      }, [])
    : data;

  const renderChart = () => {
    switch (chart.chartType) {
      case "bar":
        return (
          <BarChart 
            data={transformedData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {seriesKey ? (
              <>
                <Legend />
                {Array.from(new Set(data.map((d) => d[seriesKey]))).map(
                  (series, index) => (
                    <Bar
                      key={String(series)}
                      dataKey={String(series)}
                      fill={
                        CHART_COLORS[index % CHART_COLORS.length] ||
                        DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                      }
                    />
                  )
                )}
              </>
            ) : (
              <Bar
                dataKey={yAxisKey}
                fill={CHART_COLORS[0] || DEFAULT_COLORS[0]}
              />
            )}
          </BarChart>
        );

      case "line":
        return (
          <LineChart 
            data={transformedData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {seriesKey ? (
              <>
                <Legend />
                {Array.from(new Set(data.map((d) => d[seriesKey]))).map(
                  (series, index) => (
                    <Line
                      key={String(series)}
                      type="monotone"
                      dataKey={String(series)}
                      stroke={
                        CHART_COLORS[index % CHART_COLORS.length] ||
                        DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                      }
                      strokeWidth={2}
                    />
                  )
                )}
              </>
            ) : (
              <Line
                type="monotone"
                dataKey={yAxisKey}
                stroke={CHART_COLORS[0] || DEFAULT_COLORS[0]}
                strokeWidth={2}
              />
            )}
          </LineChart>
        );

      case "area":
        return (
          <AreaChart 
            data={transformedData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {seriesKey ? (
              <>
                <Legend />
                {Array.from(new Set(data.map((d) => d[seriesKey]))).map(
                  (series, index) => (
                    <Area
                      key={String(series)}
                      type="monotone"
                      dataKey={String(series)}
                      stackId="1"
                      stroke={
                        CHART_COLORS[index % CHART_COLORS.length] ||
                        DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                      }
                      fill={
                        CHART_COLORS[index % CHART_COLORS.length] ||
                        DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                      }
                    />
                  )
                )}
              </>
            ) : (
              <Area
                type="monotone"
                dataKey={yAxisKey}
                stroke={CHART_COLORS[0] || DEFAULT_COLORS[0]}
                fill={CHART_COLORS[0] || DEFAULT_COLORS[0]}
              />
            )}
          </AreaChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey={yAxisKey}
              nameKey={xAxisKey}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    CHART_COLORS[index % CHART_COLORS.length] ||
                    DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                  }
                />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
          </PieChart>
        );

      case "radar":
        if (!seriesKey) {
          return (
            <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
              <p className="text-sm">Radar chart requires a series column</p>
            </div>
          );
        }
        return (
          <RadarChart data={transformedData}>
            <PolarGrid />
            <PolarAngleAxis dataKey={xAxisKey} />
            <PolarRadiusAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            {Array.from(new Set(data.map((d) => d[seriesKey]))).map(
              (series, index) => (
                <Radar
                  key={String(series)}
                  name={String(series)}
                  dataKey={String(series)}
                  stroke={
                    CHART_COLORS[index % CHART_COLORS.length] ||
                    DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                  }
                  fill={
                    CHART_COLORS[index % CHART_COLORS.length] ||
                    DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                  }
                  fillOpacity={0.6}
                />
              )
            )}
          </RadarChart>
        );

      case "radial":
        return (
          <RadialBarChart
            data={data}
            innerRadius="20%"
            outerRadius="80%"
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              dataKey={yAxisKey}
              nameKey={xAxisKey}
              fill={CHART_COLORS[0] || DEFAULT_COLORS[0]}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
          </RadialBarChart>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
            <p className="text-sm">Unknown chart type: {chart.chartType}</p>
          </div>
        );
    }
  };

  return (
    <ChartContainer config={chartConfig} className="h-full w-full -mx-2 -my-2">
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        {renderChart()}
      </ResponsiveContainer>
    </ChartContainer>
  );
}

