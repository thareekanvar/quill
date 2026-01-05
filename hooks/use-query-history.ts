import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  saveQueryToHistory,
  getQueryHistory,
  saveQuery,
  getSavedQueries,
  updateSavedQuery,
  deleteQuery,
  searchQueries,
  type SavedQuery,
} from "@/lib/db";

/**
 * Hook to manage query history
 */
export function useQueryHistory() {
  const { connectionId } = useAuthStore();
  const queryClient = useQueryClient();

  // Get query history
  const historyQuery = useQuery({
    queryKey: ["query-history", connectionId],
    queryFn: async () => {
      if (!connectionId) return [];
      return getQueryHistory(connectionId);
    },
    enabled: !!connectionId,
  });

  // Get saved queries
  const savedQueriesQuery = useQuery({
    queryKey: ["saved-queries", connectionId],
    queryFn: async () => {
      if (!connectionId) return [];
      return getSavedQueries(connectionId);
    },
    enabled: !!connectionId,
  });

  // Save query to history mutation
  const saveToHistoryMutation = useMutation({
    mutationFn: async ({
      query,
      params,
    }: {
      query: string;
      params?: unknown[];
    }) => {
      if (!connectionId) {
        throw new Error("No connection");
      }
      return saveQueryToHistory(connectionId, query, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["query-history", connectionId] });
    },
  });

  // Save query with name mutation
  const saveQueryMutation = useMutation({
    mutationFn: async ({
      name,
      query,
      params,
    }: {
      name: string;
      query: string;
      params?: unknown[];
    }) => {
      if (!connectionId) {
        throw new Error("No connection");
      }
      return saveQuery(connectionId, name, query, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-queries", connectionId] });
    },
  });

  // Update saved query mutation
  const updateQueryMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<SavedQuery, "name" | "query" | "params">>;
    }) => {
      return updateSavedQuery(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-queries", connectionId] });
      queryClient.invalidateQueries({ queryKey: ["query-history", connectionId] });
    },
  });

  // Delete query mutation
  const deleteQueryMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteQuery(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-queries", connectionId] });
      queryClient.invalidateQueries({ queryKey: ["query-history", connectionId] });
    },
  });

  // Search queries
  const searchQueriesMutation = useMutation({
    mutationFn: async (searchText: string) => {
      if (!connectionId) return [];
      return searchQueries(connectionId, searchText);
    },
  });

  return {
    history: historyQuery.data || [],
    savedQueries: savedQueriesQuery.data || [],
    isLoadingHistory: historyQuery.isLoading,
    isLoadingSaved: savedQueriesQuery.isLoading,
    saveToHistory: saveToHistoryMutation.mutateAsync,
    saveQuery: saveQueryMutation.mutateAsync,
    updateQuery: updateQueryMutation.mutateAsync,
    deleteQuery: deleteQueryMutation.mutateAsync,
    searchQueries: searchQueriesMutation.mutateAsync,
    isSaving: saveToHistoryMutation.isPending || saveQueryMutation.isPending,
    isUpdating: updateQueryMutation.isPending,
    isDeleting: deleteQueryMutation.isPending,
  };
}

