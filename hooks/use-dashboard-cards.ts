import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useDashboardStore } from "@/lib/stores/dashboard-store";
import { getConnection } from "@/lib/db";
import {
  getDashboardCards,
  createDashboardCard,
  updateDashboardCard,
  deleteDashboardCard,
  reorderDashboardCards,
  type DashboardCard,
} from "@/lib/db";
import { trackSettingsChange } from "@/lib/utils/settings-export";

/**
 * Hook to fetch all dashboard cards
 */
export function useDashboardCards() {
  const { dashboardId } = useDashboardStore();
  
  return useQuery<{ cards: DashboardCard[] }>({
    queryKey: ["dashboard-cards", dashboardId],
    queryFn: async () => {
      if (!dashboardId) {
        return { cards: [] };
      }
      const cards = await getDashboardCards(dashboardId);
      return { cards };
    },
    enabled: !!dashboardId,
  });
}

/**
 * Hook to execute queries for dashboard cards
 */
export function useExecuteCardQueries() {
  const { connectionId, password } = useAuthStore();
  const { dashboardId } = useDashboardStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardIds,
      dateRange,
    }: {
      cardIds?: string[];
      dateRange?: { from?: string; to?: string };
    } = {}) => {
      if (!connectionId || !password || !dashboardId) {
        throw new Error("Not authenticated");
      }

      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }

      // Get cards from IndexedDB
      const allCards = await getDashboardCards(dashboardId);
      const cards = cardIds
        ? allCards.filter(c => cardIds.includes(c.id))
        : allCards;

      const response = await fetch("/api/dashboard-cards/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionString: connection.url,
          cards,
          dateRange,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to execute card queries");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-cards"] });
    },
  });
}

/**
 * Hook to create a dashboard card
 */
export function useCreateDashboardCard() {
  const { connectionId } = useAuthStore();
  const { dashboardId } = useDashboardStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (card: Omit<DashboardCard, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'connectionId' | 'dashboardId'> & { order?: number }) => {
      if (!connectionId || !dashboardId) {
        throw new Error("No active connection or dashboard");
      }
      
      // Get current max order
      const existingCards = await getDashboardCards(dashboardId);
      const maxOrder = existingCards.length > 0
        ? Math.max(...existingCards.map(c => c.order))
        : -1;

      const cardId = await createDashboardCard({
        ...card,
        connectionId,
        dashboardId,
        order: card.order ?? maxOrder + 1,
      });

      return { id: cardId, success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-cards", dashboardId] });
      trackSettingsChange();
    },
  });
}

/**
 * Hook to update a dashboard card
 */
export function useUpdateDashboardCard() {
  const { dashboardId } = useDashboardStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DashboardCard> }) => {
      await updateDashboardCard(id, updates);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-cards", dashboardId] });
      trackSettingsChange();
    },
  });
}

/**
 * Hook to delete a dashboard card
 */
export function useDeleteDashboardCard() {
  const { dashboardId } = useDashboardStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDashboardCard(id);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-cards", dashboardId] });
      trackSettingsChange();
    },
  });
}

/**
 * Hook to reorder dashboard cards
 */
export function useReorderDashboardCards() {
  const { dashboardId } = useDashboardStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardIds: string[]) => {
      await reorderDashboardCards(cardIds);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-cards", dashboardId] });
      trackSettingsChange();
    },
  });
}

