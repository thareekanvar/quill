"use client";

import { SearchResultItem } from "./search-result-item";
import type { SearchResultGroupProps } from "./types";

export function SearchResultGroup({
  title,
  items,
  filteredItems,
  selectedIndex,
  onItemSelect,
  onItemHover,
}: SearchResultGroupProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground dark:text-muted-foreground/90 uppercase tracking-wider">
        {title}
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const globalIndex = filteredItems.indexOf(item);
          return (
            <SearchResultItem
              key={item.id}
              item={item}
              isSelected={selectedIndex === globalIndex}
              onClick={() => onItemSelect(item)}
              onMouseEnter={() => onItemHover(globalIndex)}
            />
          );
        })}
      </div>
    </div>
  );
}

