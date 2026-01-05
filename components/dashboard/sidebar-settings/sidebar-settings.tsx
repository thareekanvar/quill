"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSidebarPreferencesStore } from "@/lib/stores/sidebar-preferences-store";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useTranslation } from "@/contexts/translation-context";
import { SidebarTab } from "./sidebar-tab";
import { BackupTab } from "./backup-tab";
import { ConnectionsTab } from "./connections-tab";

interface SidebarSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SidebarSettings({ open, onOpenChange }: SidebarSettingsProps) {
  const { t } = useTranslation();
  const { tables } = useSidebarStore();
  const { initializePreferences } = useSidebarPreferencesStore();
  const [defaultTab, setDefaultTab] = React.useState("sidebar");

  React.useEffect(() => {
    if (open && tables.length > 0) {
      initializePreferences(tables);
    }
  }, [open, tables, initializePreferences]);

  // Listen for tab change requests
  React.useEffect(() => {
    const handleOpenSettings = (event: CustomEvent<{ tab?: string }>) => {
      if (event.detail?.tab) {
        setDefaultTab(event.detail.tab);
      }
    };

    window.addEventListener(
      "open-settings",
      handleOpenSettings as EventListener
    );
    return () => {
      window.removeEventListener(
        "open-settings",
        handleOpenSettings as EventListener
      );
    };
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-0">
          <SheetTitle>{t.sidebar.settings}</SheetTitle>
          <SheetDescription>{t.sidebar.settingsDescription}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 p-4 pt-0">
          <Tabs
            defaultValue={defaultTab}
            value={defaultTab}
            onValueChange={setDefaultTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sidebar">{t.sidebar.sidebarTab}</TabsTrigger>
              <TabsTrigger value="backup">{t.sidebar.backupTab}</TabsTrigger>
              <TabsTrigger value="connections">{t.sidebar.connectionsTab}</TabsTrigger>
            </TabsList>

            <TabsContent value="sidebar" className="mt-4">
              <SidebarTab />
            </TabsContent>

            <TabsContent value="backup" className="mt-4">
              <BackupTab />
            </TabsContent>

            <TabsContent value="connections" className="mt-4">
              <ConnectionsTab />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
