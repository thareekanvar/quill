import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/postgres/client';
import { buildQualifiedTableName, buildSafeColumnName } from '@/lib/helpers/query-helpers';

/**
 * POST /api/schema/foreign-keys/create - Create a new foreign key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, schemaName, tableName, foreignKey } = body;

    if (!connectionString || !schemaName || !tableName || !foreignKey) {
      return NextResponse.json(
        { error: 'Connection string, schema name, table name, and foreign key are required' },
        { status: 400 }
      );
    }

    const { name, columnName, foreignTableSchema, foreignTableName, foreignColumnName, onDelete = 'NO ACTION' } = foreignKey;

    if (!name || !columnName || !foreignTableSchema || !foreignTableName || !foreignColumnName) {
      return NextResponse.json(
        { error: 'Foreign key name, column name, foreign table schema, foreign table name, and foreign column name are required' },
        { status: 400 }
      );
    }

    const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
    const qualifiedForeignTableName = buildQualifiedTableName(foreignTableSchema, foreignTableName);
    const safeConstraintName = buildSafeColumnName(name);
    const safeColumnName = buildSafeColumnName(columnName);
    const safeForeignColumnName = buildSafeColumnName(foreignColumnName);

    // PostgreSQL doesn't support ON UPDATE for foreign keys
    const createForeignKeyQuery = `
      ALTER TABLE ${qualifiedTableName}
      ADD CONSTRAINT ${safeConstraintName}
      FOREIGN KEY (${safeColumnName})
      REFERENCES ${qualifiedForeignTableName} (${safeForeignColumnName})
      ON DELETE ${onDelete}
    `;

    await executeQuery(connectionString, createForeignKeyQuery);

    return NextResponse.json({ 
      success: true, 
      message: `Foreign key ${name} created successfully` 
    });
  } catch (error: any) {
    console.error('Create foreign key error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create foreign key' },
      { status: 500 }
    );
  }
}

