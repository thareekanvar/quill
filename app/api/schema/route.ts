import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/postgres/client';
import { buildQualifiedTableName, buildSafeColumnName } from '@/lib/helpers/query-helpers';

/**
 * POST /api/schema - Create a new table
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, schemaName, tableName, columns } = body;

    if (!connectionString || !schemaName || !tableName || !columns || !Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json(
        { error: 'Connection string, schema name, table name, and columns are required' },
        { status: 400 }
      );
    }

    // Build CREATE TABLE query
    const columnDefinitions = columns.map((col: {
      name: string;
      type: string;
      nullable?: boolean;
      defaultValue?: string;
      primaryKey?: boolean;
    }) => {
      let def = `${buildSafeColumnName(col.name)} ${col.type}`;
      
      if (col.primaryKey) {
        def += ' PRIMARY KEY';
      }
      
      if (!col.nullable && !col.primaryKey) {
        def += ' NOT NULL';
      }
      
      if (col.defaultValue) {
        def += ` DEFAULT ${col.defaultValue}`;
      }
      
      return def;
    }).join(', ');

    const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
    const createTableQuery = `CREATE TABLE ${qualifiedTableName} (${columnDefinitions})`;

    await executeQuery(connectionString, createTableQuery);

    return NextResponse.json({ 
      success: true, 
      message: `Table ${qualifiedTableName} created successfully` 
    });
  } catch (error: any) {
    console.error('Create table error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create table' },
      { status: 500 }
    );
  }
}

