"use client";

import { useEffect } from "react";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import {
  formatValueForInput,
  getInputType,
  parseValueFromInput,
} from "@/lib/helpers/type-helpers";
import { generateUUID } from "@/lib/helpers/row-details-helpers";
import type { TableColumn } from "@/types";
import { useTranslation } from "@/contexts/translation-context";

interface PrimaryKeyInputFieldProps {
  column: TableColumn;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function PrimaryKeyInputField({
  column,
  value,
  onChange,
}: PrimaryKeyInputFieldProps) {
  const inputType = getInputType(column);
  const dataType = column.dataType.toLowerCase().trim();
  const columnName = column.columnName.toLowerCase();
  
  // Check for UUID types - PostgreSQL can store UUIDs as 'uuid' type or 'text' type
  const isUUIDType = 
    dataType === "uuid" || 
    dataType === "uuidv4" ||
    dataType.includes("uuid");
  
  // Check if it's a text type primary key that could be a UUID
  // Common patterns: id, uuid, *_id, *_uuid
  const isTextPrimaryKey = dataType === "text" || dataType === "varchar" || dataType === "character varying";
  const looksLikeIdColumn = 
    columnName === "id" || 
    columnName.endsWith("_id") || 
    columnName.includes("uuid") ||
    columnName.endsWith("_uuid");
  
  // Show generate button for UUID types OR text primary keys that look like IDs
  const showGenerateButton = isUUIDType || (isTextPrimaryKey && looksLikeIdColumn);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseValueFromInput(e.target.value, column.dataType);
    onChange(parsed);
  };

  const handleGenerate = () => {
    if (showGenerateButton) {
      onChange(generateUUID());
    }
  };

  // Auto-generate UUID if no value exists and it's a UUID-type primary key
  useEffect(() => {
    if (!value && showGenerateButton) {
      onChange(generateUUID());
    }
  }, [value, showGenerateButton, onChange]);

  const { t } = useTranslation();

  return (
    <Field>
      <FieldLabel htmlFor={column.columnName}>
        {column.columnName}
        <span className="text-xs text-muted-foreground ml-2">
          ({t.rowDetails.primaryKey})
        </span>
        {column.isNullable === "NO" && (
          <span className="text-destructive ml-1">*</span>
        )}
      </FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={column.columnName}
          type={inputType === "number" ? "number" : "text"}
          value={formatValueForInput(value, column.dataType)}
          onChange={handleChange}
        />
        {showGenerateButton && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleGenerate}
              title={t.rowDetails.generateUUID}
            >
              <ArrowsClockwise className="size-4" />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    </Field>
  );
}
