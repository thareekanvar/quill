"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Field, FieldLabel } from "@/components/ui/field";
import type { TableColumn } from "@/types";
import { isArrayValue, isObjectValue } from "@/lib/helpers/type-helpers";
import { useTranslation } from "@/contexts/translation-context";

interface ArrayFieldProps {
  column: TableColumn;
  value: unknown;
}

/**
 * ArrayField component for displaying array column values (read-only)
 * @param column - The table column definition
 * @param value - The current field value (should be an array)
 */
export function ArrayField({ column, value }: ArrayFieldProps) {
  const { t } = useTranslation();
  const arrayValue = isArrayValue(value) ? (value as unknown[]) : [];

  return (
    <Field>
      <FieldLabel>{column.columnName}</FieldLabel>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={column.columnName}>
          <AccordionTrigger>
            {column.columnName} ({arrayValue.length} {t.rowDetails.items})
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {arrayValue.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.pages.emptyArray}</p>
              ) : (
                arrayValue.map((item, index) => (
                  <div
                    key={index}
                    className="rounded border p-2 text-sm"
                  >
                    {isObjectValue(item) ? (
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(item, null, 2)}
                      </pre>
                    ) : (
                      String(item)
                    )}
                  </div>
                ))
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Field>
  );
}

