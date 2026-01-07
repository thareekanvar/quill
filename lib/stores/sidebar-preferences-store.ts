import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TablePreference, SidebarPreferencesState } from '@/types';
import { getTableKey } from '@/lib/helpers/table-helpers';
import { trackSettingsChange } from '@/lib/utils/settings-export';

// Re-export types for backward compatibility
export type { TablePreference } from '@/types';

export const useSidebarPreferencesStore = create<SidebarPreferencesState>()(
  persist(
    (set, get) => ({
      preferences: {},
      
      initializePreferences: (tables) => {
        const state = get();
        const newPreferences: Record<string, TablePreference> = { ...state.preferences };
        let maxOrder = Math.max(...Object.values(state.preferences).map(p => p.order), -1);
        let hasChanges = false;
        
        tables.forEach((table, index) => {
          const key = getTableKey(table.tableName, table.schemaName);
          if (!newPreferences[key]) {
            maxOrder++;
            newPreferences[key] = {
              tableName: table.tableName,
              schemaName: table.schemaName,
              visible: true,
              order: maxOrder,
            };
            hasChanges = true;
          }
        });
        
        // Only trigger auto-export if preferences actually changed
        if (hasChanges) {
          set({ preferences: newPreferences });
          if (typeof window !== 'undefined') {
            setTimeout(() => trackSettingsChange(), 100);
          }
        }
      },
      
      setTablePreference: (tableName, schemaName, preference) => {
        const key = getTableKey(tableName, schemaName);
        set((state) => {
          const newState = {
            preferences: {
              ...state.preferences,
              [key]: {
                ...state.preferences[key],
                tableName,
                schemaName,
                visible: state.preferences[key]?.visible ?? true,
                order: state.preferences[key]?.order ?? 0,
                ...preference,
              },
            },
          };
          // Track settings change (auto-save happens automatically via Zustand persist)
          if (typeof window !== 'undefined') {
            setTimeout(() => trackSettingsChange(), 100);
          }
          return newState;
        });
      },
      
      setTableVisible: (tableName, schemaName, visible) => {
        get().setTablePreference(tableName, schemaName, { visible });
      },
      
      setTableCustomName: (tableName, schemaName, customName) => {
        get().setTablePreference(tableName, schemaName, { customName: customName || undefined });
      },
      
      setTableIcon: (tableName, schemaName, iconName) => {
        get().setTablePreference(tableName, schemaName, { iconName: iconName || undefined });
      },
      
      setTableOrder: (tableName, schemaName, order) => {
        get().setTablePreference(tableName, schemaName, { order });
      },
      
      reorderTables: (orderedKeys) => {
        set((state) => {
          const newPreferences = { ...state.preferences };
          orderedKeys.forEach((key, index) => {
            if (newPreferences[key]) {
              newPreferences[key] = {
                ...newPreferences[key],
                order: index,
              };
            }
          });
          const newState = { preferences: newPreferences };
          // Track settings change (auto-save happens automatically via Zustand persist)
          if (typeof window !== 'undefined') {
            setTimeout(() => trackSettingsChange(), 100);
          }
          return newState;
        });
      },
      
      resetPreferences: () => {
        set({ preferences: {} });
        // Trigger auto-export after state update
        if (typeof window !== 'undefined') {
          setTimeout(() => trackSettingsChange(), 100);
        }
      },
      
      getTablePreference: (tableName, schemaName) => {
        const key = getTableKey(tableName, schemaName);
        return get().preferences[key];
      },
    }),
    {
      name: 'postadmin-sidebar-preferences',
    }
  )
);

