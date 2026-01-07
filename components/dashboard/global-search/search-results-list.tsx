"use client";

import { useMemo } from "react";
import { useTranslation } from "@/contexts/translation-context";
import { SearchResultGroup } from "./search-result-group";
import type { SearchItem } from "./types";

interface SearchResultsListProps {
  filteredItems: SearchItem[];
  selectedIndex: number;
  searchQuery: string;
  onItemSelect: (item: SearchItem) => void;
  onItemHover: (index: number) => void;
  listRef?: React.RefObject<HTMLDivElement | null>;
}

export function SearchResultsList({
  filteredItems,
  selectedIndex,
  searchQuery,
  onItemSelect,
  onItemHover,
  listRef,
}: SearchResultsListProps) {
  const { t } = useTranslation();

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {
      routes: [],
      tables: [],
    };

    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });

    return groups;
  }, [filteredItems]);

  if (filteredItems.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground dark:text-muted-foreground/80">
        {t.sidebar.globalSearchNoResults} &quot;{searchQuery}&quot;
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="mt-4 max-h-[400px] overflow-y-auto space-y-4 pr-2 -mr-2"
    >
      {groupedItems.routes.length > 0 && (
        <SearchResultGroup
          title={t.sidebar.globalSearchRoutes}
          items={groupedItems.routes}
          filteredItems={filteredItems}
          selectedIndex={selectedIndex}
          onItemSelect={onItemSelect}
          onItemHover={onItemHover}
        />
      )}

      {groupedItems.tables.length > 0 && (
        <SearchResultGroup
          title={`${t.sidebar.globalSearchTables} (${groupedItems.tables.length})`}
          items={groupedItems.tables}
          filteredItems={filteredItems}
          selectedIndex={selectedIndex}
          onItemSelect={onItemSelect}
          onItemHover={onItemHover}
        />
      )}
    </div>
  );
}

