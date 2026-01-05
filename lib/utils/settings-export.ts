/**
 * Settings Export/Import Utility
 * 
 * Allows users to export and import their application settings
 * for backup or migration between browsers/devices.
 */

import { getDB, type Dashboard, type DashboardCard, type DashboardChart, getAllConnections } from '@/lib/db';
import type { PostgresConnection } from '@/types/database';

export interface ExportedSettings {
  version: string;
  exportedAt: number;
  sidebarPreferences: Record<string, any>;
  tableSchemas: Record<string, any>;
  connections: PostgresConnection[]; // All connections with encrypted data
  dashboards: Dashboard[];
  dashboardCards: DashboardCard[];
  dashboardCharts: DashboardChart[];
}

const SETTINGS_VERSION = '1.0.0';
const STORAGE_KEYS = {
  SIDEBAR_PREFERENCES: 'postadmin-sidebar-preferences',
  TABLE_SCHEMAS: 'postadmin-table-schemas',
  AUTO_EXPORT: 'postadmin-auto-export',
  LAST_DOWNLOAD: 'postadmin-last-download',
  LAST_CHANGE: 'postadmin-last-change',
  LAST_DOWNLOAD_HASH: 'postadmin-last-download-hash',
} as const;

// Debounce helper for auto-export
let autoExportTimeout: NodeJS.Timeout | null = null;
const AUTO_EXPORT_DELAY = 2000; // 2 seconds delay

/**
 * Export all application settings to a JSON file
 */
export async function exportSettings(): Promise<ExportedSettings> {
  if (typeof window === 'undefined') {
    throw new Error('Export can only be performed in browser environment');
  }

  // Get sidebar preferences from localStorage
  // Zustand persist stores as { state: {...}, version: 0 } or just the state
  const sidebarPreferencesRaw = getFromLocalStorage(STORAGE_KEYS.SIDEBAR_PREFERENCES) || {};
  const sidebarPreferences = sidebarPreferencesRaw.state || sidebarPreferencesRaw;

  // Get table schemas
  const tableSchemasRaw = getFromLocalStorage(STORAGE_KEYS.TABLE_SCHEMAS) || {};
  const tableSchemas = tableSchemasRaw.state || tableSchemasRaw;

  // Get dashboards, cards and charts from IndexedDB
  const db = await getDB();
  const dashboards = await db.getAll('dashboards');
  const dashboardCards = await db.getAll('dashboardCards');
  const dashboardCharts = await db.getAll('dashboardCharts');

  // Get all connections (with encrypted data)
  const connections = await db.getAll('connections');

  const exported: ExportedSettings = {
    version: SETTINGS_VERSION,
    exportedAt: Date.now(),
    sidebarPreferences,
    tableSchemas,
    connections: connections.sort((a, b) => b.createdAt - a.createdAt), // Most recent first
    dashboards: dashboards.sort((a, b) => b.createdAt - a.createdAt), // Most recent first
    dashboardCards: dashboardCards.sort((a, b) => a.order - b.order),
    dashboardCharts: dashboardCharts.sort((a, b) => a.order - b.order),
  };

  return exported;
}

/**
 * Download settings as a JSON file
 */
export async function downloadSettings(): Promise<void> {
  const settings = await exportSettings();
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `postadmin-settings-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // Track last download timestamp and hash
  if (typeof window !== 'undefined') {
    const hash = generateSettingsHash(settings);
    localStorage.setItem(STORAGE_KEYS.LAST_DOWNLOAD, Date.now().toString());
    localStorage.setItem(STORAGE_KEYS.LAST_DOWNLOAD_HASH, hash);
    // Dispatch event to notify banner of download
    window.dispatchEvent(new CustomEvent('settings-downloaded'));
  }
}

/**
 * Import settings from a JSON file
 */
export async function importSettings(
  file: File,
  options: {
    importSidebarPreferences?: boolean;
    importAuthState?: boolean;
    importTableSchemas?: boolean;
    importDashboardCards?: boolean;
    importDashboardCharts?: boolean;
  } = {}
): Promise<{
  success: boolean;
  errors: string[];
  imported: {
    sidebarPreferences: boolean;
    authState: boolean;
    tableSchemas: boolean;
    connections: number;
    dashboardCards: number;
    dashboardCharts: number;
  };
}> {
  if (typeof window === 'undefined') {
    throw new Error('Import can only be performed in browser environment');
  }

  const {
    importSidebarPreferences = true,
    importTableSchemas = true,
    importDashboardCards = true,
    importDashboardCharts = true,
  } = options;

  const errors: string[] = [];
  const imported = {
    sidebarPreferences: false,
    tableSchemas: false,
    connections: 0,
    dashboards: 0,
    dashboardCards: 0,
    dashboardCharts: 0,
  };

  try {
    const text = await file.text();
    const settings: ExportedSettings = JSON.parse(text);

    // Validate version (for future compatibility)
    if (settings.version !== SETTINGS_VERSION) {
      console.warn(`Settings version mismatch: ${settings.version} vs ${SETTINGS_VERSION}`);
    }

    // Import sidebar preferences
    if (importSidebarPreferences && settings.sidebarPreferences) {
      try {
        const existing = getFromLocalStorage(STORAGE_KEYS.SIDEBAR_PREFERENCES) || {};
        // Zustand persist format: { state: {...}, version: 0 }
        const merged = {
          ...existing,
          state: {
            ...(existing.state || existing),
            ...settings.sidebarPreferences,
          },
          version: existing.version ?? 0,
        };
        localStorage.setItem(STORAGE_KEYS.SIDEBAR_PREFERENCES, JSON.stringify(merged));
        imported.sidebarPreferences = true;
      } catch (error) {
        errors.push(`Failed to import sidebar preferences: ${error}`);
      }
    }

    // Import table schemas
    if (importTableSchemas && settings.tableSchemas) {
      try {
        const existing = getFromLocalStorage(STORAGE_KEYS.TABLE_SCHEMAS) || {};
        const merged = {
          ...existing,
          state: {
            ...(existing.state || existing),
            ...settings.tableSchemas,
          },
          version: existing.version ?? 0,
        };
        localStorage.setItem(STORAGE_KEYS.TABLE_SCHEMAS, JSON.stringify(merged));
        imported.tableSchemas = true;
      } catch (error) {
        errors.push(`Failed to import table schemas: ${error}`);
      }
    }

    // Import connections (must be done before dashboards, cards and charts)
    // Backward compatibility: older backups might not have connections array
    if (settings.connections && Array.isArray(settings.connections)) {
      try {
        const db = await getDB();
        for (const connection of settings.connections) {
          try {
            // Check if connection already exists (by ID)
            const existing = await db.get('connections', connection.id);
            if (!existing) {
              // Only import if it doesn't exist
              await db.put('connections', connection);
              imported.connections++;
            } else {
              // Update existing connection (allows overwriting)
              await db.put('connections', connection);
              imported.connections++;
            }
          } catch (error) {
            errors.push(`Failed to import connection ${connection.id || 'unknown'}: ${error}`);
          }
        }
      } catch (error) {
        errors.push(`Failed to import connections: ${error}`);
      }
    }

    // Import dashboards (must be done before cards and charts)
    // Backward compatibility: older backups might not have dashboards array
    if (settings.dashboards && Array.isArray(settings.dashboards)) {
      try {
        const db = await getDB();
        for (const dashboard of settings.dashboards) {
          try {
            await db.put('dashboards', dashboard);
            imported.dashboards++;
          } catch (error) {
            errors.push(`Failed to import dashboard ${dashboard.id || 'unknown'}: ${error}`);
          }
        }
      } catch (error) {
        errors.push(`Failed to import dashboards: ${error}`);
      }
    } else {
      // If no dashboards in backup, create default dashboards for connections that have cards/charts
      try {
        const db = await getDB();
        const { getOrCreateDefaultDashboard } = await import('@/lib/db');
        const connections = await db.getAll('connections');
        const cards = await db.getAll('dashboardCards');
        const charts = await db.getAll('dashboardCharts');
        
        // Group cards and charts by connectionId
        const connectionIds = new Set<string>();
        for (const card of cards) {
          if (card.connectionId) connectionIds.add(card.connectionId);
        }
        for (const chart of charts) {
          if (chart.connectionId) connectionIds.add(chart.connectionId);
        }
        
        // Create default dashboards for each connection
        for (const connectionId of connectionIds) {
          await getOrCreateDefaultDashboard(connectionId);
          imported.dashboards++;
        }
      } catch (error) {
        errors.push(`Failed to create default dashboards: ${error}`);
      }
    }

    // Import dashboard cards
    if (importDashboardCards && settings.dashboardCards) {
      try {
        const db = await getDB();
        for (const card of settings.dashboardCards) {
          try {
            await db.put('dashboardCards', card);
            imported.dashboardCards++;
          } catch (error) {
            errors.push(`Failed to import card ${card.id}: ${error}`);
          }
        }
      } catch (error) {
        errors.push(`Failed to import dashboard cards: ${error}`);
      }
    }

    // Import dashboard charts
    if (importDashboardCharts && settings.dashboardCharts) {
      try {
        const db = await getDB();
        for (const chart of settings.dashboardCharts) {
          try {
            await db.put('dashboardCharts', chart);
            imported.dashboardCharts++;
          } catch (error) {
            errors.push(`Failed to import chart ${chart.id}: ${error}`);
          }
        }
      } catch (error) {
        errors.push(`Failed to import dashboard charts: ${error}`);
      }
    }

    // Update last download timestamp and hash after successful import
    // (treating import as equivalent to download for tracking purposes)
    if (errors.length === 0 && typeof window !== 'undefined') {
      try {
        const importedSettings = await exportSettings();
        const hash = generateSettingsHash(importedSettings);
        localStorage.setItem(STORAGE_KEYS.LAST_DOWNLOAD, Date.now().toString());
        localStorage.setItem(STORAGE_KEYS.LAST_DOWNLOAD_HASH, hash);
        // Dispatch event to notify banner of import
        window.dispatchEvent(new CustomEvent('settings-downloaded'));
      } catch (error) {
        // If export fails, just update timestamp
        localStorage.setItem(STORAGE_KEYS.LAST_DOWNLOAD, Date.now().toString());
        window.dispatchEvent(new CustomEvent('settings-downloaded'));
      }
    }

    return {
      success: errors.length === 0,
      errors,
      imported,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to parse settings file: ${error}`],
      imported,
    };
  }
}

/**
 * Track when settings are auto-saved (changed)
 * This function is debounced to avoid excessive tracking
 * Settings are auto-saved by Zustand persist and IndexedDB automatically
 */
export function trackSettingsChange(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Clear existing timeout
  if (autoExportTimeout) {
    clearTimeout(autoExportTimeout);
  }

  // Set new timeout for debounced tracking
  autoExportTimeout = setTimeout(() => {
    try {
      // Just track the timestamp when settings change
      // Settings are already auto-saved by Zustand persist and IndexedDB
      localStorage.setItem(STORAGE_KEYS.LAST_CHANGE, Date.now().toString());
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.warn('Failed to track settings change:', error);
    }
  }, AUTO_EXPORT_DELAY);
}

// Removed getAutoExportedSettings - we don't auto-export anymore, just auto-save

/**
 * Get the last download timestamp
 */
export function getLastDownloadTimestamp(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_DOWNLOAD);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Get the last change timestamp
 */
export function getLastChangeTimestamp(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_CHANGE);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Check if settings have changed since last download
 * This compares the actual data hash, not just timestamps, to catch ALL changes
 * from Zustand (localStorage) and IndexedDB
 */
export async function hasSettingsChangedSinceDownload(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Get the hash of the last downloaded settings
    const lastDownloadHash = localStorage.getItem(STORAGE_KEYS.LAST_DOWNLOAD_HASH);
    
    // If no download has ever happened, check if there are any settings
    if (!lastDownloadHash) {
      const currentSettings = await exportSettings();
      const hasAnySettings = 
        Object.keys(currentSettings.sidebarPreferences || {}).length > 0 ||
        Object.keys(currentSettings.tableSchemas || {}).length > 0 ||
        (currentSettings.connections?.length || 0) > 0 ||
        (currentSettings.dashboards?.length || 0) > 0 ||
        (currentSettings.dashboardCards?.length || 0) > 0 ||
        (currentSettings.dashboardCharts?.length || 0) > 0;
      return hasAnySettings;
    }

    // Get current settings and compare hash
    const currentSettings = await exportSettings();
    const currentHash = generateSettingsHash(currentSettings);
    
    // If hashes don't match, settings have changed
    return currentHash !== lastDownloadHash;
  } catch (error) {
    console.warn('Error checking settings changes:', error);
    // Fallback to timestamp-based check
    const lastDownload = getLastDownloadTimestamp();
    const lastChange = getLastChangeTimestamp();
    
    if (!lastDownload && lastChange) {
      return true;
    }
    
    if (!lastChange) {
      return false;
    }
    
    return lastChange > lastDownload;
  }
}

/**
 * Generate a simple hash from settings data for comparison
 */
function generateSettingsHash(settings: ExportedSettings): string {
  // Create a deterministic string representation
  const normalized = JSON.stringify({
    sidebarPreferences: settings.sidebarPreferences,
    tableSchemas: settings.tableSchemas,
    connections: settings.connections?.map(c => ({ id: c.id, name: c.name, createdAt: c.createdAt })) || [],
    dashboards: settings.dashboards?.map(d => ({ id: d.id, name: d.name, connectionId: d.connectionId, createdAt: d.createdAt })) || [],
    dashboardCards: settings.dashboardCards.map(c => ({ id: c.id, order: c.order, updatedAt: c.updatedAt })),
    dashboardCharts: settings.dashboardCharts.map(c => ({ id: c.id, order: c.order, updatedAt: c.updatedAt })),
  });
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Helper to get data from localStorage with error handling
 */
function getFromLocalStorage(key: string): any {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

