import { NextRequest, NextResponse } from 'next/server';
import { getTableRow, getTableSchema } from '@/lib/postgres/client';
import type { RouteContext } from '@/types';

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { tableName } = await context.params;
    const body = await request.json();
    const { connectionString } = body;

    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const schemaName = searchParams.get('schema') || 'public';
    const primaryKeyColumn = searchParams.get('primaryKey');
    const primaryKeyValue = searchParams.get('primaryKeyValue');

    if (!primaryKeyColumn || primaryKeyValue === null) {
      return NextResponse.json(
        { error: 'Primary key column and value are required' },
        { status: 400 }
      );
    }

    // Get the row
    const row = await getTableRow(
      connectionString,
      schemaName,
      tableName,
      primaryKeyColumn,
      primaryKeyValue
    );

    if (!row) {
      return NextResponse.json(
        { error: 'Row not found' },
        { status: 404 }
      );
    }

    // Get table schema for context
    const schema = await getTableSchema(connectionString, schemaName, tableName);

    return NextResponse.json({
      row,
      schema,
      tableName,
      schemaName,
    });
  } catch (error) {
    console.error('Get table row error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch table row';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

