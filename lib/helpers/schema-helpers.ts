/**
 * Schema management helper functions
 */

import { buildQualifiedTableName, buildSafeColumnName } from './query-helpers';

export interface TableColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  defaultValue?: string;
  primaryKey?: boolean;
}

export interface CreateTableParams {
  schemaName: string;
  tableName: string;
  columns: TableColumnDefinition[];
}

export interface AddColumnParams {
  schemaName: string;
  tableName: string;
  column: {
    name: string;
    type: string;
    nullable?: boolean;
    defaultValue?: string;
    position?: 'first' | 'last' | string;
  };
}

export interface ModifyColumnParams {
  schemaName: string;
  tableName: string;
  columnName: string;
  changes: {
    newName?: string;
    type?: string;
    nullable?: boolean;
    defaultValue?: string | null;
  };
}

export interface DeleteColumnParams {
  schemaName: string;
  tableName: string;
  columnName: string;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
}

export interface CreateIndexParams {
  schemaName: string;
  tableName: string;
  index: IndexDefinition;
}

export interface DeleteIndexParams {
  schemaName: string;
  indexName: string;
}

export interface ForeignKeyDefinition {
  name: string;
  columnName: string;
  foreignTableSchema: string;
  foreignTableName: string;
  foreignColumnName: string;
  onDelete?: 'NO ACTION' | 'CASCADE' | 'SET NULL' | 'RESTRICT';
}

export interface CreateForeignKeyParams {
  schemaName: string;
  tableName: string;
  foreignKey: ForeignKeyDefinition;
}

export interface DeleteForeignKeyParams {
  schemaName: string;
  constraintName: string;
}

/**
 * Build CREATE TABLE SQL statement
 */
export function buildCreateTableQuery(params: CreateTableParams): string {
  const { schemaName, tableName, columns } = params;
  const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);

  const columnDefinitions = columns.map((col) => {
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

  return `CREATE TABLE ${qualifiedTableName} (${columnDefinitions})`;
}

/**
 * Build ADD COLUMN SQL statement
 */
export function buildAddColumnQuery(params: AddColumnParams): string {
  const { schemaName, tableName, column } = params;
  const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
  let alterQuery = `ALTER TABLE ${qualifiedTableName} ADD COLUMN ${buildSafeColumnName(column.name)} ${column.type}`;

  if (!column.nullable) {
    alterQuery += ' NOT NULL';
  }

  if (column.defaultValue) {
    alterQuery += ` DEFAULT ${column.defaultValue}`;
  }

  // PostgreSQL doesn't support FIRST/AFTER, so we just add at the end
  return alterQuery;
}

/**
 * Build ALTER COLUMN SQL statements for modification
 */
export function buildModifyColumnQueries(params: ModifyColumnParams): string[] {
  const { schemaName, tableName, columnName, changes } = params;
  const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
  const queries: string[] = [];

  // Handle column rename
  if (changes.newName && changes.newName !== columnName) {
    queries.push(
      `ALTER TABLE ${qualifiedTableName} RENAME COLUMN ${buildSafeColumnName(columnName)} TO ${buildSafeColumnName(changes.newName)}`
    );
  }

  // Handle type change
  if (changes.type) {
    const targetColumn = changes.newName || columnName;
    queries.push(
      `ALTER TABLE ${qualifiedTableName} ALTER COLUMN ${buildSafeColumnName(targetColumn)} TYPE ${changes.type}`
    );
  }

  // Handle nullable change
  if (changes.nullable !== undefined) {
    const targetColumn = changes.newName || columnName;
    if (changes.nullable) {
      queries.push(
        `ALTER TABLE ${qualifiedTableName} ALTER COLUMN ${buildSafeColumnName(targetColumn)} DROP NOT NULL`
      );
    } else {
      queries.push(
        `ALTER TABLE ${qualifiedTableName} ALTER COLUMN ${buildSafeColumnName(targetColumn)} SET NOT NULL`
      );
    }
  }

  // Handle default value change
  if (changes.defaultValue !== undefined) {
    const targetColumn = changes.newName || columnName;
    if (changes.defaultValue === null || changes.defaultValue === '') {
      queries.push(
        `ALTER TABLE ${qualifiedTableName} ALTER COLUMN ${buildSafeColumnName(targetColumn)} DROP DEFAULT`
      );
    } else {
      queries.push(
        `ALTER TABLE ${qualifiedTableName} ALTER COLUMN ${buildSafeColumnName(targetColumn)} SET DEFAULT ${changes.defaultValue}`
      );
    }
  }

  return queries;
}

/**
 * Build DROP COLUMN SQL statement
 */
export function buildDropColumnQuery(params: DeleteColumnParams): string {
  const { schemaName, tableName, columnName } = params;
  const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
  return `ALTER TABLE ${qualifiedTableName} DROP COLUMN ${buildSafeColumnName(columnName)}`;
}

/**
 * Build CREATE INDEX SQL statement
 */
export function buildCreateIndexQuery(params: CreateIndexParams): string {
  const { schemaName, tableName, index } = params;
  const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
  const safeIndexName = buildSafeColumnName(index.name);
  const columnList = index.columns.map((col) => buildSafeColumnName(col)).join(', ');
  const uniqueClause = index.unique ? 'UNIQUE' : '';

  return `CREATE ${uniqueClause} INDEX ${safeIndexName} ON ${qualifiedTableName} (${columnList})`;
}

/**
 * Build DROP INDEX SQL statement
 */
export function buildDropIndexQuery(params: DeleteIndexParams): string {
  const { schemaName, indexName } = params;
  const qualifiedIndexName = `${buildSafeColumnName(schemaName)}.${buildSafeColumnName(indexName)}`;
  return `DROP INDEX ${qualifiedIndexName}`;
}

/**
 * Build CREATE FOREIGN KEY SQL statement
 */
export function buildCreateForeignKeyQuery(params: CreateForeignKeyParams): string {
  const { schemaName, tableName, foreignKey } = params;
  const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
  const qualifiedForeignTableName = buildQualifiedTableName(
    foreignKey.foreignTableSchema,
    foreignKey.foreignTableName
  );
  const safeConstraintName = buildSafeColumnName(foreignKey.name);
  const safeColumnName = buildSafeColumnName(foreignKey.columnName);
  const safeForeignColumnName = buildSafeColumnName(foreignKey.foreignColumnName);
  const onDelete = foreignKey.onDelete || 'NO ACTION';

  // PostgreSQL doesn't support ON UPDATE for foreign keys
  return `
    ALTER TABLE ${qualifiedTableName}
    ADD CONSTRAINT ${safeConstraintName}
    FOREIGN KEY (${safeColumnName})
    REFERENCES ${qualifiedForeignTableName} (${safeForeignColumnName})
    ON DELETE ${onDelete}
  `.trim();
}

/**
 * Build DROP FOREIGN KEY SQL statement
 * Note: This requires a database query to find the table name, so it's handled in the API route
 * This is just a placeholder for documentation
 */
export function buildDropForeignKeyQuery(params: DeleteForeignKeyParams & { tableName: string }): string {
  const { schemaName, constraintName, tableName } = params;
  const qualifiedTableName = buildQualifiedTableName(schemaName, tableName);
  const safeConstraintName = buildSafeColumnName(constraintName);
  return `ALTER TABLE ${qualifiedTableName} DROP CONSTRAINT ${safeConstraintName}`;
}

