import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/postgres/client';
import { isMutation } from '@/lib/helpers/query-helpers';
import { Pool } from 'pg';

// Store active transactions (in production, use Redis or database)
const activeTransactions = new Map<string, Pool>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, password, query, params, useTransaction, transactionId, commitTransaction: shouldCommit, rollbackTransaction: shouldRollback } = body;

    if (!connectionString || !query) {
      return NextResponse.json(
        { error: 'Connection string and query are required' },
        { status: 400 }
      );
    }

    // Handle transaction commit/rollback
    if (transactionId && (shouldCommit || shouldRollback)) {
      const pool = activeTransactions.get(transactionId);
      if (!pool) {
        return NextResponse.json(
          { error: 'Transaction not found or expired' },
          { status: 404 }
        );
      }

      const client = await pool.connect();
      try {
        if (shouldCommit) {
          await client.query('COMMIT');
          return NextResponse.json({ success: true, message: 'Transaction committed successfully' });
        } else {
          await client.query('ROLLBACK');
          return NextResponse.json({ success: true, message: 'Transaction rolled back successfully' });
        }
      } finally {
        client.release();
        if (shouldCommit || shouldRollback) {
          activeTransactions.delete(transactionId);
          await pool.end();
        }
      }
    }

    // Check if query is a mutation (UPDATE, INSERT, DELETE)
    const isMutationQuery = isMutation(query);

    // If useTransaction is true and it's a write operation, wrap in transaction
    if (useTransaction && isMutationQuery) {
      const pool = new Pool({ connectionString });
      const client = await pool.connect();
      
      try {
        // Start transaction
        await client.query('BEGIN');
        
        // Execute query
        const result = await client.query(query, params);
        
        // Generate transaction ID
        const txId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        activeTransactions.set(txId, pool);
        
        // Set timeout to auto-rollback after 5 minutes
        setTimeout(async () => {
          if (activeTransactions.has(txId)) {
            const txPool = activeTransactions.get(txId);
            if (txPool) {
              const txClient = await txPool.connect();
              try {
                await txClient.query('ROLLBACK');
              } finally {
                txClient.release();
                activeTransactions.delete(txId);
                await txPool.end();
              }
            }
          }
        }, 5 * 60 * 1000); // 5 minutes
        
        return NextResponse.json({
          success: true,
          message: 'Query executed in transaction. Use commit or rollback to finalize.',
          transactionId: txId,
          affectedRows: result.rowCount || 0,
          data: result.rows,
        });
      } catch (error: any) {
        await client.query('ROLLBACK').catch(() => {});
        client.release();
        await pool.end();
        throw error;
      }
    }

    // Normal execution (no transaction or SELECT query)
    if (!isMutationQuery) {
      // For SELECT queries, just execute and return
      const result = await executeQuery(connectionString, query, params);
      return NextResponse.json({ success: true, data: result });
    }

    // For mutations without transaction, execute and return affected rows
    const result = await executeQuery(connectionString, query, params);
    
    return NextResponse.json({
      success: true,
      message: 'Query executed successfully',
      affectedRows: result.length || 0,
    });
  } catch (error: any) {
    console.error('Query execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute query' },
      { status: 500 }
    );
  }
}

