import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/postgres/client';
import { buildQualifiedTableName, buildSafeColumnName } from '@/lib/helpers/query-helpers';

/**
 * GET /api/schema/foreign-keys - Get all foreign keys for a table
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
        tc.constraint_name as "constraintName",
        kcu.column_name as "columnName",
        ccu.table_schema as "foreignTableSchema",
        ccu.table_name as "foreignTableName",
        ccu.column_name as "foreignColumnName",
        rc.update_rule as "onUpdate",
        rc.delete_rule as "onDelete"
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
        AND rc.constraint_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2;
    `;

    const foreignKeys = await executeQuery(connectionString, query, [schemaName, tableName]);

    return NextResponse.json({ foreignKeys });
  } catch (error: any) {
    console.error('Get foreign keys error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get foreign keys' },
      { status: 500 }
    );
  }
}


