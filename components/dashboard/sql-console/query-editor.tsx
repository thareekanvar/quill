"use client";

import { SQLEditor } from "@/components/dashboard/sql-editor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Play, CircleNotch } from "@phosphor-icons/react";
import { useTranslation } from "@/contexts/translation-context";

interface QueryEditorProps {
  query: string;
  onQueryChange: (query: string) => void;
  onExecute: () => void;
  isLoading: boolean;
}

export function QueryEditor({
  query,
  onQueryChange,
  onExecute,
  isLoading,
}: QueryEditorProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t.queryHistory.queryEditorTitle}
        </CardTitle>
        <CardDescription>
          {t.queryHistory.queryEditorDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SQLEditor
          value={query}
          onChange={onQueryChange}
          placeholder="SELECT * FROM users LIMIT 10;"
          height="300px"
        />

        <div className="flex justify-end">
          <Button
            onClick={onExecute}
            disabled={isLoading || !query.trim()}
            size="lg"
          >
            {isLoading ? (
              <>
                <CircleNotch className="size-4 mr-2 animate-spin" />
                {t.queryHistory.executing}
              </>
            ) : (
              <>
                <Play className="size-4 mr-2" />
                {t.queryHistory.executeQuery}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

