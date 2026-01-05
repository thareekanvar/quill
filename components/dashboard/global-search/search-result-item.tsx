"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { SearchResultItemProps } from "./types";

export function SearchResultItem({
  item,
  isSelected,
  onClick,
  onMouseEnter,
}: SearchResultItemProps) {
  const Icon = item.icon;

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150",
        "hover:bg-primary hover:text-primary-foreground",
        isSelected && "bg-primary text-primary-foreground shadow-md"
      )}
    >
      <Icon
        className={cn(
          "size-5 shrink-0 transition-colors",
          isSelected
            ? "text-primary-foreground"
            : "text-muted-foreground group-hover:text-primary-foreground"
        )}
      />
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "font-medium text-sm transition-colors",
            isSelected
              ? "text-primary-foreground"
              : "text-foreground group-hover:text-primary-foreground"
          )}
        >
          {item.title}
        </div>
        {item.description && (
          <div
            className={cn(
              "text-xs truncate transition-colors",
              isSelected
                ? "text-primary-foreground/90"
                : "text-muted-foreground group-hover:text-primary-foreground/90"
            )}
          >
            {item.description}
          </div>
        )}
      </div>
      <ArrowRight
        className={cn(
          "size-4 shrink-0 transition-all duration-150",
          isSelected
            ? "opacity-100 text-primary-foreground"
            : "opacity-0 group-hover:opacity-100 group-hover:text-primary-foreground text-muted-foreground"
        )}
      />
    </div>
  );
}

