import { NextRequest, NextResponse } from 'next/server';
import {
  beginTransaction,
  executeInTransaction,
  commitTransaction,
  rollbackTransaction,
  getTransactionInfo,
} from '@/lib/postgres/transaction';

/**
 * POST /api/query/transaction
 * Start a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString } = body;

    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    const transactionId = await beginTransaction(connectionString);
    
    return NextResponse.json({
      success: true,
      transactionId,
    });
  } catch (error: any) {
    console.error('Transaction start error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start transaction' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/query/transaction
 * Execute query in transaction or commit/rollback
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, action, query, params } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    if (action === 'commit') {
      await commitTransaction(transactionId);
      return NextResponse.json({
        success: true,
        message: 'Transaction committed successfully',
      });
    }

    if (action === 'rollback') {
      await rollbackTransaction(transactionId);
      return NextResponse.json({
        success: true,
        message: 'Transaction rolled back successfully',
      });
    }

    if (action === 'execute' && query) {
      const result = await executeInTransaction(transactionId, query, params);
      const info = getTransactionInfo(transactionId);
      
      return NextResponse.json({
        success: true,
        data: result,
        transactionInfo: info,
      });
    }

    if (action === 'info') {
      const info = getTransactionInfo(transactionId);
      if (!info) {
        return NextResponse.json(
          { error: 'Transaction not found or expired' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        transactionInfo: info,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "commit", "rollback", "execute", or "info"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Transaction operation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute transaction operation' },
      { status: 500 }
    );
  }
}

