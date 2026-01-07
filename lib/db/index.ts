import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { encrypt, decrypt, hash } from './encryption';
import type { PostgresConnection, ConnectionMetadata } from '@/types/database';

export interface Dashboard {
  id: string;
  connectionId: string; // Connection this dashboard belongs to
  name: string; // Dashboard name
  createdAt: number;
  updatedAt: number;
}

export interface DashboardCard {
  id: string;
  connectionId: string; // Connection this card belongs to
  dashboardId: string; // Dashboard this card belongs to
  title: string;
  description: string;
  query: string;
  queryType: 'rowCount' | 'sum' | 'avg' | 'min' | 'max' | 'countDistinct' | 'custom';
  tableName?: string;
  schemaName?: string;
  valueColumn?: string; // Column to extract as the main value
  aggregateColumn?: string; // Column to aggregate (for sum/avg/min/max/countDistinct)
  footerText?: string;
  dateColumn?: string; // Column to use for date filtering
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface DashboardChart {
  id: string;
  connectionId: string; // Connection this chart belongs to
  dashboardId: string; // Dashboard this chart belongs to
  title: string;
  description: string;
  chartType: 'bar' | 'line' | 'area' | 'pie' | 'radar' | 'radial';
  query: string;
  tableName?: string;
  schemaName?: string;
  xAxisColumn?: string; // Column for X-axis (category/label)
  yAxisColumn?: string; // Column for Y-axis (value)
  seriesColumn?: string; // Column for series/grouping (for multi-series charts)
  dateColumn?: string; // Column to use for date filtering
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface SavedQuery {
  id: string;
  connectionId: string; // Connection this query belongs to
  name?: string; // Optional name for saved queries
  query: string;
  params?: unknown[]; // Query parameters if any
  executedAt: number; // Timestamp when query was executed
  isSaved: boolean; // Whether this is a saved query or just history
  createdAt: number; // When query was first saved (for saved queries)
  updatedAt: number; // When query was last updated (for saved queries)
}

interface PostAdminDB extends DBSchema {
  connections: {
    key: string;
    value: PostgresConnection;
  };
  dashboards: {
    key: string;
    value: Dashboard;
    indexes: { 'by-connection': string };
  };
  dashboardCards: {
    key: string;
    value: DashboardCard;
    indexes: { 'by-order': number; 'by-connection': string; 'by-dashboard': string };
  };
  dashboardCharts: {
    key: string;
    value: DashboardChart;
    indexes: { 'by-order': number; 'by-connection': string; 'by-dashboard': string };
  };
  queries: {
    key: string;
    value: SavedQuery;
    indexes: { 'by-connection': string; 'by-executed': number };
  };
}

const DB_NAME = 'postadmin-db';
const DB_VERSION = 7; // Increment for new schema (added queries store)
const STORE_NAME = 'connections';
const DASHBOARDS_STORE_NAME = 'dashboards';
const CARDS_STORE_NAME = 'dashboardCards';
const CHARTS_STORE_NAME = 'dashboardCharts';
const QUERIES_STORE_NAME = 'queries';

let dbInstance: IDBPDatabase<PostAdminDB> | null = null;

/**
 * Initialize and return the IndexedDB instance
 */
export async function getDB(): Promise<IDBPDatabase<PostAdminDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<PostAdminDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      
      // Add dashboards store
      if (!db.objectStoreNames.contains(DASHBOARDS_STORE_NAME)) {
        const dashboardsStore = db.createObjectStore(DASHBOARDS_STORE_NAME, { keyPath: 'id' });
        dashboardsStore.createIndex('by-connection', 'connectionId');
      }
      
      // Add dashboard cards store
      if (!db.objectStoreNames.contains(CARDS_STORE_NAME)) {
        const cardsStore = db.createObjectStore(CARDS_STORE_NAME, { keyPath: 'id' });
        cardsStore.createIndex('by-order', 'order');
        cardsStore.createIndex('by-connection', 'connectionId');
        cardsStore.createIndex('by-dashboard', 'dashboardId');
      } else {
        // Update existing cards store
        const cardsStore = transaction.objectStore(CARDS_STORE_NAME);
        if (oldVersion < 5) {
          // Add connectionId index if it doesn't exist
          try {
            if (!cardsStore.indexNames.contains('by-connection')) {
              cardsStore.createIndex('by-connection', 'connectionId');
            }
          } catch {
            // Index might already exist
          }
        }
        if (oldVersion < 6) {
          // Add dashboardId index if it doesn't exist
          try {
            if (!cardsStore.indexNames.contains('by-dashboard')) {
              cardsStore.createIndex('by-dashboard', 'dashboardId');
            }
          } catch {
            // Index might already exist
          }
        }
      }
      
      // Add dashboard charts store
      if (!db.objectStoreNames.contains(CHARTS_STORE_NAME)) {
        const chartsStore = db.createObjectStore(CHARTS_STORE_NAME, { keyPath: 'id' });
        chartsStore.createIndex('by-order', 'order');
        chartsStore.createIndex('by-connection', 'connectionId');
        chartsStore.createIndex('by-dashboard', 'dashboardId');
      } else {
        // Update existing charts store
        const chartsStore = transaction.objectStore(CHARTS_STORE_NAME);
        if (oldVersion < 5) {
          // Add connectionId index if it doesn't exist
          try {
            if (!chartsStore.indexNames.contains('by-connection')) {
              chartsStore.createIndex('by-connection', 'connectionId');
            }
          } catch {
            // Index might already exist
          }
        }
        if (oldVersion < 6) {
          // Add dashboardId index if it doesn't exist
          try {
            if (!chartsStore.indexNames.contains('by-dashboard')) {
              chartsStore.createIndex('by-dashboard', 'dashboardId');
            }
          } catch {
            // Index might already exist
          }
        }
      }
      
      // Add queries store
      if (!db.objectStoreNames.contains(QUERIES_STORE_NAME)) {
        const queriesStore = db.createObjectStore(QUERIES_STORE_NAME, { keyPath: 'id' });
        queriesStore.createIndex('by-connection', 'connectionId');
        queriesStore.createIndex('by-executed', 'executedAt');
      }
    },
    async blocked() {
      // Close existing connections if blocked
      if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
      }
    },
  });

  // Migrate existing cards and charts after database is opened
  try {
    const db = dbInstance;
    const cardsStore = db.transaction(CARDS_STORE_NAME, 'readwrite').objectStore(CARDS_STORE_NAME);
    const chartsStore = db.transaction(CHARTS_STORE_NAME, 'readwrite').objectStore(CHARTS_STORE_NAME);
    const dashboardsStore = db.transaction(DASHBOARDS_STORE_NAME, 'readwrite').objectStore(DASHBOARDS_STORE_NAME);
    const connectionsStore = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
    
    // Get all items
    const allCards = await cardsStore.getAll();
    const allCharts = await chartsStore.getAll();
    const allDashboards = await dashboardsStore.getAll();
    const allConnections = await connectionsStore.getAll();
    
    // Group cards and charts by connectionId
    const cardsByConnection = new Map<string, any[]>();
    const chartsByConnection = new Map<string, any[]>();
    
    for (const card of allCards) {
      if (!card.dashboardId) {
        const connId = card.connectionId || (allConnections.length > 0 ? allConnections.sort((a, b) => b.createdAt - a.createdAt)[0].id : null);
        if (connId) {
          if (!cardsByConnection.has(connId)) {
            cardsByConnection.set(connId, []);
          }
          cardsByConnection.get(connId)!.push(card);
        }
      }
    }
    
    for (const chart of allCharts) {
      if (!chart.dashboardId) {
        const connId = chart.connectionId || (allConnections.length > 0 ? allConnections.sort((a, b) => b.createdAt - a.createdAt)[0].id : null);
        if (connId) {
          if (!chartsByConnection.has(connId)) {
            chartsByConnection.set(connId, []);
          }
          chartsByConnection.get(connId)!.push(chart);
        }
      }
    }
    
    // Create default dashboards for each connection that has cards/charts without dashboardId
    for (const connectionId of new Set([...cardsByConnection.keys(), ...chartsByConnection.keys()])) {
      // Check if a default dashboard already exists for this connection
      const existingDashboards = allDashboards.filter(d => d.connectionId === connectionId);
      let defaultDashboard = existingDashboards.find(d => d.name === 'Default Dashboard');
      
      if (!defaultDashboard) {
        // Create default dashboard
        const dashboardId = `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();
        defaultDashboard = {
          id: dashboardId,
          connectionId,
          name: 'Default Dashboard',
          createdAt: now,
          updatedAt: now,
        };
        await dashboardsStore.put(defaultDashboard);
      }
      
      // Migrate cards to default dashboard
      const cardsToMigrate = cardsByConnection.get(connectionId) || [];
      for (const card of cardsToMigrate) {
        card.dashboardId = defaultDashboard.id;
        await cardsStore.put(card);
      }
      
      // Migrate charts to default dashboard
      const chartsToMigrate = chartsByConnection.get(connectionId) || [];
      for (const chart of chartsToMigrate) {
        chart.dashboardId = defaultDashboard.id;
        await chartsStore.put(chart);
      }
    }
  } catch (error) {
    // Ignore migration errors - database might be new
    console.warn('Migration warning (this is OK if database is new):', error);
  }

  return dbInstance;
}

/**
 * Store a PostgreSQL connection with encryption
 * Throws an error if a connection with the same URL already exists
 */
export async function storeConnection(
  url: string,
  password: string,
  name?: string
): Promise<string> {
  // Check if connection already exists
  const existingConnectionId = await findConnectionByUrl(url, password);
  if (existingConnectionId) {
    throw new Error('A connection with this PostgreSQL URL already exists');
  }
  
  const db = await getDB();
  const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const passwordHash = hash(password);
  const encryptedUrl = encrypt(url, password);
  const encryptedPassword = encrypt(password, password); // Encrypt password with itself

  const connection: PostgresConnection = {
    id,
    name,
    encryptedUrl,
    encryptedPassword,
    passwordHash,
    createdAt: Date.now(),
  };

  await db.put(STORE_NAME, connection);
  return id;
}

/**
 * Get and decrypt a stored connection
 */
export async function getConnection(
  id: string,
  password: string
): Promise<{ url: string; password: string } | null> {
  const db = await getDB();
  const connection = await db.get(STORE_NAME, id);

  if (!connection) {
    return null;
  }

  // Verify password hash
  const providedHash = hash(password);
  if (providedHash !== connection.passwordHash) {
    throw new Error('Invalid password');
  }

  // Decrypt the connection data
  const url = decrypt(connection.encryptedUrl, password);
  const decryptedPassword = decrypt(connection.encryptedPassword, password);

  return { url, password: decryptedPassword };
}

/**
 * Get the current active connection ID (most recent)
 */
export async function getActiveConnectionId(): Promise<string | null> {
  const db = await getDB();
  const connections = await db.getAll(STORE_NAME);
  
  if (connections.length === 0) {
    return null;
  }

  // Return the most recent connection
  const sorted = connections.sort((a, b) => b.createdAt - a.createdAt);
  return sorted[0].id;
}

/**
 * Delete a connection
 */
export async function deleteConnection(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/**
 * Verify password for a connection
 */
export async function verifyPassword(
  id: string,
  password: string
): Promise<boolean> {
  const db = await getDB();
  const connection = await db.get(STORE_NAME, id);

  if (!connection) {
    return false;
  }

  const providedHash = hash(password);
  return providedHash === connection.passwordHash;
}

/**
 * Get all connection metadata (without decrypted data)
 */
export async function getAllConnections(): Promise<ConnectionMetadata[]> {
  const db = await getDB();
  const connections = await db.getAll(STORE_NAME);
  
  return connections.map(conn => ({
    id: conn.id,
    name: conn.name,
    createdAt: conn.createdAt,
  })).sort((a, b) => b.createdAt - a.createdAt); // Most recent first
}

/**
 * Update connection name
 */
export async function updateConnectionName(
  id: string,
  name: string
): Promise<void> {
  const db = await getDB();
  const connection = await db.get(STORE_NAME, id);
  
  if (!connection) {
    throw new Error('Connection not found');
  }
  
  const updatedConnection: PostgresConnection = {
    ...connection,
    name: name || undefined,
  };
  
  await db.put(STORE_NAME, updatedConnection);
}

/**
 * Get all dashboards for a specific connection
 */
export async function getDashboards(connectionId: string): Promise<Dashboard[]> {
  const db = await getDB();
  const allDashboards = await db.getAllFromIndex(DASHBOARDS_STORE_NAME, 'by-connection', connectionId);
  return allDashboards.sort((a, b) => b.createdAt - a.createdAt); // Most recent first
}

/**
 * Get a dashboard by ID
 */
export async function getDashboard(id: string): Promise<Dashboard | null> {
  const db = await getDB();
  return (await db.get(DASHBOARDS_STORE_NAME, id)) || null;
}

/**
 * Create a new dashboard
 */
export async function createDashboard(
  connectionId: string,
  name: string
): Promise<string> {
  const db = await getDB();
  const id = `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();
  
  const newDashboard: Dashboard = {
    id,
    connectionId,
    name,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.put(DASHBOARDS_STORE_NAME, newDashboard);
  return id;
}

/**
 * Update a dashboard
 */
export async function updateDashboard(
  id: string,
  updates: Partial<Omit<Dashboard, 'id' | 'createdAt'>>
): Promise<void> {
  const db = await getDB();
  const dashboard = await db.get(DASHBOARDS_STORE_NAME, id);
  
  if (!dashboard) {
    throw new Error('Dashboard not found');
  }
  
  const updatedDashboard: Dashboard = {
    ...dashboard,
    ...updates,
    updatedAt: Date.now(),
  };
  
  await db.put(DASHBOARDS_STORE_NAME, updatedDashboard);
}

/**
 * Delete a dashboard and all its cards and charts
 */
export async function deleteDashboard(id: string): Promise<void> {
  const db = await getDB();
  const dashboard = await db.get(DASHBOARDS_STORE_NAME, id);
  
  if (!dashboard) {
    throw new Error('Dashboard not found');
  }
  
  // Delete all cards and charts for this dashboard
  const cards = await db.getAllFromIndex(CARDS_STORE_NAME, 'by-dashboard', id);
  const charts = await db.getAllFromIndex(CHARTS_STORE_NAME, 'by-dashboard', id);
  
  const tx = db.transaction([DASHBOARDS_STORE_NAME, CARDS_STORE_NAME, CHARTS_STORE_NAME], 'readwrite');
  
  // Delete cards
  for (const card of cards) {
    await tx.objectStore(CARDS_STORE_NAME).delete(card.id);
  }
  
  // Delete charts
  for (const chart of charts) {
    await tx.objectStore(CHARTS_STORE_NAME).delete(chart.id);
  }
  
  // Delete dashboard
  await tx.objectStore(DASHBOARDS_STORE_NAME).delete(id);
  
  await tx.done;
}

/**
 * Get or create default dashboard for a connection
 */
export async function getOrCreateDefaultDashboard(connectionId: string): Promise<string> {
  const db = await getDB();
  const dashboards = await db.getAllFromIndex(DASHBOARDS_STORE_NAME, 'by-connection', connectionId);
  
  // Look for default dashboard
  let defaultDashboard = dashboards.find(d => d.name === 'Default Dashboard');
  
  if (!defaultDashboard) {
    // Create default dashboard
    const id = `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    defaultDashboard = {
      id,
      connectionId,
      name: 'Default Dashboard',
      createdAt: now,
      updatedAt: now,
    };
    await db.put(DASHBOARDS_STORE_NAME, defaultDashboard);
  }
  
  return defaultDashboard.id;
}

/**
 * Get all dashboard cards sorted by order for a specific dashboard
 */
export async function getDashboardCards(dashboardId: string): Promise<DashboardCard[]> {
  const db = await getDB();
  const allCards = await db.getAllFromIndex(CARDS_STORE_NAME, 'by-dashboard', dashboardId);
  return allCards.sort((a, b) => a.order - b.order);
}

/**
 * Create a new dashboard card
 */
export async function createDashboardCard(
  card: Omit<DashboardCard, 'id' | 'createdAt' | 'updatedAt'> & { connectionId: string; dashboardId: string }
): Promise<string> {
  const db = await getDB();
  const id = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();
  
  const newCard: DashboardCard = {
    ...card,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.put(CARDS_STORE_NAME, newCard);
  return id;
}

/**
 * Update a dashboard card
 */
export async function updateDashboardCard(
  id: string,
  updates: Partial<Omit<DashboardCard, 'id' | 'createdAt'>>
): Promise<void> {
  const db = await getDB();
  const card = await db.get(CARDS_STORE_NAME, id);
  
  if (!card) {
    throw new Error('Card not found');
  }
  
  const updatedCard: DashboardCard = {
    ...card,
    ...updates,
    updatedAt: Date.now(),
  };
  
  await db.put(CARDS_STORE_NAME, updatedCard);
}

/**
 * Delete a dashboard card
 */
export async function deleteDashboardCard(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(CARDS_STORE_NAME, id);
}

/**
 * Reorder dashboard cards
 */
export async function reorderDashboardCards(
  cardIds: string[]
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(CARDS_STORE_NAME, 'readwrite');
  
  for (let i = 0; i < cardIds.length; i++) {
    const card = await tx.store.get(cardIds[i]);
    if (card) {
      card.order = i;
      card.updatedAt = Date.now();
      await tx.store.put(card);
    }
  }
  
  await tx.done;
}

/**
 * Get all dashboard charts sorted by order for a specific dashboard
 */
export async function getDashboardCharts(dashboardId: string): Promise<DashboardChart[]> {
  const db = await getDB();
  const allCharts = await db.getAllFromIndex(CHARTS_STORE_NAME, 'by-dashboard', dashboardId);
  return allCharts.sort((a, b) => a.order - b.order);
}

/**
 * Create a new dashboard chart
 */
export async function createDashboardChart(
  chart: Omit<DashboardChart, 'id' | 'createdAt' | 'updatedAt'> & { connectionId: string; dashboardId: string }
): Promise<string> {
  const db = await getDB();
  const id = `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();
  
  const newChart: DashboardChart = {
    ...chart,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.put(CHARTS_STORE_NAME, newChart);
  return id;
}

/**
 * Update a dashboard chart
 */
export async function updateDashboardChart(
  id: string,
  updates: Partial<Omit<DashboardChart, 'id' | 'createdAt'>>
): Promise<void> {
  const db = await getDB();
  const chart = await db.get(CHARTS_STORE_NAME, id);
  
  if (!chart) {
    throw new Error('Chart not found');
  }
  
  const updatedChart: DashboardChart = {
    ...chart,
    ...updates,
    updatedAt: Date.now(),
  };
  
  await db.put(CHARTS_STORE_NAME, updatedChart);
}

/**
 * Delete a dashboard chart
 */
export async function deleteDashboardChart(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(CHARTS_STORE_NAME, id);
}

/**
 * Reorder dashboard charts
 */
export async function reorderDashboardCharts(
  chartIds: string[]
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(CHARTS_STORE_NAME, 'readwrite');
  
  for (let i = 0; i < chartIds.length; i++) {
    const chart = await tx.store.get(chartIds[i]);
    if (chart) {
      chart.order = i;
      chart.updatedAt = Date.now();
      await tx.store.put(chart);
    }
  }
  
  await tx.done;
}

/**
 * Export connection with decrypted data (for easier import)
 * WARNING: This exports sensitive data in plain text
 */
export async function exportConnectionDecrypted(
  connectionId: string,
  password: string
): Promise<{
  connection: {
    id: string;
    name?: string;
    url: string;
    createdAt: number;
  };
  dashboards: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt' | 'connectionId'>[];
  cards: Omit<DashboardCard, 'id' | 'createdAt' | 'updatedAt' | 'connectionId' | 'dashboardId'>[];
  charts: Omit<DashboardChart, 'id' | 'createdAt' | 'updatedAt' | 'connectionId' | 'dashboardId'>[];
}> {
  const db = await getDB();
  const connection = await db.get(STORE_NAME, connectionId);
  
  if (!connection) {
    throw new Error('Connection not found');
  }
  
  // Verify password and decrypt
  const providedHash = hash(password);
  if (providedHash !== connection.passwordHash) {
    throw new Error('Invalid password');
  }
  
  const decryptedUrl = decrypt(connection.encryptedUrl, password);
  
  // Get all dashboards, cards and charts for this connection
  const dashboards = await db.getAllFromIndex(DASHBOARDS_STORE_NAME, 'by-connection', connectionId);
  const cards = await db.getAllFromIndex(CARDS_STORE_NAME, 'by-connection', connectionId);
  const charts = await db.getAllFromIndex(CHARTS_STORE_NAME, 'by-connection', connectionId);
  
  return {
    connection: {
      id: connection.id,
      name: connection.name,
      url: decryptedUrl,
      createdAt: connection.createdAt,
    },
    dashboards: dashboards.sort((a, b) => b.createdAt - a.createdAt).map(({ id, createdAt, updatedAt, ...rest }) => rest),
    cards: cards.sort((a, b) => a.order - b.order).map(({ id, createdAt, updatedAt, connectionId: _, ...rest }) => rest),
    charts: charts.sort((a, b) => a.order - b.order).map(({ id, createdAt, updatedAt, connectionId: _, ...rest }) => rest),
  };
}

/**
 * Import connection from decrypted export data
 */
export async function importConnectionDecrypted(
  exportedData: {
    connection: {
      name?: string;
      url: string;
    };
    dashboards?: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt' | 'connectionId'>[];
    cards: Omit<DashboardCard, 'id' | 'createdAt' | 'updatedAt' | 'connectionId' | 'dashboardId'>[];
    charts: Omit<DashboardChart, 'id' | 'createdAt' | 'updatedAt' | 'connectionId' | 'dashboardId'>[];
  },
  password: string
): Promise<string> {
  // Use storeConnection to create the connection
  const connectionId = await storeConnection(
    exportedData.connection.url,
    password,
    exportedData.connection.name
  );
  
  // Create a map of old dashboard names to new dashboard IDs
  const dashboardMap = new Map<string, string>();
  
  // Import dashboards (or create default if none exist)
  if (exportedData.dashboards && exportedData.dashboards.length > 0) {
    for (const dashboard of exportedData.dashboards) {
      const dashboardId = await createDashboard(connectionId, dashboard.name);
      dashboardMap.set(dashboard.name, dashboardId);
    }
  } else {
    // Create default dashboard if no dashboards in export
    const defaultDashboardId = await getOrCreateDefaultDashboard(connectionId);
    dashboardMap.set('Default Dashboard', defaultDashboardId);
  }
  
  // Get default dashboard ID for cards/charts without dashboard name
  const defaultDashboardId = await getOrCreateDefaultDashboard(connectionId);
  
  // Import cards
  for (const card of exportedData.cards) {
    // Try to find dashboard ID from card's dashboard name or use default
    const dashboardId = (card as any).dashboardName 
      ? dashboardMap.get((card as any).dashboardName) || defaultDashboardId
      : defaultDashboardId;
    
    await createDashboardCard({
      ...card,
      connectionId,
      dashboardId,
    });
  }
  
  // Import charts
  for (const chart of exportedData.charts) {
    // Try to find dashboard ID from chart's dashboard name or use default
    const dashboardId = (chart as any).dashboardName 
      ? dashboardMap.get((chart as any).dashboardName) || defaultDashboardId
      : defaultDashboardId;
    
    await createDashboardChart({
      ...chart,
      connectionId,
      dashboardId,
    });
  }
  
  return connectionId;
}

/**
 * Clear all connections, dashboards, cards, and charts from IndexedDB
 * Also closes all PostgreSQL connection pools (server-side only)
 */
export async function clearAllConnections(): Promise<void> {
  // Close all PostgreSQL connection pools first (server-side only)
  // Use dynamic import to avoid bundling pg library in client-side code
  if (typeof window === 'undefined') {
    try {
      const { closeAllPools } = await import('@/lib/postgres/client');
      await closeAllPools();
    } catch (error) {
      console.error('Failed to close connection pools:', error);
      // Continue with clearing IndexedDB even if closing pools fails
    }
  }
  
  const db = await getDB();
  const tx = db.transaction([STORE_NAME, DASHBOARDS_STORE_NAME, CARDS_STORE_NAME, CHARTS_STORE_NAME], 'readwrite');
  
  // Clear all connections
  await tx.objectStore(STORE_NAME).clear();
  
  // Clear all dashboards
  await tx.objectStore(DASHBOARDS_STORE_NAME).clear();
  
  // Clear all cards
  await tx.objectStore(CARDS_STORE_NAME).clear();
  
  // Clear all charts
  await tx.objectStore(CHARTS_STORE_NAME).clear();
  
  await tx.done;
}

/**
 * Check if a connection URL already exists
 * Returns the connection ID if found, null otherwise
 */
export async function findConnectionByUrl(
  url: string,
  password: string
): Promise<string | null> {
  const db = await getDB();
  const connections = await db.getAll(STORE_NAME);
  
  // Normalize URL for comparison (remove trailing slashes, whitespace)
  const normalizedUrl = url.trim().replace(/\/+$/, '');
  
  for (const connection of connections) {
    try {
      // Verify password matches
      const providedHash = hash(password);
      if (providedHash !== connection.passwordHash) {
        continue; // Skip if password doesn't match
      }
      
      // Decrypt and compare URLs
      const decryptedUrl = decrypt(connection.encryptedUrl, password);
      const normalizedDecryptedUrl = decryptedUrl.trim().replace(/\/+$/, '');
      
      if (normalizedDecryptedUrl === normalizedUrl) {
        return connection.id;
      }
    } catch {
      // Skip connections that can't be decrypted (wrong password)
      continue;
    }
  }
  
  return null;
}

/**
 * Save a query to history
 */
export async function saveQueryToHistory(
  connectionId: string,
  query: string,
  params?: unknown[]
): Promise<SavedQuery> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const now = Date.now();
  
  const savedQuery: SavedQuery = {
    id,
    connectionId,
    query,
    params,
    executedAt: now,
    isSaved: false,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.add(QUERIES_STORE_NAME, savedQuery);
  
  // Keep only last 50 queries per connection
  const allQueries = await db.getAllFromIndex(QUERIES_STORE_NAME, 'by-connection', connectionId);
  
  // Sort by executedAt descending
  const sortedQueries = allQueries.sort((a, b) => b.executedAt - a.executedAt);
  
  // Delete queries beyond the 50th (excluding saved queries)
  const historyQueries = sortedQueries.filter(q => !q.isSaved);
  if (historyQueries.length > 50) {
    const toDelete = historyQueries.slice(50);
    const tx = db.transaction(QUERIES_STORE_NAME, 'readwrite');
    await Promise.all(toDelete.map(q => tx.store.delete(q.id)));
    await tx.done;
  }
  
  return savedQuery;
}

/**
 * Get query history for a connection (last 50 queries)
 */
export async function getQueryHistory(
  connectionId: string,
  limit: number = 50
): Promise<SavedQuery[]> {
  const db = await getDB();
  const queries = await db.getAllFromIndex(QUERIES_STORE_NAME, 'by-connection', connectionId);
  
  // Sort by executedAt descending and limit
  return queries
    .sort((a, b) => b.executedAt - a.executedAt)
    .slice(0, limit);
}

/**
 * Save a query with a name
 */
export async function saveQuery(
  connectionId: string,
  name: string,
  query: string,
  params?: unknown[]
): Promise<SavedQuery> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const now = Date.now();
  
  const savedQuery: SavedQuery = {
    id,
    connectionId,
    name,
    query,
    params,
    executedAt: now,
    isSaved: true,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.add(QUERIES_STORE_NAME, savedQuery);
  return savedQuery;
}

/**
 * Get all saved queries for a connection
 */
export async function getSavedQueries(connectionId: string): Promise<SavedQuery[]> {
  const db = await getDB();
  const allQueries = await db.getAllFromIndex(QUERIES_STORE_NAME, 'by-connection', connectionId);
  
  return allQueries
    .filter(q => q.isSaved)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Update a saved query
 */
export async function updateSavedQuery(
  id: string,
  updates: Partial<Pick<SavedQuery, 'name' | 'query' | 'params'>>
): Promise<void> {
  const db = await getDB();
  const query = await db.get(QUERIES_STORE_NAME, id);
  
  if (!query) {
    throw new Error('Query not found');
  }
  
  if (!query.isSaved) {
    throw new Error('Cannot update query history item');
  }
  
  const updated: SavedQuery = {
    ...query,
    ...updates,
    updatedAt: Date.now(),
  };
  
  await db.put(QUERIES_STORE_NAME, updated);
}

/**
 * Delete a query (history or saved)
 */
export async function deleteQuery(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(QUERIES_STORE_NAME, id);
}

/**
 * Search queries by text
 */
export async function searchQueries(
  connectionId: string,
  searchText: string
): Promise<SavedQuery[]> {
  const db = await getDB();
  const queries = await db.getAllFromIndex(QUERIES_STORE_NAME, 'by-connection', connectionId);
  
  const lowerSearch = searchText.toLowerCase();
  
  return queries.filter(q => 
    q.query.toLowerCase().includes(lowerSearch) ||
    (q.name && q.name.toLowerCase().includes(lowerSearch))
  ).sort((a, b) => b.executedAt - a.executedAt);
}

