import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { getConnection } from "@/lib/db/index";

export interface ExecuteQueryWithTransactionParams {
  query: string;
  params?: unknown[];
  useTransaction?: boolean;
}

export interface TransactionResult {
  success: boolean;
  data?: Record<string, unknown>[];
  affectedRows?: number;
  transactionId?: string;
  message?: string;
}

/**
 * Hook to execute queries with optional transaction support
 */
export function useExecuteQueryWithTransaction() {
  const { connectionId, password } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation<TransactionResult, Error, ExecuteQueryWithTransactionParams>({
    mutationFn: async ({ query, params, useTransaction = false }) => {
      if (!connectionId || !password) {
        throw new Error("Not authenticated");
      }

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
          password,
          query,
          params,
          useTransaction,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to execute query");
      }

      return response.json();
    },
    onSuccess: async (result, variables) => {
      // Only refresh if transaction was committed (no transactionId in result)
      if (!result.transactionId && connectionId && password) {
        const connection = await getConnection(connectionId, password);
        if (connection) {
          const { refreshTables } = useSidebarStore.getState();
          await refreshTables(connectionId, password, connection.url);
        }
        queryClient.invalidateQueries({ queryKey: ["table-data"] });
        queryClient.invalidateQueries({ queryKey: ["tables"] });
      }
    },
  });
}

/**
 * Hook to commit a transaction
 */
export function useCommitTransaction() {
  const { connectionId, password } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: async (transactionId: string) => {
      if (!connectionId || !password) {
        throw new Error("Not authenticated");
      }

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
          password,
          query: "",
          transactionId,
          commitTransaction: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to commit transaction");
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
      queryClient.invalidateQueries({ queryKey: ["table-data"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

/**
 * Hook to rollback a transaction
 */
export function useRollbackTransaction() {
  const { connectionId, password } = useAuthStore();

  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: async (transactionId: string) => {
      if (!connectionId || !password) {
        throw new Error("Not authenticated");
      }

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
          password,
          query: "",
          transactionId,
          rollbackTransaction: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to rollback transaction");
      }

      return response.json();
    },
  });
}

