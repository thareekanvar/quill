"use client"

import * as React from "react"
import type { TableInfo, TablePreference } from "@/types"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { SidebarTableItem } from "./sidebar-table-item"
import { getSortedAndFilteredTables } from "@/lib/helpers/table-helpers"
import { useTranslation } from "@/contexts/translation-context"

interface SidebarTableListProps {
  tables: TableInfo[]
  preferences: Record<string, TablePreference>
  selectedTable: string | null
  isLoading: boolean
  onTableClick: (tableName: string, schemaName: string) => void
  getTablePreference: (tableName: string, schemaName: string) => TablePreference | undefined
}

export function SidebarTableList({
  tables,
  preferences,
  selectedTable,
  isLoading,
  onTableClick,
  getTablePreference,
}: SidebarTableListProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton disabled>
            <span className="text-sm text-muted-foreground">{t.sidebar.loadingTables}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (tables.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton disabled>
            <span className="text-sm text-muted-foreground">{t.sidebar.noTablesFound}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const visibleTables = getSortedAndFilteredTables(tables, preferences)

  if (visibleTables.length === 0 && tables.length > 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton disabled>
            <span className="text-sm text-muted-foreground">{t.sidebar.noVisibleTables}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      {visibleTables.map((table) => {
        const fullTableName = `${table.schemaName}.${table.tableName}`
        const isActive = selectedTable === fullTableName
        const preference = getTablePreference(table.tableName, table.schemaName)

        return (
          <SidebarTableItem
            key={fullTableName}
            table={table}
            preference={preference}
            isActive={isActive}
            onClick={() => onTableClick(table.tableName, table.schemaName)}
          />
        )
      })}
    </SidebarMenu>
  )
}

