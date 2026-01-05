import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useDashboardStore } from "@/lib/stores/dashboard-store";
import { getConnection } from "@/lib/db";
import {
  getDashboardCharts,
  createDashboardChart,
  updateDashboardChart,
  deleteDashboardChart,
  reorderDashboardCharts,
  type DashboardChart,
} from "@/lib/db";
import { trackSettingsChange } from "@/lib/utils/settings-export";

/**
 * Hook to fetch all dashboard charts
 */
export function useDashboardCharts() {
  const { dashboardId } = useDashboardStore();

  return useQuery<{ charts: DashboardChart[] }>({
    queryKey: ["dashboard-charts", dashboardId],
    queryFn: async () => {
      if (!dashboardId) {
        return { charts: [] };
      }
      const charts = await getDashboardCharts(dashboardId);
      return { charts };
    },
    enabled: !!dashboardId,
  });
}

/**
 * Hook to execute queries for dashboard charts
 */
export function useExecuteChartQueries() {
  const { connectionId, password } = useAuthStore();
  const { dashboardId } = useDashboardStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chartIds,
      dateRange,
    }: {
      chartIds?: string[];
      dateRange?: { from?: string; to?: string };
    } = {}) => {
      if (!connectionId || !password || !dashboardId) {
        throw new Error("Not authenticated");
      }

      const connection = await getConnection(connectionId, password);
      if (!connection) {
        throw new Error("Invalid connection or password");
      }

      // Get charts from IndexedDB
      const allCharts = await getDashboardCharts(dashboardId);
      const charts = chartIds
        ? allCharts.filter((c) => chartIds.includes(c.id))
        : allCharts;

      const response = await fetch("/api/dashboard-charts/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionString: connection.url,
          charts,
          dateRange,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to execute chart queries");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-charts"] });
    },
  });
}

/**
 * Hook to create a dashboard chart
 */
export function useCreateDashboardChart() {
  const { connectionId } = useAuthStore();
  const { dashboardId } = useDashboardStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      chart: Omit<
        DashboardChart,
        | "id"
        | "createdAt"
        | "updatedAt"
        | "order"
        | "connectionId"
        | "dashboardId"
      > & { order?: number }
    ) => {
      if (!connectionId || !dashboardId) {
        throw new Error("No active connection or dashboard");
      }

      // Get current max order
      const existingCharts = await getDashboardCharts(dashboardId);
      const maxOrder =
        existingCharts.length > 0
          ? Math.max(...existingCharts.map((c) => c.order))
          : -1;

      const chartId = await createDashboardChart({
        ...chart,
        connectionId,
        dashboardId,
        order: chart.order ?? maxOrder + 1,
      });

      return { id: chartId, success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard-charts", dashboardId],
      });
      trackSettingsChange();
    },
  });
}

/**
 * Hook to update a dashboard chart
 */
export function useUpdateDashboardChart() {
  const { dashboardId } = useDashboardStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<DashboardChart>;
    }) => {
      await updateDashboardChart(id, updates);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard-charts", dashboardId],
      });
      trackSettingsChange();
    },
  });
}

/**
 * Hook to delete a dashboard chart
 */
export function useDeleteDashboardChart() {
  const { dashboardId } = useDashboardStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDashboardChart(id);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard-charts", dashboardId],
      });
      trackSettingsChange();
    },
  });
}

/**
 * Hook to reorder dashboard charts
 */
export function useReorderDashboardCharts() {
  const { dashboardId } = useDashboardStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chartIds: string[]) => {
      await reorderDashboardCharts(chartIds);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard-charts", dashboardId],
      });
      trackSettingsChange();
    },
  });
}
