import { z } from "zod";

/**
 * Schema for query execution parameters
 */
export const executeQuerySchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  params: z.array(z.unknown()).optional(),
  useTransaction: z.boolean().optional().default(false),
});

/**
 * Schema for saving a query
 */
export const saveQuerySchema = z.object({
  name: z.string().min(1, "Query name is required"),
  query: z.string().min(1, "Query cannot be empty"),
  params: z.array(z.unknown()).optional(),
});

/**
 * Schema for transaction operations
 */
export const transactionOperationSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  action: z.enum(["commit", "rollback"]),
});

/**
 * Type inference from schemas
 */
export type ExecuteQueryInput = z.infer<typeof executeQuerySchema>;
export type SaveQueryInput = z.infer<typeof saveQuerySchema>;
export type TransactionOperationInput = z.infer<
  typeof transactionOperationSchema
>;

