import { NextRequest, NextResponse } from 'next/server';
import { getTableData, getTableSchema } from '@/lib/postgres/client';
import type { RouteContext } from '@/types';
import type { Filter } from '@/types/filters';

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { tableName } = await context.params;
    const body = await request.json();
    const { connectionString, filters } = body;

    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const sortColumn = searchParams.get('sort') || undefined;
    const sortOrder = (searchParams.get('order') || 'ASC') as 'ASC' | 'DESC';
    const schemaName = searchParams.get('schema') || 'public';

    // Get table data
    const data = await getTableData(
      connectionString,
      schemaName,
      tableName,
      page,
      limit,
      sortColumn,
      sortOrder,
      filters as Filter[] | undefined
    );

    // Get table schema
    const schema = await getTableSchema(connectionString, schemaName, tableName);

    return NextResponse.json({
      ...data,
      schema,
      tableName,
      schemaName,
    });
  } catch (error) {
    console.error('Get table data error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch table data';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

