import { NextRequest, NextResponse } from 'next/server';
import { getTableSchema } from '@/lib/postgres/client';
import type { RouteContext } from '@/types';

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { tableName } = await context.params;
    const body = await request.json();
    const { connectionString } = body;
    const searchParams = request.nextUrl.searchParams;
    const schemaName = searchParams.get('schema') || 'public';

    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    const columns = await getTableSchema(connectionString, schemaName, tableName);

    return NextResponse.json({ columns });
  } catch (error) {
    console.error('Get table columns error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch table columns';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

