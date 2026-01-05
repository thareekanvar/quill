"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOperatorLabel } from "@/lib/helpers/filter-helpers";
import type { MultiSelectFilter } from "@/types/filters";
import { useTranslation } from "@/contexts/translation-context";

interface MultiSelectFilterProps {
  filter: MultiSelectFilter;
  onChange: (filter: MultiSelectFilter) => void;
  options: string[];
}

export function MultiSelectFilterComponent({
  filter,
  onChange,
  options,
}: MultiSelectFilterProps) {
  const { t } = useTranslation();
  const selectedValues = Array.isArray(filter.value) ? filter.value : [];

  return (
    <div className="flex gap-2 items-center flex-wrap">
      <Select
        value={filter.operator}
        onValueChange={(operator) =>
          onChange({
            ...filter,
            operator: operator as MultiSelectFilter["operator"],
          })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="in">{getOperatorLabel("in")}</SelectItem>
          <SelectItem value="notIn">{getOperatorLabel("notIn")}</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value=""
        onValueChange={(value) => {
          if (!selectedValues.includes(value)) {
            onChange({ ...filter, value: [...selectedValues, value] });
          }
        }}
      >
        <SelectTrigger className="flex-1 min-w-[200px]">
          <SelectValue placeholder={t.filters.selectValues} />
        </SelectTrigger>
        <SelectContent>
          {options
            .filter((opt) => !selectedValues.includes(opt))
            .map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedValues.map((val) => (
            <span
              key={val}
              className="px-2 py-1 text-xs bg-muted rounded-md flex items-center gap-1"
            >
              {val}
              <button
                onClick={() => {
                  onChange({
                    ...filter,
                    value: selectedValues.filter((v) => v !== val),
                  });
                }}
                className="hover:text-destructive"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

