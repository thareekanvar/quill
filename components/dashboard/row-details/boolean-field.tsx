"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import type { TableColumn } from "@/types";

interface BooleanFieldProps {
  column: TableColumn;
  value: unknown;
  onChange: (value: boolean) => void;
}

/**
 * BooleanField component for editing boolean columns using a Switch
 * @param column - The table column definition
 * @param value - The current field value
 * @param onChange - Callback when the value changes
 */
export function BooleanField({
  column,
  value,
  onChange,
}: BooleanFieldProps) {
  return (
    <Field>
      <div className="flex items-center justify-between">
        <FieldLabel htmlFor={column.columnName}>
          {column.columnName}
          {column.isNullable === "NO" && (
            <span className="text-destructive ml-1">*</span>
          )}
        </FieldLabel>
        <Switch
          id={column.columnName}
          checked={Boolean(value)}
          onCheckedChange={onChange}
        />
      </div>
    </Field>
  );
}

