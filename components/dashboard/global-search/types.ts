import type { Icon } from "@phosphor-icons/react";

export interface SearchItem {
  id: string;
  title: string;
  url: string;
  icon: Icon;
  category: "routes" | "tables";
  description?: string;
}

export interface SearchResultItemProps {
  item: SearchItem;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

export interface SearchResultGroupProps {
  title: string;
  items: SearchItem[];
  filteredItems: SearchItem[];
  selectedIndex: number;
  onItemSelect: (item: SearchItem) => void;
  onItemHover: (index: number) => void;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}

