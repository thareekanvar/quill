import { executeQuery, getTables } from '@/lib/postgres/client';
import type { TableColumn } from '@/types';

export interface SchemaContext {
  tables: Array<{
    schemaName: string;
    tableName: string;
    columns: Array<{
      columnName: string;
      dataType: string;
      isNullable: boolean;
      columnDefault: string | null;
    }>;
  }>;
}

/**
 * Get comprehensive database schema context for AI
 */
export async function getSchemaContext(
  connectionString: string
): Promise<SchemaContext> {
  try {
    // Get all tables
    const tables = await getTables(connectionString);
    
    // Get columns for each table
    const tablesWithColumns = await Promise.all(
      tables.map(async (table) => {
        const columnsQuery = `
          SELECT 
            column_name as "columnName",
            data_type as "dataType",
            is_nullable as "isNullable",
            column_default as "columnDefault"
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position;
        `;
        
        const columns = await executeQuery<{
          columnName: string;
          dataType: string;
          isNullable: string;
          columnDefault: string | null;
        }>(connectionString, columnsQuery, [table.schemaName, table.tableName]);
        
        return {
          schemaName: table.schemaName,
          tableName: table.tableName,
          columns: columns.map(col => ({
            columnName: col.columnName,
            dataType: col.dataType,
            isNullable: col.isNullable === 'YES',
            columnDefault: col.columnDefault,
          })),
        };
      })
    );
    
    return {
      tables: tablesWithColumns,
    };
  } catch (error) {
    console.error('Error getting schema context:', error);
    return { tables: [] };
  }
}

/**
 * Format schema context as a string for AI prompt
 */
export function formatSchemaContext(context: SchemaContext): string {
  if (context.tables.length === 0) {
    return 'No tables found in the database.';
  }
  
  const schemaDescription = context.tables
    .map((table) => {
      const columns = table.columns
        .map((col) => {
          let colDesc = `${col.columnName} (${col.dataType}`;
          if (!col.isNullable) colDesc += ', NOT NULL';
          if (col.columnDefault) colDesc += `, DEFAULT ${col.columnDefault}`;
          colDesc += ')';
          return colDesc;
        })
        .join(', ');
      
      return `Table: ${table.schemaName}.${table.tableName}\n  Columns: ${columns}`;
    })
    .join('\n\n');
  
  return `Database Schema:\n\n${schemaDescription}`;
}

