import { Pool, PoolClient } from 'pg';
import { calculateOffset } from '@/lib/helpers/pagination-helpers';
import { buildQualifiedTableName, buildSafeColumnName } from '@/lib/helpers/query-helpers';
import { buildWhereClause } from '@/lib/helpers/filter-query-builder';
import type { TableColumn } from '@/types';
import type { Filter } from '@/types/filters';

// In-memory connection pool cache
const connectionPools = new Map<string, Pool>();

/**
 * Get or create a PostgreSQL connection pool for a connection string
 */
export function getPool(connectionString: string): Pool {
  // Use connection string as key (in production, you might want to hash this)
  if (!connectionPools.has(connectionString)) {
    const pool = new Pool({
      connectionString,
      // Connection pool settings
      max: 5, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    connectionPools.set(connectionString, pool);
  }

  return connectionPools.get(connectionString)!;
}

/**
 * Test a PostgreSQL connection
 */
export async function testConnection(connectionString: string): Promise<boolean> {
  const pool = getPool(connectionString);
  
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

/**
 * Execute a query and return results
 */
export async function executeQuery<T = Record<string, unknown>>(
  connectionString: string,
  query: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPool(connectionString);
  const client = await pool.connect();

  try {
    const result = await client.query(query, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

/**
 * Get all tables from a database
 */
export async function getTables(connectionString: string): Promise<Array<{ tableName: string; schemaName: string }>> {
  const query = `
    SELECT 
      table_schema as "schemaName",
      table_name as "tableName"
    FROM information_schema.tables
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      AND table_type = 'BASE TABLE'
    ORDER BY table_schema, table_name;
  `;

  return executeQuery<{ tableName: string; schemaName: string }>(connectionString, query);
}

/**
 * Get table data with pagination
 */
export async function getTableData(
  connectionString: string,
  schemaName: string,
  tableName: string,
  page: number = 1,
  limit: number = 50,
  sortColumn?: string,
  sortOrder: 'ASC' | 'DESC' = 'ASC',
  filters?: Filter[]
): Promise<{
  data: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
}> {
  const offset = calculateOffset(page, limit);
  const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
  
  // Build WHERE clause from filters
  const { whereClause, params: filterParams } = buildWhereClause(filters || []);
  
  // Get total count with filters
  const countQuery = `SELECT COUNT(*) as count FROM ${qualifiedTableName} ${whereClause}`;
  const countResult = await executeQuery<{ count: string }>(
    connectionString,
    countQuery,
    filterParams
  );
  const total = parseInt(countResult[0]?.count || '0', 10);

  // Build query with filters and optional sorting
  let dataQuery = `SELECT * FROM ${qualifiedTableName} ${whereClause}`;
  if (sortColumn) {
    const safeSortColumn = buildSafeColumnName(sortColumn);
    dataQuery += ` ORDER BY ${safeSortColumn} ${sortOrder}`;
  }
  
  // Add pagination parameters (offset by filter params)
  const paramOffset = filterParams.length;
  dataQuery += ` LIMIT $${paramOffset + 1} OFFSET $${paramOffset + 2}`;

  const data = await executeQuery(
    connectionString,
    dataQuery,
    [...filterParams, limit, offset]
  );

  return {
    data,
    total,
    page,
    limit,
  };
}

/**
 * Get table schema (column information)
 */
export async function getTableSchema(
  connectionString: string,
  schemaName: string,
  tableName: string
): Promise<TableColumn[]> {
  const query = `
    SELECT 
      column_name as "columnName",
      data_type as "dataType",
      is_nullable as "isNullable",
      column_default as "columnDefault"
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position;
  `;

  return executeQuery(connectionString, query, [schemaName, tableName]);
}

/**
 * Get a single row by primary key
 */
export async function getTableRow(
  connectionString: string,
  schemaName: string,
  tableName: string,
  primaryKeyColumn: string,
  primaryKeyValue: unknown
): Promise<Record<string, unknown> | null> {
  const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
  const safeColumn = buildSafeColumnName(primaryKeyColumn);
  const query = `SELECT * FROM ${qualifiedTableName} WHERE ${safeColumn} = $1 LIMIT 1`;
  
  const result = await executeQuery(connectionString, query, [primaryKeyValue]);
  return result[0] || null;
}

/**
 * Close all connection pools (cleanup)
 */
export async function closeAllPools(): Promise<void> {
  for (const pool of connectionPools.values()) {
    await pool.end();
  }
  connectionPools.clear();
}

/**
 * Close a specific connection pool
 */
export async function closePool(connectionString: string): Promise<void> {
  const pool = connectionPools.get(connectionString);
  if (pool) {
    await pool.end();
    connectionPools.delete(connectionString);
  }
}

