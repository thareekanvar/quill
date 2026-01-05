import { useMutation } from "@tanstack/react-query";
import { storeConnection } from "@/lib/db";

export interface AddConnectionData {
  url: string;
  name?: string;
  password: string;
}

/**
 * Hook to add a new database connection
 * Validates the connection and stores it in IndexedDB
 */
export function useAddConnection() {
  return useMutation({
    mutationFn: async (data: AddConnectionData) => {
      // First, validate the connection
      const response = await fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ connectionString: data.url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid connection");
      }

      // Store the connection
      const connectionId = await storeConnection(
        data.url,
        data.password,
        data.name
      );

      return connectionId;
    },
  });
}

