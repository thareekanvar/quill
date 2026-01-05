import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/postgres/client';
import { buildQualifiedTableName, buildSafeColumnName } from '@/lib/helpers/query-helpers';

/**
 * POST /api/schema/columns - Add a new column to a table
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, schemaName, tableName, column } = body;

    if (!connectionString || !schemaName || !tableName || !column) {
      return NextResponse.json(
        { error: 'Connection string, schema name, table name, and column are required' },
        { status: 400 }
      );
    }

    const { name, type, nullable = true, defaultValue, position } = column;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Column name and type are required' },
        { status: 400 }
      );
    }

    const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
    let alterQuery = `ALTER TABLE ${qualifiedTableName} ADD COLUMN ${buildSafeColumnName(name)} ${type}`;

    if (!nullable) {
      alterQuery += ' NOT NULL';
    }

    if (defaultValue) {
      alterQuery += ` DEFAULT ${defaultValue}`;
    }

    if (position === 'first') {
      // PostgreSQL doesn't support FIRST, but we can note it
      // For now, we'll just add it at the end
    } else if (position && position !== 'last') {
      // PostgreSQL doesn't support AFTER column, but we can note it
      // For now, we'll just add it at the end
    }

    await executeQuery(connectionString, alterQuery);

    return NextResponse.json({ 
      success: true, 
      message: `Column ${name} added successfully` 
    });
  } catch (error: any) {
    console.error('Add column error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add column' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/schema/columns - Modify an existing column
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, schemaName, tableName, columnName, changes } = body;

    if (!connectionString || !schemaName || !tableName || !columnName || !changes) {
      return NextResponse.json(
        { error: 'Connection string, schema name, table name, column name, and changes are required' },
        { status: 400 }
      );
    }

    const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
    const safeColumnName = buildSafeColumnName(columnName);
    const queries: string[] = [];

    // Handle column rename
    if (changes.newName && changes.newName !== columnName) {
      queries.push(`ALTER TABLE ${qualifiedTableName} RENAME COLUMN ${safeColumnName} TO ${buildSafeColumnName(changes.newName)}`);
    }

    // Handle type change
    if (changes.type) {
      const targetColumn = changes.newName || columnName;
      queries.push(`ALTER TABLE ${qualifiedTableName} ALTER COLUMN ${buildSafeColumnName(targetColumn)} TYPE ${changes.type}`);
    }

    // Handle nullable change
    if (changes.nullable !== undefined) {
      const targetColumn = changes.newName || columnName;
      if (changes.nullable) {
        queries.push(`ALTER TABLE ${qualifiedTableName} ALTER COLUMN ${buildSafeColumnName(targetColumn)} DROP NOT NULL`);
      } else {
        queries.push(`ALTER TABLE ${qualifiedTableName} ALTER COLUMN ${buildSafeColumnName(targetColumn)} SET NOT NULL`);
      }
    }

    // Handle default value change
    if (changes.defaultValue !== undefined) {
      const targetColumn = changes.newName || columnName;
      if (changes.defaultValue === null || changes.defaultValue === '') {
        queries.push(`ALTER TABLE ${qualifiedTableName} ALTER COLUMN ${buildSafeColumnName(targetColumn)} DROP DEFAULT`);
      } else {
        queries.push(`ALTER TABLE ${qualifiedTableName} ALTER COLUMN ${buildSafeColumnName(targetColumn)} SET DEFAULT ${changes.defaultValue}`);
      }
    }

    // Execute all queries
    for (const query of queries) {
      await executeQuery(connectionString, query);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Column ${columnName} modified successfully` 
    });
  } catch (error: any) {
    console.error('Modify column error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to modify column' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/schema/columns - Drop a column from a table
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, schemaName, tableName, columnName } = body;

    if (!connectionString || !schemaName || !tableName || !columnName) {
      return NextResponse.json(
        { error: 'Connection string, schema name, table name, and column name are required' },
        { status: 400 }
      );
    }

    const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
    const safeColumnName = buildSafeColumnName(columnName);
    const dropQuery = `ALTER TABLE ${qualifiedTableName} DROP COLUMN ${safeColumnName}`;

    await executeQuery(connectionString, dropQuery);

    return NextResponse.json({ 
      success: true, 
      message: `Column ${columnName} dropped successfully` 
    });
  } catch (error: any) {
    console.error('Drop column error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to drop column' },
      { status: 500 }
    );
  }
}

