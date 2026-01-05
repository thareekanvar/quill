"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/contexts/translation-context";
import type { SearchInputProps } from "./types";

export function SearchInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  inputRef,
}: SearchInputProps) {
  const { t } = useTranslation();
  const searchPlaceholder = placeholder || t.sidebar.globalSearchPlaceholder;
  const isMac =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return (
    <div className="relative">
      <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground dark:text-muted-foreground/80" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={searchPlaceholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="pl-9 pr-20 h-12 text-base bg-background border-border focus-visible:border-ring focus-visible:ring-ring/30"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          {isMac ? "⌘" : "Ctrl"}
        </kbd>
        <span className="text-[10px]">+</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          K
        </kbd>
      </div>
    </div>
  );
}

