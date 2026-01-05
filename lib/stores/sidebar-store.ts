import { create } from 'zustand';
import type { TableInfo, SidebarState } from '@/types';
import { getConnection } from '@/lib/db';

// Re-export types for backward compatibility
export type { TableInfo } from '@/types';

export const useSidebarStore = create<SidebarState>((set, get) => ({
  tables: [],
  selectedTable: null,
  isLoading: false,
  connectionId: null,
  setTables: (tables: TableInfo[]) => set({ tables }),
  setSelectedTable: (tableName: string | null) => set({ selectedTable: tableName }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  addTable: (table: TableInfo) =>
    set((state) => {
      if (state.tables.some((t) => t.tableName === table.tableName && t.schemaName === table.schemaName)) {
        return state;
      }
      return { tables: [...state.tables, table] };
    }),
  removeTable: (tableName: string) =>
    set((state) => ({
      tables: state.tables.filter((t) => t.tableName !== tableName),
      selectedTable: state.selectedTable === tableName ? null : state.selectedTable,
    })),
  fetchTables: async (connectionId: string, password: string, connectionString: string) => {
    const state = get();
    // If tables already exist for this connection, don't fetch again
    if (state.connectionId === connectionId && state.tables.length > 0) {
      return;
    }

    set({ isLoading: true, connectionId });
    try {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionString,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch tables");
      }

      const data = await response.json();
      set({ tables: data.tables || [], isLoading: false, connectionId });
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      set({ isLoading: false });
      throw error;
    }
  },
  refreshTables: async (connectionId: string, password: string, connectionString: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionString,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch tables");
      }

      const data = await response.json();
      set({ tables: data.tables || [], isLoading: false, connectionId });
    } catch (error) {
      console.error("Failed to refresh tables:", error);
      set({ isLoading: false });
      throw error;
    }
  },
  clearTables: () => set({ tables: [], connectionId: null, selectedTable: null }),
}));

