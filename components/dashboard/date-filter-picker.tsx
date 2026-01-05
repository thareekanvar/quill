"use client";

import { useState } from "react";
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { Calendar as CalendarIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { cn } from "@/lib/utils";

export type DateFilterPreset = "today" | "yesterday" | "thisWeek" | "thisMonth" | "thisYear" | "custom" | null;

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateFilterPickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  preset?: DateFilterPreset;
  onPresetChange?: (preset: DateFilterPreset) => void;
}

export function DateFilterPicker({
  value,
  onChange,
  preset = null,
  onPresetChange,
}: DateFilterPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const applyPreset = (presetValue: DateFilterPreset) => {
    if (!onPresetChange) return;
    
    const now = new Date();
    let range: DateRange = { from: undefined, to: undefined };

    switch (presetValue) {
      case "today":
        range = {
          from: startOfDay(now),
          to: endOfDay(now),
        };
        break;
      case "yesterday":
        const yesterday = subDays(now, 1);
        range = {
          from: startOfDay(yesterday),
          to: endOfDay(yesterday),
        };
        break;
      case "thisWeek":
        range = {
          from: startOfWeek(now, { weekStartsOn: 1 }),
          to: endOfWeek(now, { weekStartsOn: 1 }),
        };
        break;
      case "thisMonth":
        range = {
          from: startOfMonth(now),
          to: endOfMonth(now),
        };
        break;
      case "thisYear":
        range = {
          from: startOfYear(now),
          to: endOfYear(now),
        };
        break;
      case "custom":
        range = { from: undefined, to: undefined };
        break;
      case null:
        range = { from: undefined, to: undefined };
        break;
    }

    onChange(range);
    onPresetChange(presetValue);
  };

  const formatDateRange = () => {
    if (!value.from && !value.to) {
      return "Select date range";
    }
    if (value.from && value.to) {
      return `${format(value.from, "MMM d, yyyy")} - ${format(value.to, "MMM d, yyyy")}`;
    }
    if (value.from) {
      return `From ${format(value.from, "MMM d, yyyy")}`;
    }
    if (value.to) {
      return `Until ${format(value.to, "MMM d, yyyy")}`;
    }
    return "Select date range";
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={preset || "custom"}
        onValueChange={(val) => applyPreset(val as DateFilterPreset)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="thisWeek">This Week</SelectItem>
          <SelectItem value="thisMonth">This Month</SelectItem>
          <SelectItem value="thisYear">This Year</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !value.from && !value.to && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: value.from, to: value.to }}
            onSelect={(range) => {
              onChange({
                from: range?.from,
                to: range?.to,
              });
              if (range?.from && range?.to) {
                setIsOpen(false);
                if (onPresetChange) {
                  onPresetChange("custom");
                }
              }
            }}
            numberOfMonths={2}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

