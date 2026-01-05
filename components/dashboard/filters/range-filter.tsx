"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import type { RangeFilter } from "@/types/filters";
import { useDebounce } from "@/hooks/use-debounce";
import { useTranslation } from "@/contexts/translation-context";

interface RangeFilterProps {
  filter: RangeFilter;
  onChange: (filter: RangeFilter) => void;
}

export function RangeFilterComponent({ filter, onChange }: RangeFilterProps) {
  const { t } = useTranslation();
  const [localMin, setLocalMin] = useState(
    filter.value !== undefined ? String(filter.value) : ""
  );
  const [localMax, setLocalMax] = useState(
    filter.value2 !== undefined ? String(filter.value2) : ""
  );
  
  const debouncedMin = useDebounce(localMin, 500);
  const debouncedMax = useDebounce(localMax, 500);

  // Update parent when debounced values change
  useEffect(() => {
    const minValue = debouncedMin ? parseFloat(debouncedMin) : undefined;
    const maxValue = debouncedMax ? parseFloat(debouncedMax) : undefined;
    
    if (
      (minValue !== filter.value || maxValue !== filter.value2) &&
      (debouncedMin === "" || !isNaN(minValue!)) &&
      (debouncedMax === "" || !isNaN(maxValue!))
    ) {
      onChange({
        ...filter,
        value: minValue,
        value2: maxValue,
      });
    }
  }, [debouncedMin, debouncedMax]);

  // Sync local values when filter changes externally
  useEffect(() => {
    setLocalMin(filter.value !== undefined ? String(filter.value) : "");
    setLocalMax(filter.value2 !== undefined ? String(filter.value2) : "");
  }, [filter.value, filter.value2]);

  return (
    <div className="flex gap-2 items-center">
      <span className="text-sm text-muted-foreground whitespace-nowrap">{t.filters.between}</span>
      <Input
        type="number"
        value={localMin}
        onChange={(e) => setLocalMin(e.target.value)}
        placeholder={t.filters.min}
        className="flex-1"
      />
      <span className="text-sm text-muted-foreground">{t.filters.and}</span>
      <Input
        type="number"
        value={localMax}
        onChange={(e) => setLocalMax(e.target.value)}
        placeholder={t.filters.max}
        className="flex-1"
      />
    </div>
  );
}

