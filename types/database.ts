/**
 * Database-related type definitions
 */

export interface PostgresConnection {
  id: string;
  name?: string; // Optional display name for the connection
  encryptedUrl: string;
  encryptedPassword: string;
  passwordHash: string;
  createdAt: number;
}

export interface DecryptedConnection {
  url: string;
  password: string;
}

export interface ConnectionMetadata {
  id: string;
  name?: string;
  createdAt: number;
}

