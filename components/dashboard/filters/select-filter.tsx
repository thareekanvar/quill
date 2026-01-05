"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SelectFilter } from "@/types/filters";
import { getOperatorLabel } from "@/lib/helpers/filter-helpers";
import { useTranslation } from "@/contexts/translation-context";

interface SelectFilterProps {
  filter: SelectFilter;
  onChange: (filter: SelectFilter) => void;
  options: string[];
}

export function SelectFilterComponent({
  filter,
  onChange,
  options,
}: SelectFilterProps) {
  const { t } = useTranslation();
  const isMultiOperator = filter.operator === "in" || filter.operator === "notIn";
  const currentValue = Array.isArray(filter.value)
    ? filter.value[0] || ""
    : filter.value || "";

  return (
    <div className="flex gap-2 items-center">
      <Select
        value={filter.operator}
        onValueChange={(operator) =>
          onChange({
            ...filter,
            operator: operator as SelectFilter["operator"],
            value: isMultiOperator ? [] : undefined,
          })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="equals">{getOperatorLabel("equals")}</SelectItem>
          <SelectItem value="notEquals">{getOperatorLabel("notEquals")}</SelectItem>
          <SelectItem value="in">{getOperatorLabel("in")}</SelectItem>
          <SelectItem value="notIn">{getOperatorLabel("notIn")}</SelectItem>
        </SelectContent>
      </Select>
      {!isMultiOperator ? (
        <Select
          value={currentValue}
          onValueChange={(value) => onChange({ ...filter, value })}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={t.filters.selectValue} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Select
          value={Array.isArray(filter.value) && filter.value.length > 0 ? filter.value[0] : ""}
          onValueChange={(value) => {
            const current = Array.isArray(filter.value) ? filter.value : [];
            if (!current.includes(value)) {
              onChange({ ...filter, value: [...current, value] });
            }
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={t.filters.selectValues} />
          </SelectTrigger>
          <SelectContent>
            {options
              .filter((opt) => !Array.isArray(filter.value) || !filter.value.includes(opt))
              .map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}
      {isMultiOperator && Array.isArray(filter.value) && filter.value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {filter.value.map((val) => (
            <span
              key={val}
              className="px-2 py-1 text-xs bg-muted rounded-md flex items-center gap-1"
            >
              {val}
              <button
                onClick={() => {
                  onChange({
                    ...filter,
                    value: filter.value.filter((v) => v !== val),
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

