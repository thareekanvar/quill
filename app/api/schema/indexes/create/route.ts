import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/postgres/client';
import { buildQualifiedTableName, buildSafeColumnName } from '@/lib/helpers/query-helpers';

/**
 * POST /api/schema/indexes/create - Create a new index
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, schemaName, tableName, index } = body;

    if (!connectionString || !schemaName || !tableName || !index) {
      return NextResponse.json(
        { error: 'Connection string, schema name, table name, and index are required' },
        { status: 400 }
      );
    }

    const { name, columns, unique = false } = index;

    if (!name || !columns || !Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json(
        { error: 'Index name and columns are required' },
        { status: 400 }
      );
    }

    const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
    const safeIndexName = buildSafeColumnName(name);
    const columnList = columns.map((col: string) => buildSafeColumnName(col)).join(', ');
    const uniqueClause = unique ? 'UNIQUE' : '';

    const createIndexQuery = `CREATE ${uniqueClause} INDEX ${safeIndexName} ON ${qualifiedTableName} (${columnList})`;

    await executeQuery(connectionString, createIndexQuery);

    return NextResponse.json({ 
      success: true, 
      message: `Index ${name} created successfully` 
    });
  } catch (error: any) {
    console.error('Create index error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create index' },
      { status: 500 }
    );
  }
}

