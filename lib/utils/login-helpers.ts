/**
 * Helper functions for login form
 */

import { importSettings } from "@/lib/utils/settings-export";
import { getAllConnections, verifyPassword } from "@/lib/db";
import type { ImportResult, ImportedItems } from "@/types/login";

/**
 * Format imported items into a readable message
 */
export function formatImportedItems(imported: ImportedItems): string[] {
  const items: string[] = [];
  
  if (imported.connections > 0) {
    items.push(
      `${imported.connections} ${
        imported.connections === 1 ? "connection" : "connections"
      }`
    );
  }
  
  if (imported.dashboards > 0) {
    items.push(
      `${imported.dashboards} dashboard${
        imported.dashboards === 1 ? "" : "s"
      }`
    );
  }
  
  if (imported.dashboardCards > 0) {
    items.push(
      `${imported.dashboardCards} dashboard card${
        imported.dashboardCards === 1 ? "" : "s"
      }`
    );
  }
  
  if (imported.dashboardCharts > 0) {
    items.push(
      `${imported.dashboardCharts} dashboard chart${
        imported.dashboardCharts === 1 ? "" : "s"
      }`
    );
  }
  
  return items;
}

/**
 * Handle importing settings from a file
 */
export async function handleImportFile(
  file: File
): Promise<ImportResult> {
  const result = await importSettings(file, {
    importSidebarPreferences: true,
    importTableSchemas: true,
    importDashboardCards: true,
    importDashboardCharts: true,
  });

  return result;
}

/**
 * Handle connecting after import
 * Verifies password and returns connection ID if valid
 */
export async function handleConnectAfterImport(
  password: string,
  importedConnectionsCount: number
): Promise<{
  success: boolean;
  connectionId?: string;
  error?: string;
}> {
  if (!password.trim()) {
    return {
      success: false,
      error: "Password is required to connect.",
    };
  }

  try {
    // Get all connections and find the most recent one
    const connections = await getAllConnections();
    if (connections.length === 0) {
      return {
        success: false,
        error: "No connections found. Please import a backup file first.",
      };
    }

    // Try to login with the most recent connection
    const mostRecentConnection = connections[0]; // Already sorted by most recent

    // Verify password for this connection
    const isValid = await verifyPassword(
      mostRecentConnection.id,
      password
    );

    if (isValid) {
      return {
        success: true,
        connectionId: mostRecentConnection.id,
      };
    } else {
      return {
        success: false,
        error: "Password incorrect. Please try again.",
      };
    }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to connect. Please try again.",
    };
  }
}

