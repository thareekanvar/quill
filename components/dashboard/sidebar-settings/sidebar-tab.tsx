"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { SortableTableItem } from "../sidebar"
import { sortTablesByPreference, getTableKey } from "@/lib/helpers/table-helpers"
import { useSidebarPreferencesStore } from "@/lib/stores/sidebar-preferences-store"
import { useSidebarStore } from "@/lib/stores/sidebar-store"
import { useTranslation } from "@/contexts/translation-context"

export function SidebarTab() {
  const { t } = useTranslation()
  const { tables } = useSidebarStore()
  const {
    preferences,
    reorderTables,
  } = useSidebarPreferencesStore()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // In settings, show ALL tables regardless of visibility so users can toggle them back on
  const sortedTables = React.useMemo(() => {
    return sortTablesByPreference(tables, preferences)
  }, [tables, preferences])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sortedTables.findIndex(
        (t) => getTableKey(t.tableName, t.schemaName) === active.id
      )
      const newIndex = sortedTables.findIndex(
        (t) => getTableKey(t.tableName, t.schemaName) === over.id
      )

      const newOrder = arrayMove(sortedTables, oldIndex, newIndex)
      const orderedKeys = newOrder.map((t) =>
        getTableKey(t.tableName, t.schemaName)
      )
      reorderTables(orderedKeys)
    }
  }

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">{t.sidebar.tablePreferences}</h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedTables.map((t) =>
            getTableKey(t.tableName, t.schemaName)
          )}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sortedTables.map((table) => {
              const key = getTableKey(table.tableName, table.schemaName)
              const preference = preferences[key]
              return (
                <SortableTableItem
                  key={key}
                  table={table}
                  preference={preference}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

