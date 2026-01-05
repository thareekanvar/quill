"use client"

import * as React from "react"
import {
  Database,
  FileText,
  Folder,
  Package,
  SquaresFour,
  Archive,
  Circle,
  type Icon,
} from "@phosphor-icons/react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const AVAILABLE_ICONS = [
  { name: "Database", value: "Database", icon: Database },
  { name: "FileText", value: "FileText", icon: FileText },
  { name: "Folder", value: "Folder", icon: Folder },
  { name: "Package", value: "Package", icon: Package },
  { name: "SquaresFour", value: "SquaresFour", icon: SquaresFour },
  { name: "Archive", value: "Archive", icon: Archive },
  { name: "Circle", value: "Circle", icon: Circle },
] as const

interface TableIconSelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export function TableIconSelector({ value, onValueChange }: TableIconSelectorProps) {
  const selectedIconData = AVAILABLE_ICONS.find((icon) => icon.value === value)
  const IconComponent = selectedIconData?.icon || Database
  const displayName = selectedIconData?.name || "Database"

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[140px] h-7 text-xs">
        <IconComponent className="size-4 shrink-0" />
        <SelectValue placeholder={displayName}>
          {displayName}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {AVAILABLE_ICONS.map((icon) => (
          <SelectItem key={icon.value} value={icon.value}>
            <icon.icon className="size-4" />
            {icon.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

