"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SQLEditor } from "@/components/dashboard/sql-editor";
import { useTranslation } from "@/contexts/translation-context";
import type { QueryToSave } from "@/types/sql-console";

interface SaveQueryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queryToSave: QueryToSave | null;
  onSave: (name: string, query: QueryToSave) => void;
  onQueryChange?: (query: QueryToSave) => void;
}

export function SaveQueryDialog({
  open,
  onOpenChange,
  queryToSave,
  onSave,
  onQueryChange,
}: SaveQueryDialogProps) {
  const { t } = useTranslation();
  const [saveName, setSaveName] = useState("");
  const [editableQuery, setEditableQuery] = useState<QueryToSave | null>(null);

  useEffect(() => {
    if (open && queryToSave) {
      setSaveName("");
      setEditableQuery(queryToSave);
    }
  }, [open, queryToSave]);

  const handleSave = () => {
    if (!editableQuery || !saveName.trim()) {
      return;
    }
    onSave(saveName.trim(), editableQuery);
    setSaveName("");
    setEditableQuery(null);
  };

  const handleCancel = () => {
    setSaveName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.queryHistory.saveQuery}</DialogTitle>
          <DialogDescription>
            {t.queryHistory.saveQueryDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="query-name">
              {t.queryHistory.queryName}
            </Label>
            <Input
              id="query-name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={t.queryHistory.queryNamePlaceholder}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                }
              }}
            />
          </div>
          {editableQuery && (
            <div>
              <Label>{t.queryHistory.query}</Label>
              <SQLEditor
                value={editableQuery.query}
                onChange={(value) => {
                  setEditableQuery({ ...editableQuery, query: value });
                  if (onQueryChange) {
                    onQueryChange({ ...editableQuery, query: value });
                  }
                }}
                height="200px"
                readOnly={false}
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!saveName.trim() || !editableQuery}
            >
              {t.queryHistory.save}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

