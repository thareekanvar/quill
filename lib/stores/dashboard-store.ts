import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getOrCreateDefaultDashboard, getDashboards, type Dashboard } from '@/lib/db';
import { useAuthStore } from './auth-store';

interface DashboardState {
  dashboardId: string | null;
  dashboards: Dashboard[];
  isLoading: boolean;
  
  setDashboardId: (dashboardId: string | null) => void;
  loadDashboards: (connectionId: string) => Promise<void>;
  initializeDashboard: (connectionId: string) => Promise<void>;
  refreshDashboards: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      dashboardId: null,
      dashboards: [],
      isLoading: false,
      
      setDashboardId: (dashboardId: string | null) => {
        set({ dashboardId });
      },
      
      loadDashboards: async (connectionId: string) => {
        set({ isLoading: true });
        try {
          const dashboards = await getDashboards(connectionId);
          set({ dashboards, isLoading: false });
          
          // If no dashboard is selected, select the first one (or create default)
          if (!get().dashboardId && dashboards.length > 0) {
            set({ dashboardId: dashboards[0].id });
          } else if (dashboards.length === 0) {
            // Create default dashboard if none exist
            const defaultId = await getOrCreateDefaultDashboard(connectionId);
            const updatedDashboards = await getDashboards(connectionId);
            set({ dashboards: updatedDashboards, dashboardId: defaultId });
          }
        } catch (error) {
          console.error('Failed to load dashboards:', error);
          set({ isLoading: false });
        }
      },
      
      initializeDashboard: async (connectionId: string) => {
        const state = get();
        if (state.dashboardId) {
          // Verify dashboard still exists
          const dashboards = await getDashboards(connectionId);
          const exists = dashboards.some(d => d.id === state.dashboardId);
          if (!exists && dashboards.length > 0) {
            set({ dashboardId: dashboards[0].id, dashboards });
          } else if (!exists) {
            // Create default dashboard
            const defaultId = await getOrCreateDefaultDashboard(connectionId);
            const updatedDashboards = await getDashboards(connectionId);
            set({ dashboardId: defaultId, dashboards: updatedDashboards });
          } else {
            set({ dashboards });
          }
        } else {
          // Load dashboards and select default
          await get().loadDashboards(connectionId);
        }
      },
      
      refreshDashboards: async () => {
        const { connectionId } = useAuthStore.getState();
        if (connectionId) {
          await get().loadDashboards(connectionId);
        }
      },
    }),
    {
      name: 'postadmin-dashboard',
      partialize: (state) => ({
        dashboardId: state.dashboardId,
      }),
    }
  )
);

