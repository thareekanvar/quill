import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TableColumn } from '@/types';
import { getTableKey } from '@/lib/helpers/table-helpers';
import { trackSettingsChange } from '@/lib/utils/settings-export';

interface TableSchemaState {
  schemas: Record<string, TableColumn[]>;
  
  setSchema: (tableName: string, schemaName: string, schema: TableColumn[]) => void;
  getSchema: (tableName: string, schemaName: string) => TableColumn[] | undefined;
  clearSchema: (tableName: string, schemaName: string) => void;
  clearAllSchemas: () => void;
}

export const useTableSchemaStore = create<TableSchemaState>()(
  persist(
    (set, get) => ({
      schemas: {},
      
      setSchema: (tableName, schemaName, schema) => {
        const key = getTableKey(tableName, schemaName);
        set((state) => {
          const newState = {
            schemas: {
              ...state.schemas,
              [key]: schema,
            },
          };
          // Track settings change (auto-save happens automatically via Zustand persist)
          if (typeof window !== 'undefined') {
            setTimeout(() => trackSettingsChange(), 100);
          }
          return newState;
        });
      },
      
      getSchema: (tableName, schemaName) => {
        const key = getTableKey(tableName, schemaName);
        return get().schemas[key];
      },
      
      clearSchema: (tableName, schemaName) => {
        const key = getTableKey(tableName, schemaName);
        set((state) => {
          const newSchemas = { ...state.schemas };
          delete newSchemas[key];
          const newState = { schemas: newSchemas };
          // Track settings change (auto-save happens automatically via Zustand persist)
          if (typeof window !== 'undefined') {
            setTimeout(() => trackSettingsChange(), 100);
          }
          return newState;
        });
      },
      
      clearAllSchemas: () => {
        set({ schemas: {} });
        // Trigger auto-export after state update
        if (typeof window !== 'undefined') {
          setTimeout(() => trackSettingsChange(), 100);
        }
      },
    }),
    {
      name: 'postadmin-table-schemas',
    }
  )
);

