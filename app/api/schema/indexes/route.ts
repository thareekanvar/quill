import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/postgres/client';
import { buildQualifiedTableName, buildSafeColumnName } from '@/lib/helpers/query-helpers';

/**
 * GET /api/schema/indexes - Get all indexes for a table
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, schemaName, tableName } = body;

    if (!connectionString || !schemaName || !tableName) {
      return NextResponse.json(
        { error: 'Connection string, schema name, and table name are required' },
        { status: 400 }
      );
    }

    const query = `
      SELECT
        i.indexname as "indexName",
        i.indexdef as "indexDefinition",
        a.attname as "columnName",
        ix.indisunique as "isUnique",
        ix.indisprimary as "isPrimary"
      FROM pg_indexes i
      JOIN pg_class t ON t.relname = i.tablename
      JOIN pg_namespace n ON n.oid = t.relnamespace AND n.nspname = $1
      JOIN pg_index ix ON ix.indexrelid = (
        SELECT oid FROM pg_class WHERE relname = i.indexname
      )
      LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE i.schemaname = $1 AND i.tablename = $2
      ORDER BY i.indexname, a.attnum;
    `;

    const indexes = await executeQuery(connectionString, query, [schemaName, tableName]);

    // Group by index name
    const indexMap = new Map<string, {
      indexName: string;
      indexDefinition: string;
      columns: string[];
      isUnique: boolean;
      isPrimary: boolean;
    }>();

    for (const row of indexes) {
      const indexName = row.indexName as string;
      if (!indexMap.has(indexName)) {
        indexMap.set(indexName, {
          indexName,
          indexDefinition: row.indexDefinition as string,
          columns: [],
          isUnique: row.isUnique as boolean,
          isPrimary: row.isPrimary as boolean,
        });
      }
      const index = indexMap.get(indexName)!;
      if (row.columnName) {
        index.columns.push(row.columnName as string);
      }
    }

    return NextResponse.json({ 
      indexes: Array.from(indexMap.values())
    });
  } catch (error: any) {
    console.error('Get indexes error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get indexes' },
      { status: 500 }
    );
  }
}


