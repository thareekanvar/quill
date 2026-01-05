"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DateFilter } from "@/types/filters";
import { getOperatorLabel } from "@/lib/helpers/filter-helpers";
import { formatISO } from "date-fns";

interface DateFilterProps {
  filter: DateFilter;
  onChange: (filter: DateFilter) => void;
}

export function DateFilterComponent({ filter, onChange }: DateFilterProps) {
  const isNullOperator = filter.operator === "isNull" || filter.operator === "isNotNull";

  // Format date value for input
  const getDateInputValue = (): string => {
    if (!filter.value) return "";
    const date = filter.value instanceof Date ? filter.value : new Date(filter.value);
    if (isNaN(date.getTime())) return "";
    // Format as YYYY-MM-DD for date input
    return formatISO(date, { representation: "date" });
  };

  return (
    <div className="flex gap-2 items-center">
      <Select
        value={filter.operator}
        onValueChange={(operator) =>
          onChange({ ...filter, operator: operator as DateFilter["operator"] })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="equals">{getOperatorLabel("equals")}</SelectItem>
          <SelectItem value="notEquals">{getOperatorLabel("notEquals")}</SelectItem>
          <SelectItem value="before">{getOperatorLabel("before")}</SelectItem>
          <SelectItem value="after">{getOperatorLabel("after")}</SelectItem>
          <SelectItem value="on">{getOperatorLabel("on")}</SelectItem>
          <SelectItem value="isNull">{getOperatorLabel("isNull")}</SelectItem>
          <SelectItem value="isNotNull">{getOperatorLabel("isNotNull")}</SelectItem>
        </SelectContent>
      </Select>
      {!isNullOperator && (
        <Input
          type="date"
          value={getDateInputValue()}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : undefined;
            onChange({ ...filter, value: date });
          }}
          className="flex-1"
        />
      )}
    </div>
  );
}

