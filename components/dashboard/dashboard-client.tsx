"use client";

import { useState } from "react";
import { startOfDay, endOfDay } from "date-fns";
import { SectionCards } from "@/components/blocks/dashboard/components/section-cards";
import { SectionCharts } from "@/components/blocks/dashboard/components/section-charts";
import { CardManager } from "@/components/dashboard/card-manager";
import { ChartManager } from "@/components/dashboard/chart-manager";
import { DashboardSelector } from "@/components/dashboard/dashboard-selector";
import {
  DateFilterPicker,
  type DateRange,
  type DateFilterPreset,
} from "@/components/dashboard/date-filter-picker";
import { useTranslation } from "@/contexts/translation-context";

export function DashboardPageClient() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    return {
      from: startOfDay(now),
      to: endOfDay(now),
    };
  });
  const [datePreset, setDatePreset] = useState<DateFilterPreset>("today");

  return (
    <div className="flex flex-col gap-2">
      <div className="space-y-2 mb-2">
        {/* Header row with Dashboard title and Dashboard selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t.pages.dashboard}</h1>
            <p className="text-muted-foreground">
              {t.pages.dashboardDescription}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DashboardSelector />
          </div>
        </div>

        {/* Controls row with Date filter and Card/Chart managers */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <DateFilterPicker
              value={dateRange}
              onChange={setDateRange}
              preset={datePreset}
              onPresetChange={setDatePreset}
            />
          </div>
          <div className="flex items-center gap-2">
            <CardManager />
            <ChartManager />
          </div>
        </div>
      </div>

      <SectionCards dateRange={dateRange} />
      <SectionCharts dateRange={dateRange} />
    </div>
  );
}

