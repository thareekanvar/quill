/**
 * Detects if a SQL query is a write operation (modifies data)
 * @param query - The SQL query string
 * @returns true if the query modifies data, false if it's a read-only query
 */
export function isWriteOperation(query: string): boolean {
  if (!query || typeof query !== "string") {
    return false;
  }

  // Remove comments and normalize whitespace
  const normalizedQuery = query
    .replace(/--.*$/gm, "") // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
    .trim()
    .toUpperCase();

  // Check for write operation keywords at the start of the query
  // This matches keywords that appear at the beginning (after any WITH clauses)
  const writeKeywords = [
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "TRUNCATE",
    "CREATE",
    "REPLACE",
    "MERGE",
    "GRANT",
    "REVOKE",
  ];

  // Check if query starts with a write keyword
  for (const keyword of writeKeywords) {
    // Match keyword at start or after WITH clause
    const pattern = new RegExp(`^(WITH[\\s\\S]*?)?\\s*${keyword}\\s+`, "i");
    if (pattern.test(normalizedQuery)) {
      return true;
    }
  }

  return false;
}

/**
 * Gets the operation type from a SQL query
 * @param query - The SQL query string
 * @returns The operation type (SELECT, INSERT, UPDATE, DELETE, etc.)
 */
export function getQueryOperationType(query: string): string {
  if (!query || typeof query !== "string") {
    return "UNKNOWN";
  }

  const normalizedQuery = query
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim()
    .toUpperCase();

  const operations = [
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "TRUNCATE",
    "CREATE",
    "REPLACE",
    "MERGE",
    "GRANT",
    "REVOKE",
  ];

  for (const op of operations) {
    const pattern = new RegExp(`^(WITH[\\s\\S]*?)?\\s*${op}\\s+`, "i");
    if (pattern.test(normalizedQuery)) {
      return op;
    }
  }

  return "UNKNOWN";
}

