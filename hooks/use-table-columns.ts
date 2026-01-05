import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getConnection } from "@/lib/db";
import type { TableColumn } from "@/types";

/**
 * Hook to fetch table columns/schema
 */
export function useTableColumns(
  tableName: string | undefined,
  schemaName: string = "public"
) {
  const { connectionId, password } = useAuthStore();

  return useQuery<{ columns: TableColumn[] }>({
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

