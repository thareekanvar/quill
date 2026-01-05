"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/translation-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Funnel } from "@phosphor-icons/react";
import type { TableColumn } from "@/types";
import type { Filter, FilterType } from "@/types/filters";
import {
  buildFilterConfig,
  getFilterType,
  hasFilterValue,
} from "@/lib/helpers/filter-helpers";
import {
  TextFilterComponent,
  NumberFilterComponent,
  RangeFilterComponent,
  DateFilterComponent,
  DateRangeFilterComponent,
  BooleanFilterComponent,
  SelectFilterComponent,
  MultiSelectFilterComponent,
  ForeignKeyFilterComponent,
} from "./filters";

interface FilterPanelProps {
  columns: TableColumn[];
  filters: Filter[];
  onFiltersChange: (filters: Filter[]) => void;
  schemaName?: string;
}

export function FilterPanel({
  columns,
  filters,
  onFiltersChange,
  schemaName,
}: FilterPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Only update filters when they have values (to avoid unnecessary refreshes)
  const handleFilterUpdate = (updatedFilter: Filter) => {
    const newFilters = filters.map((f) =>
      f.id === updatedFilter.id ? updatedFilter : f
    );
    onFiltersChange(newFilters);
  };

  const addFilter = () => {
    const unusedColumns = columns.filter(
      (col) => !filters.some((f) => f.column === col.columnName)
    );

    if (unusedColumns.length === 0) return;

    const column = unusedColumns[0];
    const filterType = getFilterType(column);
    const config = buildFilterConfig(column);

    const newFilter: Filter = {
      id: `filter-${Date.now()}-${Math.random()}`,
      column: column.columnName,
      type: filterType,
      operator: config.operators[0],
      value: undefined,
    } as Filter;

    onFiltersChange([...filters, newFilter]);
  };

  const removeFilter = (filterId: string) => {
    onFiltersChange(filters.filter((f) => f.id !== filterId));
  };


  const clearAllFilters = () => {
    onFiltersChange([]);
  };

  const activeFiltersCount = filters.filter(hasFilterValue).length;

  const renderFilterInput = (filter: Filter) => {
    const column = columns.find((c) => c.columnName === filter.column);
    if (!column) return null;

    switch (filter.type) {
      case "text":
        return (
          <TextFilterComponent
            filter={filter}
            onChange={handleFilterUpdate}
          />
        );
      case "number":
        return (
          <NumberFilterComponent
            filter={filter}
            onChange={handleFilterUpdate}
          />
        );
      case "range":
        return (
          <RangeFilterComponent
            filter={filter}
            onChange={handleFilterUpdate}
          />
        );
      case "date":
        return (
          <DateFilterComponent
            filter={filter}
            onChange={handleFilterUpdate}
          />
        );
      case "dateRange":
        return (
          <DateRangeFilterComponent
            filter={filter}
            onChange={handleFilterUpdate}
          />
        );
      case "boolean":
        return (
          <BooleanFilterComponent
            filter={filter}
            onChange={handleFilterUpdate}
          />
        );
      case "select":
        // For select, we'd need to fetch distinct values - for now, use text input
        // In a real implementation, you'd query the database for distinct values
        return (
          <TextFilterComponent
            filter={{ ...filter, type: "text" } as any}
            onChange={(f) => handleFilterUpdate({ ...f, type: "select" } as any)}
          />
        );
      case "multiSelect":
        // Similar to select - would need distinct values
        return (
          <TextFilterComponent
            filter={{ ...filter, type: "text" } as any}
            onChange={(f) => handleFilterUpdate({ ...f, type: "multiSelect" } as any)}
          />
        );
      case "foreignKey":
        return (
          <ForeignKeyFilterComponent
            filter={filter}
            onChange={handleFilterUpdate}
            schemaName={schemaName}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Funnel className="size-4" />
            {t.filters.filters}
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] max-h-[80vh] overflow-y-auto" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{t.filters.filterTableData}</h3>
              {filters.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  {t.filters.clearAll}
                </Button>
              )}
            </div>

            {filters.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                {t.filters.noFiltersApplied}
              </div>
            ) : (
              <div className="space-y-3">
                {filters.map((filter) => {
                  const column = columns.find((c) => c.columnName === filter.column);
                  return (
                    <div
                      key={filter.id}
                      className="flex gap-2 items-start p-3 border rounded-lg"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Select
                            value={filter.column}
                            onValueChange={(columnName) => {
                              const newColumn = columns.find(
                                (c) => c.columnName === columnName
                              );
                              if (newColumn) {
                                const newFilterType = getFilterType(newColumn);
                                const config = buildFilterConfig(newColumn);
                                handleFilterUpdate({
                                  ...filter,
                                  column: columnName,
                                  type: newFilterType,
                                  operator: config.operators[0],
                                  value: undefined,
                                  value2: undefined,
                                } as Filter);
                              }
                            }}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map((col) => (
                                <SelectItem key={col.columnName} value={col.columnName}>
                                  {col.columnName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => removeFilter(filter.id)}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                        {renderFilterInput(filter)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Button
              variant="outline"
              onClick={addFilter}
              className="w-full"
              disabled={
                columns.filter(
                  (col) => !filters.some((f) => f.column === col.columnName)
                ).length === 0
              }
            >
              <Plus className="size-4 mr-2" />
              {t.filters.addFilter}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

