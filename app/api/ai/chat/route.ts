import { NextRequest } from "next/server";
import { google } from "@ai-sdk/google";
import { streamText, tool, convertToModelMessages, UIMessage } from "ai";
import { z } from "zod";
import { executeQuery } from "@/lib/postgres/client";
import {
  getSchemaContext,
  formatSchemaContext,
} from "@/lib/helpers/ai-schema-context";
import { isMutation } from "@/lib/helpers/query-helpers";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    // Check for Google AI API key
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "Google AI API key is not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY in your environment variables.",
        }),
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      messages,
      connectionString,
    }: { messages: UIMessage[]; connectionString?: string | null } = body;

    // Check if connectionString is missing, null, or empty string
    if (
      !connectionString ||
      connectionString === null ||
      connectionString === ""
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Connection string is required. Please connect to a database first.",
        }),
        { status: 400 }
      );
    }

    // Get schema context for the AI
    const schemaContext = await getSchemaContext(connectionString);
    const schemaDescription = formatSchemaContext(schemaContext);

    // Create system prompt with schema context
    const systemPrompt = `You are an AI assistant for a PostgreSQL database administration tool called Quill. 
Your role is to help users interact with their PostgreSQL database using natural language.

Database Schema:
${schemaDescription}

IMPORTANT RULES:
1. You can help users with ANY type of SQL query (SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, etc.)
2. For SELECT queries: Use the execute_sql tool to run them and return results
3. For mutation queries (INSERT, UPDATE, DELETE, etc.): Generate the SQL code and provide it to the user so they can run it manually in the SQL console
4. Always generate valid PostgreSQL queries
5. Use proper table and column names from the schema above
6. Use schema-qualified table names (schema.table) when needed
7. Be helpful and explain what the query does
8. Always validate the query against the schema before providing it
9. For mutation queries, warn users about the impact (e.g., "This will update X rows")

When the user asks a question:
- If it's a SELECT query: Use execute_sql tool to run it and return results
- If it's a mutation query: Generate the SQL code, explain what it does, and tell the user they can copy and run it in the SQL console
- Always validate queries against the schema before providing them`;

    // Define the execute_sql tool - executes SELECT queries, provides SQL for mutations
    const executeSQLTool = tool({
      description:
        "Execute a SELECT query on the database and return results. For SELECT queries, this will run the query. For mutation queries (INSERT, UPDATE, DELETE, etc.), this will return the SQL code for the user to run manually. ALWAYS provide the 'query' parameter with a valid SQL string.",
      parameters: z.object({
        query: z
          .string()
          .min(1, "Query cannot be empty")
          .describe(
            "The SQL query to execute (SELECT) or provide (mutations). REQUIRED: This parameter MUST be provided and cannot be empty."
          ),
        explanation: z
          .string()
          .optional()
          .describe("A brief explanation of what this query does"),
      }),
      // @ts-expect-error - AI SDK type inference issue with tool execute signature
      execute: async ({
        query,
        explanation = "",
      }: {
        query: string;
        explanation?: string;
      }) => {
        // Validate query parameter (Zod should validate, but handle edge cases)
        if (!query || typeof query !== "string" || query.trim().length === 0) {
          return {
            success: false,
            query: "",
            explanation: explanation || "",
            error: "Invalid query parameter. Query must be a non-empty string.",
            message:
              "Error: Invalid query parameter provided. The 'query' parameter is required and must be a non-empty SQL query string.",
          };
        }

        try {
          const trimmedQuery = query.trim().toUpperCase();

          // Check if it's a mutation - return SQL code for user to run manually
          if (isMutation(query)) {
            return {
              success: true,
              query,
              explanation: explanation || "",
              isMutation: true,
              message:
                "This is a mutation query. Please copy the SQL code below and run it in the SQL console to execute it.",
              instruction:
                "Copy the SQL query and run it in the SQL console to modify your database.",
            };
          }

          // Verify it's a SELECT query for execution
          if (!trimmedQuery.startsWith("SELECT")) {
            return {
              success: false,
              query,
              explanation: explanation || "",
              error: "Only SELECT queries can be executed automatically.",
              message:
                "I can only execute SELECT queries automatically. For other query types, please use the SQL console.",
            };
          }

          // Execute the SELECT query and return results
          const result = await executeQuery(connectionString, query);

          return {
            success: true,
            query,
            explanation: explanation || "",
            isMutation: false,
            data: Array.isArray(result) ? result : [],
            rowCount: Array.isArray(result) ? result.length : 0,
            message: `Query executed successfully. Found ${
              Array.isArray(result) ? result.length : 0
            } row(s).`,
          };
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to execute query";
          return {
            success: false,
            query,
            explanation: explanation || "",
            error: errorMessage,
            message: `Error: ${errorMessage}`,
          };
        }
      },
    });

    // Stream the AI response using latest Gemini 2.5 Flash model with thinking
    const result = await streamText({
      model: google("gemini-3-flash-preview"), // Latest stable Gemini model - fast and capable
      system: systemPrompt,
      messages: await convertToModelMessages(messages || []),
      tools: {
        execute_sql: executeSQLTool,
      },
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: 4096, // Enable thinking for better SQL query reasoning
            includeThoughts: false, // Don't include thoughts in response (keep it clean)
          },
        },
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process chat request";
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      { status: 500 }
    );
  }
}
