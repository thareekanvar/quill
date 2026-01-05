/**
 * Sidebar-related type definitions
 */

import type { Icon } from '@phosphor-icons/react';

export interface TablePreference {
  tableName: string;
  schemaName: string;
  visible: boolean;
  customName?: string;
  iconName?: string;
  order: number;
}

export interface SidebarPreferencesState {
  preferences: Record<string, TablePreference>;
  setTablePreference: (tableName: string, schemaName: string, preference: Partial<TablePreference>) => void;
  setTableVisible: (tableName: string, schemaName: string, visible: boolean) => void;
  setTableCustomName: (tableName: string, schemaName: string, customName: string) => void;
  setTableIcon: (tableName: string, schemaName: string, iconName: string) => void;
  setTableOrder: (tableName: string, schemaName: string, order: number) => void;
  reorderTables: (orderedKeys: string[]) => void;
  resetPreferences: () => void;
  getTablePreference: (tableName: string, schemaName: string) => TablePreference | undefined;
  initializePreferences: (tables: Array<{ tableName: string; schemaName: string }>) => void;
}

export interface SidebarState {
  tables: Array<{ tableName: string; schemaName: string }>;
  selectedTable: string | null;
  isLoading: boolean;
  connectionId: string | null;
  setTables: (tables: Array<{ tableName: string; schemaName: string }>) => void;
  setSelectedTable: (tableName: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  addTable: (table: { tableName: string; schemaName: string }) => void;
  removeTable: (tableName: string) => void;
  fetchTables: (connectionId: string, password: string, connectionString: string) => Promise<void>;
  refreshTables: (connectionId: string, password: string, connectionString: string) => Promise<void>;
  clearTables: () => void;
}

