"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { TableColumn } from "@/types";

interface ObjectFieldProps {
  column: TableColumn;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function ObjectField({
  column,
  value,
  onChange,
}: ObjectFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsed = JSON.parse(e.target.value);
      onChange(parsed);
    } catch {
      // Invalid JSON, but allow typing
      onChange(e.target.value);
    }
  };

  return (
    <Field>
      <FieldLabel htmlFor={column.columnName}>
        {column.columnName}
        {column.isNullable === "NO" && (
          <span className="text-destructive ml-1">*</span>
        )}
      </FieldLabel>
      <Textarea
        id={column.columnName}
        value={JSON.stringify(value, null, 2)}
        onChange={handleChange}
        rows={6}
        className="font-mono text-sm"
      />
    </Field>
  );
}

