"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/contexts/translation-context";
import { useSearchData } from "./use-search-data";
import { SearchInput } from "./search-input";
import { SearchResultsList } from "./search-results-list";
import type { SearchItem } from "./types";

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchModal({
  open,
  onOpenChange,
}: GlobalSearchModalProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { allItems } = useSearchData();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Filter items based on search query
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return allItems;
    }

    const query = searchQuery.toLowerCase().trim();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.url.toLowerCase().includes(query)
    );
  }, [searchQuery, allItems]);

  // Reset selected index when filtered items change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  // Focus input when modal opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        setSearchQuery("");
        setSelectedIndex(0);
      }, 100);
    }
  }, [open]);

  // Scroll selected item into view
  React.useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelectItem(filteredItems[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  const handleSelectItem = (item: SearchItem) => {
    router.push(item.url);
    onOpenChange(false);
    setSearchQuery("");
    setSelectedIndex(0);
  };

  const handleItemHover = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-background border-border shadow-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="sr-only">
            {t.sidebar.globalSearch}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 bg-background">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onKeyDown={handleKeyDown}
            inputRef={inputRef}
          />

          <SearchResultsList
            filteredItems={filteredItems}
            selectedIndex={selectedIndex}
            searchQuery={searchQuery}
            onItemSelect={handleSelectItem}
            onItemHover={handleItemHover}
            listRef={listRef}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

