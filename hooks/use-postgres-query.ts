import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { getConnection, saveQueryToHistory } from "@/lib/db/index";
import { hasFilterValue } from "@/lib/helpers/filter-helpers";
import { buildQualifiedTableName, buildSafeColumnName } from "@/lib/helpers/query-helpers";
import { buildWhereClause } from "@/lib/helpers/filter-query-builder";
import { calculateOffset } from "@/lib/helpers/pagination-helpers";
import { DEFAULT_SCHEMA, DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { TableInfo, TableDataResponse, TableDataParams } from "@/types";
import type { Filter } from "@/types/filters";

/**
 * Hook to get tables from Zustand store
 * Fetches tables only on initial load or when connectionId changes
 * @returns Tables data from Zustand store
 */
export function useTables() {
  const { connectionId, password } = useAuthStore();
  const { tables, isLoading, connectionId: storeConnectionId, fetchTables, refreshTables } = useSidebarStore();

  useEffect(() => {
    if (!connectionId || !password) {
      return;
    }

    // Only fetch if connectionId changed or tables are empty
    if (storeConnectionId !== connectionId || tables.length === 0) {
      getConnection(connectionId, password)
        .then((connection) => {
          if (connection) {
            fetchTables(connectionId, password, connection.url).catch((error) => {
              console.error("Failed to fetch tables:", error);
            });
          }
        })
        .catch((error) => {
          console.error("Failed to get connection:", error);
        });
    }
  }, [connectionId, password, storeConnectionId, tables.length, fetchTables]);

  return {
    data: { tables },
    isLoading,
    refetch: async () => {
      if (!connectionId || !password) {
        throw new Error("Not authenticated");
      }
      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }
      await refreshTables(connectionId, password, connection.url);
    },
  };
}

/**
 * Hook to fetch table data with pagination, sorting, and filtering
 * @param params - Table data parameters including table name, schema, pagination, sorting, and filters
 * @returns Query result with table data, schema, and pagination info
 */
export function useTableData(params: TableDataParams) {
  const { connectionId, password } = useAuthStore();
  const queryClient = useQueryClient();
  const {
    tableName,
    schemaName = DEFAULT_SCHEMA,
    page = DEFAULT_PAGE,
    limit = DEFAULT_PAGE_SIZE,
    sort,
    order = "ASC",
    filters,
  } = params;

  // Serialize filters for query key to ensure proper change detection
  // Sort filters by column to ensure consistent serialization, and only include filters with values
  interface SerializedFilter {
    column: string;
    type: string;
    operator: string;
    value?: unknown;
    value2?: unknown;
  }

  const activeFiltersForKey =
    filters && filters.length > 0
      ? filters
          .filter(hasFilterValue)
          .map((f): SerializedFilter => {
            // Convert Date objects to ISO strings for consistent serialization
            const serializedFilter: SerializedFilter = {
              column: f.column,
              type: f.type,
              operator: f.operator,
            };

            if (f.value instanceof Date) {
              serializedFilter.value = f.value.toISOString();
            } else {
              serializedFilter.value = f.value;
            }

            if (f.value2 !== undefined) {
              if (f.value2 instanceof Date) {
                serializedFilter.value2 = f.value2.toISOString();
              } else {
                serializedFilter.value2 = f.value2;
              }
            }

            return serializedFilter;
          })
          .sort((a, b) => a.column.localeCompare(b.column))
      : [];

  const filtersKey =
    activeFiltersForKey.length > 0 ? JSON.stringify(activeFiltersForKey) : null;

  return useQuery<TableDataResponse>({
    queryKey: [
      "table-data",
      connectionId,
      tableName,
      schemaName,
      page,
      limit,
      sort,
      order,
      filtersKey, // Serialized filters for proper change detection
    ],
    queryFn: async () => {
      if (!connectionId || !password) {
        throw new Error("Not authenticated");
      }

      // Decrypt connection on client side
      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }

      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        schema: schemaName,
      });

      if (sort) {
        searchParams.set("sort", sort);
        searchParams.set("order", order);
      }

      const response = await fetch(
        `/api/tables/${tableName}?${searchParams.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            connectionString: connection.url,
            filters: activeFiltersForKey || [],
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch table data");
      }

      const result = await response.json();

      // Save filter query to history if filters are applied
      // Only save in browser environment (IndexedDB requires browser)
      if (typeof window !== 'undefined' && connectionId && activeFiltersForKey.length > 0) {
        // Use setTimeout to ensure this runs after the query completes
        setTimeout(async () => {
          try {
            const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
            const { whereClause, params: filterParams } = buildWhereClause(activeFiltersForKey as Filter[]);
            
            let queryString = `SELECT * FROM ${qualifiedTableName}`;
            if (whereClause) {
              queryString += ` ${whereClause}`;
            }
            if (sort) {
              const safeSortColumn = buildSafeColumnName(sort);
              queryString += ` ORDER BY ${safeSortColumn} ${order}`;
            }
            queryString += ` LIMIT ${limit} OFFSET ${calculateOffset(page, limit)}`;

            // Save to history
            await saveQueryToHistory(connectionId, queryString, filterParams.length > 0 ? filterParams : undefined);
            // Invalidate query history to refresh the list
            queryClient.invalidateQueries({ queryKey: ["query-history", connectionId] });
          } catch (error) {
            // Log error for debugging but don't break data fetching
            console.error("Failed to save filter query to history:", error);
          }
        }, 100);
      }

      return result;
    },
    enabled: !!connectionId && !!password && !!tableName,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

/**
 * Hook to fetch a single row by primary key
 * @param tableName - The name of the table
 * @param schemaName - The schema name
 * @param primaryKeyColumn - The primary key column name
 * @param primaryKeyValue - The primary key value to fetch
 * @returns Query result with row data and schema
 */
export function useTableRow(
  tableName: string,
  schemaName: string,
  primaryKeyColumn: string,
  primaryKeyValue: unknown
) {
  const { connectionId, password } = useAuthStore();

  return useQuery<{
    row: Record<string, unknown>;
    schema: Array<{
      columnName: string;
      dataType: string;
      isNullable: string;
      columnDefault: string | null;
    }>;
    tableName: string;
    schemaName: string;
  } | null>({
    queryKey: [
      "table-row",
      connectionId,
      tableName,
      schemaName,
      primaryKeyColumn,
      primaryKeyValue,
    ],
    queryFn: async () => {
      if (!connectionId || !password) {
        throw new Error("Not authenticated");
      }

      // Decrypt connection on client side
      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }

      const searchParams = new URLSearchParams({
        schema: schemaName,
        primaryKey: primaryKeyColumn,
        primaryKeyValue: String(primaryKeyValue),
      });

      const response = await fetch(
        `/api/tables/${tableName}/row?${searchParams.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            connectionString: connection.url,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch row");
      }

      return response.json();
    },
    enabled:
      !!connectionId &&
      !!password &&
      !!tableName &&
      !!primaryKeyColumn &&
      primaryKeyValue !== undefined &&
      primaryKeyValue !== null,
  });
}

/**
 * Hook to execute SQL queries (mutations) with automatic cache invalidation
 * @returns Mutation function for executing queries
 */
export function useExecuteQuery() {
  const { connectionId, password } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      query,
      params,
    }: {
      query: string;
      params?: unknown[];
    }) => {
      if (!connectionId || !password) {
        throw new Error("Not authenticated");
      }

      // Decrypt connection on client side
      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }

      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionString: connection.url,
          password, // Still send password for verification in mutation endpoint
          query,
          params,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to execute query");
      }

      return response.json();
    },
    onSuccess: async (_, variables) => {
      // Refresh tables in Zustand store if query might have modified tables
      // Check if query contains DDL operations (CREATE, DROP, ALTER TABLE)
      const isDDLOperation = /^\s*(CREATE|DROP|ALTER)\s+TABLE/i.test(variables.query);
      if (isDDLOperation && connectionId && password) {
        const connection = await getConnection(connectionId, password);
        if (connection) {
          const { refreshTables } = useSidebarStore.getState();
          await refreshTables(connectionId, password, connection.url);
        }
      }
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["table-data"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      
      // Save query to history (only if we have a connectionId)
      if (connectionId) {
        try {
          await saveQueryToHistory(connectionId, variables.query, variables.params);
          // Invalidate query history to refresh the list
          queryClient.invalidateQueries({ queryKey: ["query-history", connectionId] });
        } catch (error) {
          // Silently fail - history saving shouldn't break query execution
          console.warn("Failed to save query to history:", error);
        }
      }
    },
  });
}
