import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/postgres/client';
import { buildQualifiedTableName, buildSafeColumnName } from '@/lib/helpers/query-helpers';

/**
 * POST /api/schema/foreign-keys/delete - Drop a foreign key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, schemaName, constraintName } = body;

    if (!connectionString || !schemaName || !constraintName) {
      return NextResponse.json(
        { error: 'Connection string, schema name, and constraint name are required' },
        { status: 400 }
      );
    }

    // First, get the table name for this constraint
    const getTableQuery = `
      SELECT table_name
      FROM information_schema.table_constraints
      WHERE constraint_schema = $1 AND constraint_name = $2
    `;
    const tables = await executeQuery(connectionString, getTableQuery, [schemaName, constraintName]);
    
    if (tables.length === 0) {
      return NextResponse.json(
        { error: 'Foreign key constraint not found' },
        { status: 404 }
      );
    }

    const tableName = tables[0].table_name as string;
    const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
    const safeConstraintName = buildSafeColumnName(constraintName);
    const dropQuery = `ALTER TABLE ${qualifiedTableName} DROP CONSTRAINT ${safeConstraintName}`;

    await executeQuery(connectionString, dropQuery);

    return NextResponse.json({ 
      success: true, 
      message: `Foreign key ${constraintName} dropped successfully` 
    });
  } catch (error: any) {
    console.error('Drop foreign key error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to drop foreign key' },
      { status: 500 }
    );
  }
}

