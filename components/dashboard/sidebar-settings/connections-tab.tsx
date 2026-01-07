"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Upload, Warning, Database } from "@phosphor-icons/react";
import {
  exportConnectionDecrypted,
  importConnectionDecrypted,
  getAllConnections,
  deleteConnection,
} from "@/lib/db";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTranslation } from "@/contexts/translation-context";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import type { ConnectionMetadata } from "@/types/database";

interface ImportStatus {
  type: "success" | "error" | null;
  message: string;
}

export function ConnectionsTab() {
  const { t } = useTranslation();
  const { connectionId, password } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [connections, setConnections] = React.useState<ConnectionMetadata[]>([]);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importStatus, setImportStatus] = React.useState<ImportStatus>({
    type: null,
    message: "",
  });
  const [exportPassword, setExportPassword] = React.useState("");
  const [importPassword, setImportPassword] = React.useState("");
  const [showExportDialog, setShowExportDialog] = React.useState(false);
  const [showImportDialog, setShowImportDialog] = React.useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load connections
  React.useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const allConnections = await getAllConnections();
      setConnections(allConnections);
    } catch (error) {
      console.error("Failed to load connections:", error);
    }
  };

  const handleExport = async () => {
    if (!selectedConnectionId || !exportPassword) {
      setImportStatus({
        type: "error",
        message: t.sidebar.selectConnectionAndPassword,
      });
      return;
    }

    try {
      setIsExporting(true);
      const exported = await exportConnectionDecrypted(selectedConnectionId, exportPassword);

      // Create download
      const blob = new Blob([JSON.stringify(exported, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const connectionName =
        connections.find((c) => c.id === selectedConnectionId)?.name ||
        `connection-${selectedConnectionId.slice(-8)}`;
      a.download = `postadmin-connection-${connectionName}-${new Date()
        .toISOString()
        .split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setImportStatus({
        type: "success",
        message: t.sidebar.connectionExportedSuccessfully,
      });
      setShowExportDialog(false);
      setExportPassword("");
      setSelectedConnectionId(null);

      setTimeout(() => {
        setImportStatus({ type: null, message: "" });
      }, 3000);
    } catch (error) {
      setImportStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : t.sidebar.failedToExportConnection,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus({ type: null, message: "" });
      const text = await file.text();
      const exportedData = JSON.parse(text);

      // Validate structure
      if (
        !exportedData.connection ||
        !exportedData.connection.url ||
        !importPassword
      ) {
        setImportStatus({
          type: "error",
          message: t.sidebar.invalidExportFile,
        });
        return;
      }

      setIsImporting(true);
      const newConnectionId = await importConnectionDecrypted(
        exportedData,
        importPassword
      );

      setImportStatus({
        type: "success",
        message: t.sidebar.connectionImportedSuccessfully,
      });

      // Reload connections
      await loadConnections();

      // Reload the page to apply imported settings
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setImportStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : t.sidebar.failedToImportConnection,
      });
    } finally {
      setIsImporting(false);
      setShowImportDialog(false);
      setImportPassword("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.sidebar.confirmDeleteConnection)) {
      return;
    }

    try {
      await deleteConnection(id);
      await loadConnections();

      // If deleted connection was active, redirect to login
      if (id === connectionId) {
        router.push("/login");
      } else {
        queryClient.invalidateQueries();
      }
    } catch (error) {
      setImportStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : t.sidebar.failedToDeleteConnection,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium mb-1">{t.sidebar.exportConnection}</h3>
            <p className="text-xs text-muted-foreground">
              {t.sidebar.exportConnectionDescription}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium mb-1 block">
              {t.sidebar.selectConnection}
            </label>
            <select
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              value={selectedConnectionId || ""}
              onChange={(e) => setSelectedConnectionId(e.target.value)}
            >
              <option value="">{t.sidebar.selectConnectionPlaceholder}</option>
              {connections.map((conn) => (
                <option key={conn.id} value={conn.id}>
                  {conn.name || `${t.sidebar.connection} ${conn.id.slice(-8)}`}
                  {conn.id === connectionId ? t.sidebar.connectionActive : ""}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportDialog(true)}
            disabled={!selectedConnectionId || isExporting}
            className="w-full"
          >
            <Download className="size-3.5" />
            {isExporting ? t.sidebar.exporting : t.sidebar.exportConnection}
          </Button>
        </div>
      </div>

      <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium mb-1">{t.sidebar.importConnection}</h3>
            <p className="text-xs text-muted-foreground">
              {t.sidebar.importConnectionDescription}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImportDialog(true)}
          disabled={isImporting}
          className="w-full"
        >
          <Upload className="size-3.5" />
          {isImporting ? t.sidebar.importing : t.sidebar.importConnection}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium mb-1">{t.sidebar.manageConnections}</h3>
            <p className="text-xs text-muted-foreground">
              {t.sidebar.manageConnectionsDescription}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {connections.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {t.sidebar.noConnectionsFound}
            </p>
          ) : (
            connections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <div className="flex items-center gap-2">
                  <Database className="size-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">
                      {conn.name || `${t.sidebar.connection} ${conn.id.slice(-8)}`}
                    </div>
                    {conn.id === connectionId && (
                      <div className="text-xs text-muted-foreground">{t.sidebar.active}</div>
                    )}
                  </div>
                </div>
                {conn.id !== connectionId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(conn.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    {t.common.delete}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {importStatus.type && (
        <Alert
          variant={importStatus.type === "error" ? "destructive" : "default"}
        >
          <AlertTitle>
            {importStatus.type === "error" ? t.common.error : t.common.success}
          </AlertTitle>
          <AlertDescription>{importStatus.message}</AlertDescription>
        </Alert>
      )}

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.sidebar.exportConnectionDialogTitle}</DialogTitle>
            <DialogDescription>
              {t.sidebar.exportConnectionDialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Field>
              <FieldLabel htmlFor="export-password">{t.sidebar.exportPasswordLabel}</FieldLabel>
              <Input
                id="export-password"
                type="password"
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
                placeholder={t.sidebar.exportPasswordPlaceholder}
                autoFocus
              />
              <FieldDescription>
                {t.sidebar.exportPasswordDescription}
              </FieldDescription>
            </Field>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowExportDialog(false);
                setExportPassword("");
              }}
            >
              {t.common.cancel}
            </Button>
            <Button onClick={handleExport} disabled={!exportPassword || isExporting}>
              {isExporting ? t.sidebar.exporting : t.sidebar["export"]}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.sidebar.importConnectionDialogTitle}</DialogTitle>
            <DialogDescription>
              {t.sidebar.importConnectionDialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Field>
              <FieldLabel htmlFor="import-password">{t.sidebar.importPasswordLabel}</FieldLabel>
              <Input
                id="import-password"
                type="password"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                placeholder={t.sidebar.importPasswordPlaceholder}
                autoFocus
              />
              <FieldDescription>
                {t.sidebar.importPasswordDescription}
              </FieldDescription>
            </Field>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setImportPassword("");
              }}
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={!importPassword || isImporting}
            >
              {isImporting ? t.sidebar.importing : t.sidebar.selectFile}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

