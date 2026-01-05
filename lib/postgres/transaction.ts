import { Pool, PoolClient } from 'pg';

// Store active transactions per connection string
// In production, you might want to use Redis or a database for this
const activeTransactions = new Map<string, {
  client: PoolClient;
  connectionString: string;
  startedAt: Date;
  queries: string[];
}>();

const TRANSACTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * Start a transaction for a connection
 * Returns a transaction ID that can be used to commit or rollback
 */
export async function beginTransaction(connectionString: string): Promise<string> {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  
  // Start transaction
  await client.query('BEGIN');
  
  const transactionId = `${connectionString}-${Date.now()}-${Math.random()}`;
  
  activeTransactions.set(transactionId, {
    client,
    connectionString,
    startedAt: new Date(),
    queries: [],
  });
  
  // Set timeout to auto-rollback after 5 minutes
  setTimeout(() => {
    if (activeTransactions.has(transactionId)) {
      rollbackTransaction(transactionId).catch(console.error);
    }
  }, TRANSACTION_TIMEOUT);
  
  return transactionId;
}

/**
 * Execute a query within a transaction (without committing)
 */
export async function executeInTransaction<T = Record<string, unknown>>(
  transactionId: string,
  query: string,
  params?: unknown[]
): Promise<T[]> {
  const transaction = activeTransactions.get(transactionId);
  
  if (!transaction) {
    throw new Error('Transaction not found or expired');
  }
  
  // Check if transaction has expired
  const age = Date.now() - transaction.startedAt.getTime();
  if (age > TRANSACTION_TIMEOUT) {
    await rollbackTransaction(transactionId);
    throw new Error('Transaction expired');
  }
  
  // Execute query
  const result = await transaction.client.query(query, params);
  transaction.queries.push(query);
  
  return result.rows as T[];
}

/**
 * Commit a transaction
 */
export async function commitTransaction(transactionId: string): Promise<void> {
  const transaction = activeTransactions.get(transactionId);
  
  if (!transaction) {
    throw new Error('Transaction not found or expired');
  }
  
  try {
    await transaction.client.query('COMMIT');
  } finally {
    transaction.client.release();
    activeTransactions.delete(transactionId);
  }
}

/**
 * Rollback a transaction
 */
export async function rollbackTransaction(transactionId: string): Promise<void> {
  const transaction = activeTransactions.get(transactionId);
  
  if (!transaction) {
    // Transaction might already be cleaned up
    return;
  }
  
  try {
    await transaction.client.query('ROLLBACK');
  } catch (error) {
    console.error('Error rolling back transaction:', error);
  } finally {
    transaction.client.release();
    activeTransactions.delete(transactionId);
  }
}

/**
 * Get transaction info
 */
export function getTransactionInfo(transactionId: string): {
  startedAt: Date;
  queries: string[];
  age: number;
} | null {
  const transaction = activeTransactions.get(transactionId);
  
  if (!transaction) {
    return null;
  }
  
  return {
    startedAt: transaction.startedAt,
    queries: transaction.queries,
    age: Date.now() - transaction.startedAt.getTime(),
  };
}

/**
 * Cleanup all transactions for a connection (e.g., on logout)
 */
export async function cleanupTransactions(connectionString: string): Promise<void> {
  const toCleanup: string[] = [];
  
  for (const [id, transaction] of activeTransactions.entries()) {
    if (transaction.connectionString === connectionString) {
      toCleanup.push(id);
    }
  }
  
  for (const id of toCleanup) {
    await rollbackTransaction(id);
  }
}

