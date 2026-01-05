"use client";

import * as React from "react";
import { X, CheckCircle, Warning } from "@phosphor-icons/react";
import { useTranslation } from "@/contexts/translation-context";
import { cn } from "@/lib/utils";
import { hasSettingsChangedSinceDownload } from "@/lib/utils/settings-export";

const BANNER_DISMISSED_KEY = "postadmin-settings-banner-dismissed";

export function SettingsBanner() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  React.useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (!dismissed) {
      // Show banner after a short delay for smooth animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsDismissed(true);
    }
  }, []);

  // Check for unsaved changes periodically and on download events
  React.useEffect(() => {
    const checkUnsavedChanges = async () => {
      const changed = await hasSettingsChangedSinceDownload();
      setHasUnsavedChanges(changed);
    };

    checkUnsavedChanges();
    // Check every 2 seconds for changes
    const interval = setInterval(checkUnsavedChanges, 2000);

    // Listen for download events to update immediately
    const handleDownload = () => {
      checkUnsavedChanges();
    };
    window.addEventListener('settings-downloaded', handleDownload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('settings-downloaded', handleDownload);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage
    localStorage.setItem(BANNER_DISMISSED_KEY, "true");
    // After animation completes, mark as dismissed
    setTimeout(() => {
      setIsDismissed(true);
    }, 300);
  };

  if (isDismissed && !hasUnsavedChanges) {
    return null;
  }

  // Show warning banner if there are unsaved changes
  if (hasUnsavedChanges) {
    return (
      <div
        className={cn(
          "relative overflow-hidden border-b border-amber-500/50 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-500/30 transition-all duration-300 ease-out",
          "opacity-100 translate-y-0"
        )}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Warning className="size-5 text-amber-600 dark:text-amber-400" weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                {t.sidebar.unsavedChangesWarningTitle}
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5">
                {t.sidebar.unsavedChangesWarningDescription}
              </p>
            </div>
            <button
              onClick={() => {
                // Dispatch custom event to open settings
                window.dispatchEvent(new CustomEvent('open-settings', { detail: { tab: 'backup' } }));
              }}
              className="flex-shrink-0 rounded-md px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors"
            >
              {t.sidebar.downloadNow}
            </button>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 rounded-md p-1.5 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              aria-label={t.common.close}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-red-500/5 animate-shimmer" />
      </div>
    );
  }

  // Show info banner if no unsaved changes
  return (
    <div
      className={cn(
        "relative overflow-hidden border-b bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 transition-all duration-300 ease-out",
        isVisible
          ? "opacity-100 translate-y-0 max-h-32"
          : "opacity-0 -translate-y-full max-h-0"
      )}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <CheckCircle className="size-5 text-green-600 dark:text-green-400" weight="fill" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {t.sidebar.autoExportBannerTitle}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.sidebar.autoExportBannerDescription}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label={t.common.close}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 animate-shimmer" />
    </div>
  );
}

