"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { TableColumn } from "@/types";
import { useTranslation } from "@/contexts/translation-context";

interface PrimaryKeyFieldProps {
  column: TableColumn;
  value: unknown;
}

export function PrimaryKeyField({ column, value }: PrimaryKeyFieldProps) {
  const { t } = useTranslation();
  return (
    <Field>
      <FieldLabel>
        {column.columnName}
        <span className="text-xs text-muted-foreground ml-2">
          ({t.rowDetails.primaryKeyReadOnly})
        </span>
      </FieldLabel>
      <Input
        value={String(value ?? "")}
        disabled
        className="bg-muted"
      />
    </Field>
  );
}

