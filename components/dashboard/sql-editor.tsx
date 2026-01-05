"use client";

import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { autocompletion } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { useTheme } from "next-themes";
import { useTables } from "@/hooks/use-postgres-query";
import { useTableSchemaStore } from "@/lib/stores/table-schema-store";
import { Button } from "@/components/ui/button";
import { TextAlignLeft, Copy, Check } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useState } from "react";

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  tables?: Array<{ tableName: string; schemaName: string }>;
  className?: string;
  readOnly?: boolean;
}

/**
 * Format SQL query using basic formatting rules
 */
function formatSQL(query: string): string {
  // Basic SQL formatting
  let formatted = query.trim();
  
  // Add newlines after major keywords
  formatted = formatted.replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|GROUP BY|ORDER BY|HAVING|UNION|INSERT INTO|UPDATE|DELETE FROM)\b/gi, '\n$1');
  
  // Add newlines before AND/OR in WHERE clauses
  formatted = formatted.replace(/\b(AND|OR)\b/gi, '\n  $1');
  
  // Add spaces around operators
  formatted = formatted.replace(/([=<>!]+)/g, ' $1 ');
  
  // Clean up multiple newlines
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Indent clauses
  const lines = formatted.split('\n');
  let indentLevel = 0;
  const indented = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    
    // Decrease indent for closing keywords
    if (trimmed.match(/^(FROM|WHERE|GROUP BY|ORDER BY|HAVING)/i)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    const indentedLine = '  '.repeat(indentLevel) + trimmed;
    
    // Increase indent for opening keywords
    if (trimmed.match(/^(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|GROUP BY|ORDER BY|HAVING)/i)) {
      indentLevel++;
    }
    
    return indentedLine;
  });
  
  return indented.join('\n').trim();
}

export function SQLEditor({
  value,
  onChange,
  placeholder = "Enter SQL query...",
  height = "200px",
  tables: providedTables,
  className = "",
  readOnly = false,
}: SQLEditorProps) {
  const { theme, resolvedTheme } = useTheme();
  const { data: tablesData } = useTables();
  const { getSchema } = useTableSchemaStore();
  const [copied, setCopied] = useState(false);
  
  // Use resolvedTheme to handle system theme preference
  const isDark = resolvedTheme === "dark" || theme === "dark";

  // Use provided tables or fetch from hook
  const tables = providedTables || tablesData?.tables || [];

  // Build autocomplete suggestions from tables and columns
  const autocompleteOptions = useMemo(() => {
    const suggestions: Array<{ label: string; type: string; info?: string }> = [];

    // Add SQL keywords
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
      'ON', 'AS', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'ILIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL',
      'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT', 'COUNT', 'SUM', 'AVG',
      'MAX', 'MIN', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TRUNCATE',
      'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT'
    ];

    keywords.forEach(keyword => {
      suggestions.push({
        label: keyword,
        type: 'keyword',
        info: 'SQL keyword',
      });
    });

    // Add table names
    tables.forEach(table => {
      const tableName = table.schemaName === 'public' 
        ? `"${table.tableName}"` 
        : `"${table.schemaName}"."${table.tableName}"`;
      suggestions.push({
        label: tableName,
        type: 'table',
        info: `Table: ${table.schemaName}.${table.tableName}`,
      });
    });

    // Add column names from known schemas
    tables.forEach(table => {
      const schema = getSchema(table.tableName, table.schemaName);
      if (schema && schema.length > 0) {
        schema.forEach(column => {
          const tableName = table.schemaName === 'public' 
            ? `"${table.tableName}"` 
            : `"${table.schemaName}"."${table.tableName}"`;
          suggestions.push({
            label: `${tableName}."${column.columnName}"`,
            type: 'column',
            info: `Column: ${column.columnName} (${column.dataType})`,
          });
        });
      }
    });

    return suggestions;
  }, [tables, getSchema]);

  // Custom autocomplete function - memoized to prevent recreation
  const customAutocomplete = useMemo(
    () =>
      autocompletion({
        override: [
          (context) => {
            const word = context.matchBefore(/[\w."]*/);
            if (!word) return null;

            const query = word.text.toLowerCase();
            if (query.length < 1) return null;

            const matches = autocompleteOptions.filter(
              (option) =>
                option.label.toLowerCase().includes(query) ||
                option.label.toLowerCase().startsWith(query)
            );

            if (matches.length === 0) return null;

            return {
              from: word.from,
              options: matches.slice(0, 50).map((match) => ({
                label: match.label,
                type: match.type,
                info: match.info,
              })),
            };
          },
        ],
      }),
    [autocompleteOptions]
  );

  // Memoize extensions array to prevent recreation and version conflicts
  const extensions = useMemo(() => {
    const baseExtensions: any[] = [
      sql({ dialect: PostgreSQL }),
      customAutocomplete,
      EditorView.lineWrapping,
    ];

    // Apply dark theme if dark mode is active
    if (isDark) {
      baseExtensions.push(oneDark);
    }

    return baseExtensions;
  }, [customAutocomplete, isDark]);

  const handleFormat = () => {
    try {
      const formatted = formatSQL(value);
      onChange(formatted);
      toast.success("Query formatted successfully");
    } catch (error) {
      toast.error("Failed to format query");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Query copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy query");
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted-foreground">SQL Editor</div>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleFormat}
            className="h-7 px-2"
            disabled={!value || readOnly}
            title="Format SQL"
          >
            <TextAlignLeft className="size-3.5 mr-1" />
            Format
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2"
            disabled={!value}
            title="Copy query"
          >
            {copied ? (
              <Check className="size-3.5 mr-1" />
            ) : (
              <Copy className="size-3.5 mr-1" />
            )}
            Copy
          </Button>
        </div>
      </div>
      <div className="border border-border rounded-lg overflow-hidden bg-background">
        <CodeMirror
          value={value}
          height={height}
          extensions={extensions}
          onChange={onChange}
          placeholder={placeholder}
          editable={!readOnly}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightSelectionMatches: true,
          }}
        />
      </div>
    </div>
  );
}

