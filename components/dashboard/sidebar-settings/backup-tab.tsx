"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Upload, Warning } from "@phosphor-icons/react";
import {
  downloadSettings,
  importSettings,
  hasSettingsChangedSinceDownload,
} from "@/lib/utils/settings-export";
import { useTranslation } from "@/contexts/translation-context";
import { ImportStatusAlert } from "./import-status-alert";

interface ImportStatus {
  type: "success" | "error" | null;
  message: string;
}

export function BackupTab() {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = React.useState(false);
  const [importStatus, setImportStatus] = React.useState<ImportStatus>({
    type: null,
    message: "",
  });
  const [hasChanges, setHasChanges] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Check for changes on mount and periodically
  React.useEffect(() => {
    const checkChanges = async () => {
      const changed = await hasSettingsChangedSinceDownload();
      setHasChanges(changed);
    };

    checkChanges();
    // Check every 2 seconds for changes
    const interval = setInterval(checkChanges, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await downloadSettings();
      setHasChanges(false); // Reset change flag after download
      setImportStatus({
        type: "success",
        message: t.sidebar.settingsExportedSuccessfully,
      });
      // Clear success message after 3 seconds
      setTimeout(() => {
        setImportStatus({ type: null, message: "" });
      }, 3000);
    } catch (error) {
      setImportStatus({
        type: "error",
        message: t.sidebar.failedToExport.replace(
          "{error}",
          error instanceof Error ? error.message : t.sidebar.unknownError
        ),
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
      const result = await importSettings(file);

      if (result.success) {
        const importedItems = [
          result.imported.sidebarPreferences && t.sidebar.sidebarPreferences,
          result.imported.tableSchemas && t.sidebar.tableSchemas,
          result.imported.connections > 0 &&
            `${result.imported.connections} ${result.imported.connections === 1 ? 'connection' : 'connections'}`,
          result.imported.dashboards > 0 &&
            `${result.imported.dashboards} ${result.imported.dashboards === 1 ? 'dashboard' : 'dashboards'}`,
          result.imported.dashboardCards > 0 &&
            `${result.imported.dashboardCards} ${t.sidebar.dashboardCards}`,
          result.imported.dashboardCharts > 0 &&
            `${result.imported.dashboardCharts} ${t.sidebar.dashboardCharts}`,
        ].filter(Boolean);

        setImportStatus({
          type: "success",
          message: t.sidebar.settingsImportedSuccessfully.replace(
            "{items}",
            importedItems.join(", ")
          ),
        });

        // Reset change flag after successful import
        setHasChanges(false);

        // Reload the page to apply imported settings
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setImportStatus({
          type: "error",
          message: t.sidebar.importCompletedWithErrors.replace(
            "{errors}",
            result.errors.join("; ")
          ),
        });
      }
    } catch (error) {
      setImportStatus({
        type: "error",
        message: t.sidebar.failedToImport.replace(
          "{error}",
          error instanceof Error ? error.message : t.sidebar.unknownError
        ),
      });
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium mb-1">
            {t.sidebar.backupRestore}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t.sidebar.backupRestoreDescription}
          </p>
        </div>
      </div>

      {/* Warning alert if settings have changed */}
      {hasChanges && (
        <Alert
          variant="default"
          className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-500/30"
        >
          <Warning
            className="size-3.5 text-amber-600 dark:text-amber-400"
            weight="fill"
          />
          <div className="flex-1">
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              {t.sidebar.settingsChangedWarningTitle}
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200 mt-1">
              {t.sidebar.settingsChangedWarningDescription}
            </AlertDescription>
            <div className="mt-3">
              <Button
                variant="default"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Download className="size-3.5" />
                {isExporting ? t.sidebar.exporting : t.sidebar.downloadNow}
              </Button>
            </div>
          </div>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="flex-1"
        >
          <Download className="size-3.5" />
          {isExporting ? t.sidebar.exporting : t.sidebar.exportSettings}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          <Upload className="size-3.5" />
          {t.sidebar.importSettings}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          className="hidden"
        />
      </div>
      <ImportStatusAlert status={importStatus} />
    </div>
  );
}
