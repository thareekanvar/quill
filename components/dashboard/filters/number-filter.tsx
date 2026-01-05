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
import type { NumberFilter } from "@/types/filters";
import { getOperatorLabel } from "@/lib/helpers/filter-helpers";
import { useDebounce } from "@/hooks/use-debounce";

interface NumberFilterProps {
  filter: NumberFilter;
  onChange: (filter: NumberFilter) => void;
}

export function NumberFilterComponent({ filter, onChange }: NumberFilterProps) {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(
    filter.value !== undefined ? String(filter.value) : ""
  );
  const debouncedValue = useDebounce(localValue, 500);

  // Update parent when debounced value changes
  useEffect(() => {
    const numValue = debouncedValue ? parseFloat(debouncedValue) : undefined;
    if (numValue !== filter.value && (debouncedValue === "" || !isNaN(numValue!))) {
      onChange({
        ...filter,
        value: numValue,
      });
    }
  }, [debouncedValue]);

  // Sync local value when filter changes externally
  useEffect(() => {
    setLocalValue(filter.value !== undefined ? String(filter.value) : "");
  }, [filter.value]);

  return (
    <div className="flex gap-2 items-center">
      <Select
        value={filter.operator}
        onValueChange={(operator) =>
          onChange({ ...filter, operator: operator as NumberFilter["operator"] })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="equals">{getOperatorLabel("equals")}</SelectItem>
          <SelectItem value="notEquals">{getOperatorLabel("notEquals")}</SelectItem>
          <SelectItem value="greaterThan">{getOperatorLabel("greaterThan")}</SelectItem>
          <SelectItem value="greaterThanOrEqual">
            {getOperatorLabel("greaterThanOrEqual")}
          </SelectItem>
          <SelectItem value="lessThan">{getOperatorLabel("lessThan")}</SelectItem>
          <SelectItem value="lessThanOrEqual">
            {getOperatorLabel("lessThanOrEqual")}
          </SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="number"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={t.filters.enterNumber}
        className="flex-1"
      />
    </div>
  );
}

