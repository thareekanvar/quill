"use client"

import * as React from "react"
import {
  DotsSixVertical,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import type { TableInfo, TablePreference } from "@/types"
import { useSidebarPreferencesStore } from "@/lib/stores/sidebar-preferences-store"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TableIconSelector } from "./table-icon-selector"
import { EditableTableName } from "./editable-table-name"

interface SortableTableItemProps {
  table: TableInfo
  preference?: TablePreference
}

export function SortableTableItem({
  table,
  preference,
}: SortableTableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${table.schemaName}.${table.tableName}` })

  const {
    setTableVisible,
    setTableCustomName,
    setTableIcon,
  } = useSidebarPreferencesStore()

  const [selectedIcon, setSelectedIcon] = React.useState(
    preference?.iconName || "Database"
  )

  React.useEffect(() => {
    if (preference?.iconName) {
      setSelectedIcon(preference.iconName)
    }
  }, [preference?.iconName])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleSaveName = (newName: string) => {
    setTableCustomName(table.tableName, table.schemaName, newName)
  }

  const handleCancelEdit = () => {
    // Reset handled by EditableTableName component
  }

  const handleIconChange = (iconName: string) => {
    setSelectedIcon(iconName)
    setTableIcon(table.tableName, table.schemaName, iconName)
  }

  const handleToggleVisibility = () => {
    const visible = preference?.visible ?? true
    setTableVisible(table.tableName, table.schemaName, !visible)
  }

  const visible = preference?.visible ?? true
  const displayName = preference?.customName || table.tableName

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg border bg-background ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <DotsSixVertical className="size-4" />
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleToggleVisibility}
        className="size-7"
      >
        {visible ? (
          <Eye className="size-4" />
        ) : (
          <EyeSlash className="size-4 text-muted-foreground" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <EditableTableName
          value={preference?.customName || ""}
          defaultValue={table.tableName}
          onSave={handleSaveName}
          onCancel={handleCancelEdit}
        />
        {table.schemaName !== "public" && (
          <p className="text-xs text-muted-foreground">{table.schemaName}</p>
        )}
      </div>

      <TableIconSelector
        value={selectedIcon}
        onValueChange={handleIconChange}
      />
    </div>
  )
}

