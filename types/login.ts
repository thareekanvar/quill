/**
 * Types and schemas for login form
 */

export interface LoginFormData {
  url: string;
  password: string;
  name?: string;
}

export interface ImportFormState {
  importedConnectionsCount: number;
  importPassword: string;
  isImporting: boolean;
  isConnecting: boolean;
  error: string | null;
  successMessage: string | null;
}

export interface ImportResult {
  success: boolean;
  imported: {
    sidebarPreferences: boolean;
    authState: boolean;
    tableSchemas: boolean;
    connections: number;
    dashboards: number;
    dashboardCards: number;
    dashboardCharts: number;
  };
  errors: string[];
}

export interface ImportedItems {
  connections: number;
  dashboards: number;
  dashboardCards: number;
  dashboardCharts: number;
}

