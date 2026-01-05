"use client";

import { Input } from "@/components/ui/input";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useTranslation } from "@/contexts/translation-context";

interface QuerySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function QuerySearch({
  value,
  onChange,
  placeholder,
}: QuerySearchProps) {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        placeholder={
          placeholder || t.queryHistory.searchPlaceholder
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}

