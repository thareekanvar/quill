"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/contexts/translation-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TextFilter } from "@/types/filters";
import { getOperatorLabel } from "@/lib/helpers/filter-helpers";
import { useDebounce } from "@/hooks/use-debounce";

interface TextFilterProps {
  filter: TextFilter;
  onChange: (filter: TextFilter) => void;
}

export function TextFilterComponent({ filter, onChange }: TextFilterProps) {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(filter.value || "");
  const debouncedValue = useDebounce(localValue, 500);

  // Update parent when debounced value changes
  useEffect(() => {
    if (debouncedValue !== filter.value) {
      onChange({ ...filter, value: debouncedValue });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  // Sync local value when filter changes externally
  useEffect(() => {
    setLocalValue(filter.value || "");
  }, [filter.value]);

  return (
    <div className="flex gap-2 items-center">
      <Select
        value={filter.operator}
        onValueChange={(operator) =>
          onChange({ ...filter, operator: operator as TextFilter["operator"] })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="equals">{getOperatorLabel("equals")}</SelectItem>
          <SelectItem value="notEquals">{getOperatorLabel("notEquals")}</SelectItem>
          <SelectItem value="contains">{getOperatorLabel("contains")}</SelectItem>
          <SelectItem value="notContains">{getOperatorLabel("notContains")}</SelectItem>
          <SelectItem value="startsWith">{getOperatorLabel("startsWith")}</SelectItem>
          <SelectItem value="endsWith">{getOperatorLabel("endsWith")}</SelectItem>
        </SelectContent>
      </Select>
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={t.filters.enterValue}
        className="flex-1"
      />
    </div>
  );
}

