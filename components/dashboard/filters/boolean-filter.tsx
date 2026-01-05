"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BooleanFilter } from "@/types/filters";
import { useTranslation } from "@/contexts/translation-context";

interface BooleanFilterProps {
  filter: BooleanFilter;
  onChange: (filter: BooleanFilter) => void;
}

export function BooleanFilterComponent({ filter, onChange }: BooleanFilterProps) {
  const { t } = useTranslation();
  return (
    <Select
      value={filter.value === undefined ? "" : String(filter.value)}
      onValueChange={(value) =>
        onChange({
          ...filter,
          value: value === "true",
        })
      }
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t.filters.selectValue} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="true">{t.filters.true}</SelectItem>
        <SelectItem value="false">{t.filters.false}</SelectItem>
      </SelectContent>
    </Select>
  );
}

