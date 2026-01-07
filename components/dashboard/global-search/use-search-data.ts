import { useMemo } from "react";
import { Database, Terminal, Table } from "@phosphor-icons/react";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useTranslation } from "@/contexts/translation-context";
import type { SearchItem } from "./types";

export function useSearchData() {
  const { t } = useTranslation();
  const { tables } = useSidebarStore();

  // Base routes - memoized to prevent recreation on every render
  const baseRoutes = useMemo<Omit<SearchItem, "id">[]>(
    () => [
      {
        title: t.sidebar.dashboard,
        url: "/dashboard",
        icon: Database,
        category: "routes" as const,
        description: t.sidebar.globalSearchMainDashboard,
      },
      {
        title: t.sidebar.sqlConsole,
        url: "/dashboard/sql-console",
        icon: Terminal,
        category: "routes" as const,
        description: t.sidebar.globalSearchSQLConsole,
      },
      {
        title: t.sidebar.schemaManagement,
        url: "/dashboard/schema",
        icon: Table,
        category: "routes" as const,
        description: t.sidebar.globalSearchSchemaManagement,
      },
      {
        title: t.sidebar.globalSearchSavedQueries,
        url: "/dashboard/queries",
        icon: Terminal,
        category: "routes" as const,
        description: t.sidebar.globalSearchSavedQueries,
      },
    ],
    [
      t.sidebar.dashboard,
      t.sidebar.sqlConsole,
      t.sidebar.schemaManagement,
      t.sidebar.globalSearchQueries,
      t.sidebar.globalSearchMainDashboard,
      t.sidebar.globalSearchSQLConsole,
      t.sidebar.globalSearchSchemaManagement,
      t.sidebar.globalSearchSavedQueries,
      t.sidebar.globalSearchDatabaseTable,
    ]
  );

  // Generate table items - memoized
  const tableItems = useMemo<SearchItem[]>(
    () =>
      (tables || []).map((table) => ({
        id: `table-${table.schemaName}-${table.tableName}`,
        title: `${table.schemaName}.${table.tableName}`,
        url: `/dashboard/tables/${table.tableName}?schema=${table.schemaName}`,
        icon: Table,
        category: "tables" as const,
        description: t.sidebar.globalSearchDatabaseTable,
      })),
    [tables, t.sidebar.globalSearchDatabaseTable]
  );

  // Combine all items - memoized
  const allItems = useMemo<SearchItem[]>(
    () => [
      ...baseRoutes.map((route, index) => ({
        ...route,
        id: `route-${index}`,
      })),
      ...tableItems,
    ],
    [baseRoutes, tableItems]
  );

  return { allItems, baseRoutes, tableItems };
}

