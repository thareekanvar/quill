"use client";

import { Input } from "@/components/ui/input";
import type { DateRangeFilter } from "@/types/filters";
import { formatISO } from "date-fns";
import { useTranslation } from "@/contexts/translation-context";

interface DateRangeFilterProps {
  filter: DateRangeFilter;
  onChange: (filter: DateRangeFilter) => void;
}

export function DateRangeFilterComponent({
  filter,
  onChange,
}: DateRangeFilterProps) {
  const { t } = useTranslation();
  const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "";
    return formatISO(d, { representation: "date" });
  };

  return (
    <div className="flex gap-2 items-center">
      <span className="text-sm text-muted-foreground whitespace-nowrap">{t.filters.between}</span>
      <Input
        type="date"
        value={formatDateForInput(filter.value)}
        onChange={(e) => {
          const date = e.target.value ? new Date(e.target.value) : undefined;
          onChange({ ...filter, value: date });
        }}
        placeholder={t.filters.startDate}
        className="flex-1"
      />
      <span className="text-sm text-muted-foreground">{t.filters.and}</span>
      <Input
        type="date"
        value={formatDateForInput(filter.value2)}
        onChange={(e) => {
          const date = e.target.value ? new Date(e.target.value) : undefined;
          onChange({ ...filter, value2: date });
        }}
        placeholder={t.filters.endDate}
        className="flex-1"
      />
    </div>
  );
}

