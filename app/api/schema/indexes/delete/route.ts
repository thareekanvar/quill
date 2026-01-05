import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/postgres/client';
import { buildSafeColumnName } from '@/lib/helpers/query-helpers';

/**
 * POST /api/schema/indexes/delete - Drop an index
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, schemaName, indexName } = body;

    if (!connectionString || !schemaName || !indexName) {
      return NextResponse.json(
        { error: 'Connection string, schema name, and index name are required' },
        { status: 400 }
      );
    }

    const qualifiedIndexName = `${buildSafeColumnName(schemaName)}.${buildSafeColumnName(indexName)}`;
    const dropQuery = `DROP INDEX ${qualifiedIndexName}`;

    await executeQuery(connectionString, dropQuery);

    return NextResponse.json({ 
      success: true, 
      message: `Index ${indexName} dropped successfully` 
    });
  } catch (error: any) {
    console.error('Drop index error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to drop index' },
      { status: 500 }
    );
  }
}

