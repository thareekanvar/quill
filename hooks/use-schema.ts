import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { getConnection } from "@/lib/db";
import type {
  CreateTableParams,
  AddColumnParams,
  ModifyColumnParams,
  DeleteColumnParams,
  CreateIndexParams,
  DeleteIndexParams,
  CreateForeignKeyParams,
  DeleteForeignKeyParams,
} from "@/lib/helpers/schema-helpers";

/**
 * Hook to create a new table
 */
export function useCreateTable() {
  const { connectionId, password } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      password,
      ...params
    }: CreateTableParams & { password: string }) => {
      if (!connectionId || !password) {
        throw new Error("Not authenticated");
      }

      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }

      const response = await fetch("/api/schema", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionString: connection.url,
          ...params,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create table");
      }

      return response.json();
    },
    onSuccess: async () => {
      // Refresh tables in Zustand store
      if (connectionId && password) {
        const connection = await getConnection(connectionId, password);
        if (connection) {
          const { refreshTables } = useSidebarStore.getState();
          await refreshTables(connectionId, password, connection.url);
        }
      }
      // Also invalidate React Query cache for backward compatibility
      queryClient.invalidateQueries({ queryKey: ["tables", connectionId] });
    },
  });
}

/**
 * Hook to get table columns
 */
export function useTableColumnsForSchema(
  tableName: string | undefined,
  schemaName: string = "public"
) {
  const { connectionId, password } = useAuthStore();

  return useQuery({
    queryKey: ["table-columns", connectionId, schemaName, tableName],
    queryFn: async () => {
      if (!connectionId || !password || !tableName) {
        throw new Error("Not authenticated or table not selected");
      }

      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }

      const response = await fetch(
        `/api/tables/${tableName}/columns?schema=${schemaName}`,
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
        throw new Error(error.error || "Failed to fetch table columns");
      }

      return response.json();
    },
    enabled: !!connectionId && !!password && !!tableName,
  });
}

/**
 * Hook to add a column to a table
 */
export function useAddColumn() {
  const { connectionId } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      password,
      ...params
    }: AddColumnParams & { password: string }) => {
      if (!connectionId || !password) {
        throw new Error("Not authenticated");
      }

      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }

      const response = await fetch("/api/schema/columns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionString: connection.url,
          ...params,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add column");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate table columns and table data
      queryClient.invalidateQueries({
        queryKey: ["table-columns", connectionId, variables.schemaName, variables.tableName],
      });
      queryClient.invalidateQueries({
        queryKey: ["table-data"],
      });
    },
  });
}

/**
 * Hook to modify a column
 */
export function useModifyColumn() {
  const { connectionId } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      password,
      ...params
    }: ModifyColumnParams & { password: string }) => {
      if (!connectionId || !password) {
        throw new Error("Not authenticated");
      }

      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }

      const response = await fetch("/api/schema/columns", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionString: connection.url,
          ...params,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to modify column");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate table columns and table data
      queryClient.invalidateQueries({
        queryKey: ["table-columns", connectionId, variables.schemaName, variables.tableName],
      });
      queryClient.invalidateQueries({
        queryKey: ["table-data"],
      });
    },
  });
}

/**
 * Hook to delete a column
 */
export function useDeleteColumn() {
  const { connectionId } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      password,
      ...params
    }: DeleteColumnParams & { password: string }) => {
      if (!connectionId || !password) {
        throw new Error("Not authenticated");
      }

      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }

      const response = await fetch("/api/schema/columns", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionString: connection.url,
          ...params,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete column");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate table columns and table data
      queryClient.invalidateQueries({
        queryKey: ["table-columns", connectionId, variables.schemaName, variables.tableName],
      });
      queryClient.invalidateQueries({
        queryKey: ["table-data"],
      });
    },
  });
}

/**
 * Hook to get indexes for a table
 */
export function useTableIndexes(
  tableName: string | undefined,
  schemaName: string = "public"
) {
  const { connectionId, password } = useAuthStore();

  return useQuery({
    queryKey: ["indexes", connectionId, schemaName, tableName],
    queryFn: async () => {
      if (!connectionId || !password || !tableName) {
        throw new Error("Not authenticated or table not selected");
      }

      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }

      const response = await fetch("/api/schema/indexes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionString: connection.url,
          schemaName,
          tableName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch indexes");
      }

      return response.json();
    },
    enabled: !!connectionId && !!password && !!tableName,
  });
}

/**
 * Hook to create an index
 */
export function useCreateIndex() {
  const { connectionId } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      password,
      ...params
    }: CreateIndexParams & { password: string }) => {
      if (!connectionId || !password) {
        throw new Error("Not authenticated");
      }

      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }

      const response = await fetch("/api/schema/indexes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionString: connection.url,
          ...params,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create index");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate indexes
      queryClient.invalidateQueries({
        queryKey: ["indexes", connectionId, variables.schemaName, variables.tableName],
      });
    },
  });
}

/**
 * Hook to delete an index
 */
export function useDeleteIndex() {
  const { connectionId } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      password,
      ...params
    }: DeleteIndexParams & { password: string }) => {
      if (!connectionId || !password) {
        throw new Error("Not authenticated");
      }

      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }

      const response = await fetch("/api/schema/indexes/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionString: connection.url,
          ...params,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete index");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate indexes - we need to find which table this index belongs to
      queryClient.invalidateQueries({
        queryKey: ["indexes", connectionId],
      });
    },
  });
}

/**
 * Hook to get foreign keys for a table
 */
export function useTableForeignKeys(
  tableName: string | undefined,
  schemaName: string = "public"
) {
  const { connectionId, password } = useAuthStore();

  return useQuery({
    queryKey: ["foreign-keys", connectionId, schemaName, tableName],
    queryFn: async () => {
      if (!connectionId || !password || !tableName) {
        throw new Error("Not authenticated or table not selected");
      }

      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }

      const response = await fetch("/api/schema/foreign-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionString: connection.url,
          schemaName,
          tableName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch foreign keys");
      }

      return response.json();
    },
    enabled: !!connectionId && !!password && !!tableName,
  });
}

/**
 * Hook to create a foreign key
 */
export function useCreateForeignKey() {
  const { connectionId } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      password,
      ...params
    }: CreateForeignKeyParams & { password: string }) => {
      if (!connectionId || !password) {
        throw new Error("Not authenticated");
      }

      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }

      const response = await fetch("/api/schema/foreign-keys/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionString: connection.url,
          ...params,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create foreign key");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate foreign keys
      queryClient.invalidateQueries({
        queryKey: ["foreign-keys", connectionId, variables.schemaName, variables.tableName],
      });
    },
  });
}

/**
 * Hook to delete a foreign key
 */
export function useDeleteForeignKey() {
  const { connectionId } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      password,
      ...params
    }: DeleteForeignKeyParams & { password: string }) => {
      if (!connectionId || !password) {
        throw new Error("Not authenticated");
      }

      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }

      const response = await fetch("/api/schema/foreign-keys/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionString: connection.url,
          ...params,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete foreign key");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate foreign keys - we need to find which table this FK belongs to
      queryClient.invalidateQueries({
        queryKey: ["foreign-keys", connectionId, variables.schemaName],
      });
    },
  });
}

