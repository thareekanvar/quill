"use client"

import * as React from "react"
import { X, Check } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface EditableTableNameProps {
  value: string
  defaultValue: string
  onSave: (value: string) => void
  onCancel: () => void
}

export function EditableTableName({
  value,
  defaultValue,
  onSave,
  onCancel,
}: EditableTableNameProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState(value)

  React.useEffect(() => {
    setEditValue(value)
  }, [value])

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditValue(value)
  }

  const handleSave = () => {
    onSave(editValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
    onCancel()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm"
          autoFocus
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleSave}
          className="size-7"
        >
          <Check className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCancel}
          className="size-7"
        >
          <X className="size-3" />
        </Button>
      </div>
    )
  }

  return (
    <button
      onClick={handleStartEdit}
      className="text-left text-sm font-medium hover:text-primary w-full truncate"
    >
      {value || defaultValue}
    </button>
  )
}

