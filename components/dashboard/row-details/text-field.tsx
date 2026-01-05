"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { TableColumn } from "@/types";
import {
  formatValueForInput,
  getInputType,
  parseValueFromInput,
} from "@/lib/helpers/type-helpers";

interface TextFieldProps {
  column: TableColumn;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function TextField({ column, value, onChange }: TextFieldProps) {
  const inputType = getInputType(column);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseValueFromInput(e.target.value, column.dataType);
    onChange(parsed);
  };

  return (
    <Field>
      <FieldLabel htmlFor={column.columnName}>
        {column.columnName}
        {column.isNullable === "NO" && (
          <span className="text-destructive ml-1">*</span>
        )}
      </FieldLabel>
      <Input
        id={column.columnName}
        type={
          inputType === "number"
            ? "number"
            : inputType === "datetime-local"
            ? "datetime-local"
            : "text"
        }
        value={formatValueForInput(value, column.dataType)}
        onChange={handleChange}
      />
    </Field>
  );
}

