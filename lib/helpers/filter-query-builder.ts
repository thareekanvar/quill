/**
 * Build SQL WHERE clauses from filters
 */

import type { Filter } from "@/types/filters";
import { buildSafeColumnName } from "./query-helpers";

/**
 * Build WHERE clause and parameters from filters
 */
export function buildWhereClause(
  filters: Filter[]
): { whereClause: string; params: unknown[] } {
  if (!filters || filters.length === 0) {
    return { whereClause: "", params: [] };
  }

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  for (const filter of filters) {
    const column = buildSafeColumnName(filter.column);
    
    // Handle null checks first (they don't need values)
    if (filter.operator === "isNull" || filter.operator === "isNotNull") {
      if (filter.operator === "isNull") {
        conditions.push(`${column} IS NULL`);
      } else {
        conditions.push(`${column} IS NOT NULL`);
      }
      continue;
    }
    
    // Skip filters without values (except null checks which are handled above)
    // Check value based on filter type
    let hasValue = false;
    if (filter.type === "multiSelect" || 
        (filter.type === "foreignKey" && (filter.operator === "in" || filter.operator === "notIn"))) {
      // For array-based filters, check array length
      const arrayValue = Array.isArray(filter.value) ? filter.value : [];
      hasValue = arrayValue.length > 0 && arrayValue.every(v => v !== undefined && v !== null && v !== "");
    } else if (filter.type === "foreignKey") {
      // For foreign key with equals/notEquals, any non-empty value is valid (including 0, false)
      hasValue = filter.value !== undefined && filter.value !== null && filter.value !== "";
    } else if (filter.type === "text") {
      // For text filters, check if value is not just whitespace
      hasValue = filter.value !== undefined && 
                 filter.value !== null && 
                 String(filter.value).trim() !== "";
    } else {
      // For other filters, standard check
      hasValue = filter.value !== undefined && filter.value !== null && filter.value !== "";
    }
    
    if (!hasValue) {
      continue;
    }

    switch (filter.type) {
      case "text":
        switch (filter.operator) {
          case "equals":
            // Use ILIKE for case-insensitive matching
            conditions.push(`${column}::text ILIKE $${paramIndex}`);
            params.push(String(filter.value).trim());
            paramIndex++;
            break;
          case "notEquals":
            // Use NOT ILIKE for case-insensitive matching
            conditions.push(`${column}::text NOT ILIKE $${paramIndex}`);
            params.push(String(filter.value).trim());
            paramIndex++;
            break;
          case "contains":
            conditions.push(`${column}::text ILIKE $${paramIndex}`);
            params.push(`%${String(filter.value).trim()}%`);
            paramIndex++;
            break;
          case "notContains":
            conditions.push(`${column}::text NOT ILIKE $${paramIndex}`);
            params.push(`%${String(filter.value).trim()}%`);
            paramIndex++;
            break;
          case "startsWith":
            conditions.push(`${column}::text ILIKE $${paramIndex}`);
            params.push(`${String(filter.value).trim()}%`);
            paramIndex++;
            break;
          case "endsWith":
            conditions.push(`${column}::text ILIKE $${paramIndex}`);
            params.push(`%${String(filter.value).trim()}`);
            paramIndex++;
            break;
        }
        break;

      case "number":
        switch (filter.operator) {
          case "equals":
            conditions.push(`${column} = $${paramIndex}`);
            params.push(filter.value);
            paramIndex++;
            break;
          case "notEquals":
            conditions.push(`${column} != $${paramIndex}`);
            params.push(filter.value);
            paramIndex++;
            break;
          case "greaterThan":
            conditions.push(`${column} > $${paramIndex}`);
            params.push(filter.value);
            paramIndex++;
            break;
          case "greaterThanOrEqual":
            conditions.push(`${column} >= $${paramIndex}`);
            params.push(filter.value);
            paramIndex++;
            break;
          case "lessThan":
            conditions.push(`${column} < $${paramIndex}`);
            params.push(filter.value);
            paramIndex++;
            break;
          case "lessThanOrEqual":
            conditions.push(`${column} <= $${paramIndex}`);
            params.push(filter.value);
            paramIndex++;
            break;
        }
        break;

      case "range":
        if (filter.value !== undefined && filter.value2 !== undefined) {
          conditions.push(
            `${column} BETWEEN $${paramIndex} AND $${paramIndex + 1}`
          );
          params.push(filter.value, filter.value2);
          paramIndex += 2;
        }
        break;

      case "date":
        switch (filter.operator) {
          case "equals":
          case "on":
            // For date equality, compare date parts
            // Convert Date object to ISO string if needed
            const dateValue1 = filter.value instanceof Date 
              ? filter.value.toISOString() 
              : filter.value;
            conditions.push(
              `DATE(${column}) = DATE($${paramIndex}::timestamp)`
            );
            params.push(dateValue1);
            paramIndex++;
            break;
          case "notEquals":
            const dateValue2 = filter.value instanceof Date 
              ? filter.value.toISOString() 
              : filter.value;
            conditions.push(
              `DATE(${column}) != DATE($${paramIndex}::timestamp)`
            );
            params.push(dateValue2);
            paramIndex++;
            break;
          case "before":
            const dateValue3 = filter.value instanceof Date 
              ? filter.value.toISOString() 
              : filter.value;
            conditions.push(`${column} < $${paramIndex}::timestamp`);
            params.push(dateValue3);
            paramIndex++;
            break;
          case "after":
            const dateValue4 = filter.value instanceof Date 
              ? filter.value.toISOString() 
              : filter.value;
            conditions.push(`${column} > $${paramIndex}::timestamp`);
            params.push(dateValue4);
            paramIndex++;
            break;
          // isNull and isNotNull are handled above before the switch
        }
        break;

      case "dateRange":
        if (filter.value && filter.value2) {
          // Convert Date objects to ISO strings if needed
          const startDate = filter.value instanceof Date 
            ? filter.value.toISOString() 
            : filter.value;
          const endDate = filter.value2 instanceof Date 
            ? filter.value2.toISOString() 
            : filter.value2;
          conditions.push(
            `${column} BETWEEN $${paramIndex}::timestamp AND $${paramIndex + 1}::timestamp`
          );
          params.push(startDate, endDate);
          paramIndex += 2;
        }
        break;

      case "boolean":
        conditions.push(`${column} = $${paramIndex}`);
        params.push(filter.value);
        paramIndex++;
        break;

      case "select":
        if (filter.operator === "in" || filter.operator === "notIn") {
          const values = Array.isArray(filter.value) ? filter.value : [filter.value];
          if (values.length > 0) {
            const placeholders = values
              .map(() => `$${paramIndex++}`)
              .join(", ");
            const operator = filter.operator === "in" ? "IN" : "NOT IN";
            conditions.push(`${column} ${operator} (${placeholders})`);
            params.push(...values);
          }
        } else {
          conditions.push(
            `${column} ${filter.operator === "equals" ? "=" : "!="} $${paramIndex}`
          );
          params.push(filter.value);
          paramIndex++;
        }
        break;

      case "multiSelect":
        const values = Array.isArray(filter.value) ? filter.value : [];
        if (values.length > 0) {
          const placeholders = values
            .map(() => `$${paramIndex++}`)
            .join(", ");
          const operator = filter.operator === "in" ? "IN" : "NOT IN";
          conditions.push(`${column} ${operator} (${placeholders})`);
          params.push(...values);
        }
        break;

      case "foreignKey":
        if (filter.operator === "in" || filter.operator === "notIn") {
          const fkValues = Array.isArray(filter.value) ? filter.value : [filter.value];
          if (fkValues.length > 0 && fkValues.every(v => v !== undefined && v !== null && v !== "")) {
            const placeholders = fkValues
              .map(() => `$${paramIndex++}`)
              .join(", ");
            const operator = filter.operator === "in" ? "IN" : "NOT IN";
            conditions.push(`${column} ${operator} (${placeholders})`);
            params.push(...fkValues);
          }
        } else {
          // For equals/notEquals, ensure value is valid
          if (filter.value !== undefined && filter.value !== null && filter.value !== "") {
            conditions.push(
              `${column} ${filter.operator === "equals" ? "=" : "!="} $${paramIndex}`
            );
            params.push(filter.value);
            paramIndex++;
          }
        }
        break;
    }
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return { whereClause, params };
}

