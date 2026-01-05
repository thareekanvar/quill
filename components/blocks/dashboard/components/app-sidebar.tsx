"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  SquaresFour,
  Gear,
  Question,
  MagnifyingGlass,
  Terminal,
  Table,
} from "@phosphor-icons/react";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useTables } from "@/hooks/use-postgres-query";
import { useSidebarPreferencesStore } from "@/lib/stores/sidebar-preferences-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { NavMain } from "@/components/blocks/dashboard/components/nav-main";
import { NavSecondary } from "@/components/blocks/dashboard/components/nav-secondary";
import { NavUser } from "@/components/blocks/dashboard/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { SidebarSettings } from "@/components/dashboard/sidebar-settings";
import {
  SidebarTableList,
  SidebarTableHeader,
} from "@/components/dashboard/sidebar";
import { DatabaseSwitcher } from "@/components/dashboard/database-switcher";
import { GlobalSearchModal } from "@/components/dashboard/global-search";
import { useTranslation } from "@/contexts/translation-context";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const router = useRouter();
  // Call useTables to trigger initial fetch (effect runs automatically)
  useTables();
  const { setSelectedTable, selectedTable, tables, isLoading, refreshTables } = useSidebarStore();
  const { logout, connectionId, password } = useAuthStore();
  const { preferences, initializePreferences, getTablePreference } =
    useSidebarPreferencesStore();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    if (tables && tables.length > 0) {
      initializePreferences(tables);
    }
  }, [tables, initializePreferences]);

  // Listen for custom event to open settings
  React.useEffect(() => {
    const handleOpenSettings = () => {
      setSettingsOpen(true);
    };

    window.addEventListener('open-settings', handleOpenSettings as EventListener);
    return () => {
      window.removeEventListener('open-settings', handleOpenSettings as EventListener);
    };
  }, []);

  // Keyboard shortcut for global search (Ctrl+K / Cmd+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        // Prevent default browser behavior
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleTableClick = (tableName: string, schemaName: string) => {
    setSelectedTable(`${schemaName}.${tableName}`);
    router.push(`/dashboard/tables/${tableName}?schema=${schemaName}`);
  };

  const handleRefresh = async () => {
    if (connectionId && password) {
      try {
        const { getConnection } = await import("@/lib/db");
        const connection = await getConnection(connectionId, password);
        if (connection) {
          await refreshTables(connectionId, password, connection.url);
        }
      } catch (error) {
        console.error("Failed to refresh tables:", error);
      }
    }
  };

  const handleLogout = async () => {
    const { clearTables } = useSidebarStore.getState();
    clearTables();
    await logout();
    router.push("/login");
  };

  const handleDashboardClick = () => {
    setSelectedTable(null);
    router.push("/dashboard");
  };

  const handleSettingsClick = () => {
    setSettingsOpen(true);
  };

  const handleSQLConsoleClick = () => {
    setSelectedTable(null);
    router.push("/dashboard/sql-console");
  };

  const handleSchemaManagementClick = () => {
    setSelectedTable(null);
    router.push("/dashboard/schema");
  };

  const handleSearchClick = () => {
    setSearchOpen(true);
  };

  const navMain = [
    {
      title: t.sidebar.dashboard,
      url: "/dashboard",
      icon: Database,
      onClick: handleDashboardClick,
    },
    {
      title: t.sidebar.sqlConsole,
      url: "/dashboard/sql-console",
      icon: Terminal,
      onClick: handleSQLConsoleClick,
    },
    {
      title: t.sidebar.schemaManagement,
      url: "/dashboard/schema",
      icon: Table,
      onClick: handleSchemaManagementClick,
    },
  ];

  const navSecondary = [
    {
      title: t.sidebar.settings,
      url: "#",
      icon: Gear,
      onClick: handleSettingsClick,
    },
    {
      title: t.sidebar.getHelp,
      url: "#",
      icon: Question,
    },
    {
      title: t.sidebar.search,
      url: "#",
      icon: MagnifyingGlass,
      onClick: handleSearchClick,
    },
  ];

  const user = {
    name: t.sidebar.atlasUser,
    email: connectionId || "user@quill.com",
    avatar: "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <SquaresFour className="!size-5" />
                <span className="text-base font-semibold">Quill</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <DatabaseSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />

        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarTableHeader onRefresh={handleRefresh} />
            <SidebarTableList
              tables={tables || []}
              preferences={preferences}
              selectedTable={selectedTable}
              isLoading={isLoading}
              onTableClick={handleTableClick}
              getTablePreference={getTablePreference}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={handleLogout} />
      </SidebarFooter>
      <SidebarSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
      <GlobalSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </Sidebar>
  );
}
