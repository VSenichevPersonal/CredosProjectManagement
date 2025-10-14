"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Columns } from "lucide-react"
import type { ColumnDefinition } from "@/types/table"

interface ColumnVisibilityToggleProps {
  columns: ColumnDefinition[]
  visibleColumns: Set<string>
  onChange: (columnId: string, visible: boolean) => void
}

export function ColumnVisibilityToggle({ columns, visibleColumns, onChange }: ColumnVisibilityToggleProps) {
  const visibleCount = visibleColumns.size
  const totalCount = columns.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <Columns className="h-4 w-4 mr-2" />
          Колонки
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
            {visibleCount}/{totalCount}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Видимые колонки</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-[300px] overflow-y-auto">
          {columns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={visibleColumns.has(column.id)}
              onCheckedChange={(checked) => onChange(column.id, !!checked)}
              onSelect={(e) => e.preventDefault()} // Prevent menu close on click
            >
              <span className="flex-1">{column.label}</span>
              {column.tooltip && (
                <span className="text-xs text-muted-foreground ml-2">ⓘ</span>
              )}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
        
        <DropdownMenuSeparator />
        
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => {
              // Reset to defaults
              columns.forEach((col) => {
                const shouldBeVisible = col.defaultVisible !== false
                onChange(col.id, shouldBeVisible)
              })
            }}
          >
            Сбросить по умолчанию
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

