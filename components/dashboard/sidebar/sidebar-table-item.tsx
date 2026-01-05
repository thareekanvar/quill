"use client"

import * as React from "react"
import type { TableInfo, TablePreference } from "@/types"
import { getIconComponent } from "@/lib/utils/icon-loader"
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface SidebarTableItemProps {
  table: TableInfo
  preference?: TablePreference
  isActive: boolean
  onClick: () => void
}

export function SidebarTableItem({
  table,
  preference,
  isActive,
  onClick,
}: SidebarTableItemProps) {
  const fullTableName = `${table.schemaName}.${table.tableName}`
  const displayName = preference?.customName || table.tableName
  const IconComponent = getIconComponent(preference?.iconName)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={fullTableName}
        isActive={isActive}
        onClick={onClick}
      >
        <IconComponent className="size-4" />
        <span className="truncate">{displayName}</span>
        {table.schemaName !== "public" && (
          <span className="text-xs text-muted-foreground ml-1">
            ({table.schemaName})
          </span>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

