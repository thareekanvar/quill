"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTranslation } from "@/contexts/translation-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sparkle,
  PaperPlaneTilt,
  CircleNotch,
  Database,
  CheckCircle,
  XCircle,
  Copy,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useRef } from "react";
import { getConnection } from "@/lib/db";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

export function AIChatClient() {
  const { t } = useTranslation();
  const { connectionId, password } = useAuthStore();
  const [input, setInput] = useState("");
  const [connectionString, setConnectionString] = useState<string | null>(null);
  // Use ref to store connectionString so body function always has latest value
  const connectionStringRef = useRef<string | null>(null);

  // Decrypt connection on client side (where IndexedDB is available)
  useEffect(() => {
    const loadConnection = async () => {
      if (connectionId && password) {
        try {
          const connection = await getConnection(connectionId, password);
          if (connection) {
            setConnectionString(connection.url);
            connectionStringRef.current = connection.url;
          } else {
            setConnectionString(null);
            connectionStringRef.current = null;
          }
        } catch (error) {
          console.error("Failed to load connection:", error);
          setConnectionString(null);
          connectionStringRef.current = null;
        }
      } else {
        setConnectionString(null);
        connectionStringRef.current = null;
      }
    };

    loadConnection();
  }, [connectionId, password]);

  // Create transport with body function that always gets latest connectionString
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: "/api/ai/chat",
      body: () => {
        // This function is called at request time, so it always has the latest value
        const currentConnectionString = connectionStringRef.current;
        if (!currentConnectionString) {
          return {};
        }
        return {
          connectionString: currentConnectionString,
        };
      },
    });
  }, []); // Empty deps - ref ensures we always get latest value

  const {
    messages,
    sendMessage: originalSendMessage,
    status,
    error,
  } = useChat({
    transport,
    onError: (error) => {
      // Don't show error if it's just the connection string issue - we handle it in the form
      if (error.message?.includes("Connection string is required")) {
        return;
      }
      toast.error(error.message || t.aiChat.failedToSendMessage);
    },
  });

  // Wrapper to ensure we never send without connectionString
  const sendMessage = (message: { text: string }) => {
    const currentConnectionString = connectionStringRef.current;

    if (!currentConnectionString) {
      toast.error(t.aiChat.connectFirst);
      return;
    }
    originalSendMessage(message);
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-10rem)]">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkle className="size-8 text-primary" weight="fill" />
          {t.aiChat.title}
        </h1>
        <p className="text-muted-foreground mt-2">{t.aiChat.description}</p>
      </div>

      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden pb-0">
        <CardHeader>
          <CardTitle>{t.aiChat.chatTitle}</CardTitle>
          <CardDescription>{t.aiChat.chatDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <Conversation className="flex-1 overflow-y-auto min-h-0">
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState
                  title={t.aiChat.emptyStateTitle}
                  description={t.aiChat.emptyStateDescription}
                  icon={<Sparkle className="size-12 opacity-50" />}
                />
              ) : (
                <>
                  {messages.map((message, msgIndex) => {
                    // Get all parts from the message
                    const allParts = message.parts || [];

                    // Check if THIS message has a tool result (check both result and output properties)
                    const hasToolResultInThisMessage = allParts.some(
                      (p: any) =>
                        p.type === "tool-execute_sql" &&
                        (p.result !== undefined || p.output !== undefined)
                    );

                    // Check if ANY LATER message has a tool result (results come after calls)
                    const hasToolResultInLaterMessages = messages
                      .slice(msgIndex + 1)
                      .some((msg) => {
                        const parts = msg.parts || [];
                        return parts.some(
                          (p: any) =>
                            p.type === "tool-execute_sql" &&
                            (p.result !== undefined || p.output !== undefined)
                        );
                      });

                    // Fallback: if no parts, try to render message content directly
                    if (!allParts || allParts.length === 0) {
                      // Try to get text from message.content or message.text
                      const fallbackText =
                        (message as any).content || (message as any).text || "";
                      if (fallbackText) {
                        return (
                          <Message key={message.id} from={message.role}>
                            <MessageContent>
                              <MessageResponse>{fallbackText}</MessageResponse>
                            </MessageContent>
                          </Message>
                        );
                      }
                      // If no content at all, still render an empty message container
                      return (
                        <Message key={message.id} from={message.role}>
                          <MessageContent>
                            <div className="text-muted-foreground text-sm">
                              Empty message
                            </div>
                          </MessageContent>
                        </Message>
                      );
                    }

                    return (
                      <div key={message.id} className="space-y-3">
                        {/* Render all parts */}
                        {allParts.map((part: any, index: number) => {
                          // Text content
                          if (part.type === "text") {
                            return (
                              <Message
                                key={`${message.id}-text-${index}`}
                                from={message.role}
                              >
                                <MessageContent>
                                  <MessageResponse>{part.text}</MessageResponse>
                                </MessageContent>
                              </Message>
                            );
                          }

                          // Tool result - check both result and output properties
                          if (
                            part.type === "tool-execute_sql" &&
                            (part.result !== undefined ||
                              part.output !== undefined)
                          ) {
                            // Use output if available, otherwise use result
                            const result = (part.output || part.result) as any;
                            const isSuccess = result?.success !== false;
                            const isMutation = result?.isMutation === true;
                            const hasData =
                              result?.data &&
                              Array.isArray(result.data) &&
                              result.data.length > 0;

                            // Copy to clipboard function
                            const copyToClipboard = async () => {
                              if (result?.query) {
                                try {
                                  await navigator.clipboard.writeText(
                                    result.query
                                  );
                                  toast.success(
                                    "SQL query copied to clipboard!"
                                  );
                                } catch (err) {
                                  toast.error("Failed to copy to clipboard");
                                }
                              }
                            };

                            return (
                              <Message
                                key={`${message.id}-result-${index}`}
                                from="assistant"
                              >
                                <MessageContent>
                                  <div className="space-y-3">
                                    {/* Status header */}
                                    <div
                                      className={`flex items-center gap-2 p-3 rounded-lg border ${
                                        isMutation
                                          ? "bg-blue-500/10 border-blue-500/20"
                                          : isSuccess
                                          ? "bg-green-500/10 border-green-500/20"
                                          : "bg-destructive/10 border-destructive/20"
                                      }`}
                                    >
                                      {isMutation ? (
                                        <Database className="size-5 text-blue-500 flex-shrink-0" />
                                      ) : isSuccess ? (
                                        <CheckCircle className="size-5 text-green-500 flex-shrink-0" />
                                      ) : (
                                        <XCircle className="size-5 text-destructive flex-shrink-0" />
                                      )}
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">
                                          {isMutation
                                            ? "SQL Query Ready"
                                            : isSuccess
                                            ? t.aiChat.queryResult
                                            : t.aiChat.error}
                                        </div>
                                        {result?.message && (
                                          <div className="text-xs text-muted-foreground mt-1">
                                            {result.message}
                                          </div>
                                        )}
                                        {result?.instruction && (
                                          <div className="text-xs text-muted-foreground mt-1 italic">
                                            {result.instruction}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Query display with copy button for mutations */}
                                    {result?.query && (
                                      <div className="relative bg-background rounded-md border border-border/50 overflow-hidden">
                                        <div className="p-3 font-mono text-xs overflow-x-auto">
                                          <pre className="whitespace-pre-wrap break-words">
                                            {result.query}
                                          </pre>
                                        </div>
                                        {isMutation && (
                                          <div className="absolute top-2 right-2">
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              onClick={copyToClipboard}
                                              title="Copy SQL to clipboard"
                                            >
                                              <Copy className="size-4" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Data table */}
                                    {hasData && (
                                      <div className="rounded-lg border border-border overflow-hidden">
                                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                          <Table>
                                            <TableHeader className="sticky top-0 bg-muted/50 z-10">
                                              <TableRow>
                                                {Object.keys(
                                                  result.data[0]
                                                ).map((key) => (
                                                  <TableHead
                                                    key={key}
                                                    className="font-medium"
                                                  >
                                                    {key}
                                                  </TableHead>
                                                ))}
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {result.data
                                                .slice(0, 100)
                                                .map(
                                                  (
                                                    row: any,
                                                    rowIndex: number
                                                  ) => (
                                                    <TableRow key={rowIndex}>
                                                      {Object.keys(
                                                        result.data[0]
                                                      ).map((key) => {
                                                        const value = row[key];
                                                        return (
                                                          <TableCell
                                                            key={key}
                                                            className="max-w-xs"
                                                          >
                                                            <div
                                                              className="truncate"
                                                              title={String(
                                                                value ?? ""
                                                              )}
                                                            >
                                                              {value ===
                                                              null ? (
                                                                <span className="text-muted-foreground italic">
                                                                  NULL
                                                                </span>
                                                              ) : typeof value ===
                                                                "object" ? (
                                                                <span className="text-muted-foreground font-mono text-[10px]">
                                                                  {JSON.stringify(
                                                                    value
                                                                  )}
                                                                </span>
                                                              ) : (
                                                                String(value)
                                                              )}
                                                            </div>
                                                          </TableCell>
                                                        );
                                                      })}
                                                    </TableRow>
                                                  )
                                                )}
                                            </TableBody>
                                          </Table>
                                        </div>
                                        {result.data.length > 100 && (
                                          <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border bg-muted/30">
                                            Showing first 100 of{" "}
                                            {result.data.length} rows
                                          </div>
                                        )}
                                        {result.data.length <= 100 && (
                                          <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border bg-muted/30">
                                            {result.data.length} row
                                            {result.data.length !== 1
                                              ? "s"
                                              : ""}{" "}
                                            returned
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Empty result */}
                                    {isSuccess &&
                                      result?.data &&
                                      Array.isArray(result.data) &&
                                      result.data.length === 0 && (
                                        <div className="text-center py-6 text-sm text-muted-foreground border border-border rounded-lg bg-muted/30">
                                          No rows found.
                                        </div>
                                      )}

                                    {/* Error message */}
                                    {result?.error && (
                                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                        <div className="text-sm text-destructive font-medium">
                                          {t.aiChat.error}
                                        </div>
                                        <div className="text-xs text-destructive/80 mt-1">
                                          {result.error}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </MessageContent>
                              </Message>
                            );
                          }

                          // Skip step-start parts
                          if (part.type === "step-start") {
                            return null;
                          }

                          // Tool call - show loading state (no result or output yet)
                          if (
                            part.type === "tool-execute_sql" &&
                            part.result === undefined &&
                            part.output === undefined
                          ) {
                            // Don't show loading if this message already has a result
                            if (hasToolResultInThisMessage) {
                              return null;
                            }

                            // Don't show loading if any later message has a result (tool is done)
                            if (hasToolResultInLaterMessages) {
                              return null;
                            }

                            // Only show loading if we're actively streaming
                            if (
                              status !== "submitted" &&
                              status !== "streaming"
                            ) {
                              return null;
                            }

                            const args = part.args || {};
                            return (
                              <Message
                                key={`${message.id}-tool-call-${index}`}
                                from="assistant"
                              >
                                <MessageContent>
                                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                                    <CircleNotch className="size-5 animate-spin text-primary mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm mb-2 flex items-center gap-2">
                                        <Database className="size-4" />
                                        {t.aiChat.executingQuery}
                                      </div>
                                      {args.query && (
                                        <div className="bg-background rounded-md p-3 font-mono text-xs overflow-x-auto border border-border/50">
                                          <pre className="whitespace-pre-wrap break-words">
                                            {args.query}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </MessageContent>
                              </Message>
                            );
                          }

                          return null;
                        })}
                      </div>
                    );
                  })}
                </>
              )}

              {(status === "submitted" || status === "streaming") && (
                <Message from="assistant">
                  <MessageContent>
                    <div className="flex items-center gap-2">
                      <CircleNotch className="size-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        {t.aiChat.thinking}
                      </span>
                    </div>
                  </MessageContent>
                </Message>
              )}

              {error && (
                <Message from="assistant">
                  <MessageContent>
                    <div className="rounded-lg px-4 py-2 bg-destructive/10 text-destructive text-sm">
                      {t.aiChat.error}:{" "}
                      {error.message || t.aiChat.somethingWentWrong}
                    </div>
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim() && status === "ready" && connectionString) {
                sendMessage({ text: input });
                setInput("");
              } else if (!connectionString) {
                toast.error(t.aiChat.connectFirst);
              }
            }}
            className="p-4 border-t flex-shrink-0 bg-background"
          >
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.aiChat.placeholder}
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (
                      input.trim() &&
                      status === "ready" &&
                      connectionString
                    ) {
                      sendMessage({ text: input });
                      setInput("");
                    } else if (!connectionString) {
                      toast.error(t.aiChat.connectFirst);
                    }
                  }
                }}
                disabled={status !== "ready" || !connectionString}
              />
              <Button
                type="submit"
                disabled={
                  status !== "ready" || !input.trim() || !connectionString
                }
                size="icon"
                className="h-[60px] w-[60px]"
              >
                {status === "submitted" || status === "streaming" ? (
                  <CircleNotch className="size-5 animate-spin" />
                ) : (
                  <PaperPlaneTilt className="size-5" />
                )}
              </Button>
            </div>
            {!connectionString && (
              <p className="text-xs text-muted-foreground mt-2">
                {t.aiChat.connectFirst}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
