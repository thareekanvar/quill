"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "@phosphor-icons/react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TableColumn } from "@/types";
import { isDateTimeType } from "@/lib/helpers/type-helpers";

interface DateFieldProps {
  column: TableColumn;
  value: unknown;
  onChange: (value: unknown) => void;
}

/**
 * DateField component for editing date and timestamp columns
 * Supports both date-only and timestamp (with time) fields
 * @param column - The table column definition
 * @param value - The current field value
 * @param onChange - Callback when the value changes
 */
export function DateField({ column, value, onChange }: DateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Convert value to Date object (handles both Date objects and ISO strings)
  const dateValue: Date | undefined = (() => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === "string") {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  })();

  // Auto-set current date/time if no value exists
  useEffect(() => {
    if (!value) {
      // Set as ISO string format
      onChange(new Date().toISOString());
    }
  }, [value, onChange]);

  const isTimestamp =
    isDateTimeType(column.dataType) &&
    (column.dataType.toLowerCase().includes("timestamp") ||
      column.dataType.toLowerCase().includes("time"));

  // Get time string from date
  const timeValue = dateValue
    ? `${String(dateValue.getHours()).padStart(2, "0")}:${String(
        dateValue.getMinutes()
      ).padStart(2, "0")}`
    : "00:00";

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(null);
      return;
    }

    if (isTimestamp) {
      // For timestamps, preserve the time from current dateValue
      const [hours, minutes] = timeValue.split(":").map(Number);
      date.setHours(hours || 0, minutes || 0, 0, 0);
    } else {
      // For dates, set to start of day
      date.setHours(0, 0, 0, 0);
    }
    // Convert to ISO string format: 2025-12-28T20:36:11.591Z
    onChange(date.toISOString());
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!dateValue) return;
    const [hours, minutes] = e.target.value.split(":").map(Number);
    const updatedDate = new Date(dateValue);
    updatedDate.setHours(hours || 0, minutes || 0, 0, 0);
    // Convert to ISO string format: 2025-12-28T20:36:11.591Z
    onChange(updatedDate.toISOString());
  };

  const displayValue = dateValue
    ? format(dateValue, isTimestamp ? "PPP p" : "PPP")
    : "Pick a date";

  return (
    <Field>
      <FieldLabel htmlFor={column.columnName}>
        {column.columnName}
        {column.isNullable === "NO" && (
          <span className="text-destructive ml-1">*</span>
        )}
      </FieldLabel>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateValue && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            initialFocus
          />
          {isTimestamp && (
            <div className="p-3 border-t">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={timeValue}
                  onChange={handleTimeChange}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </Field>
  );
}
