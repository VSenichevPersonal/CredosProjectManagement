"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Settings2 } from "lucide-react"

export interface ColumnDefinition {
  id: string
  label: string
  defaultVisible?: boolean
}

interface ColumnVisibilityToggleProps {
  columns: ColumnDefinition[]
  visibleColumns: Set<string>
  onVisibilityChange: (columnId: string, visible: boolean) => void
}

export function ColumnVisibilityToggle({ columns, visibleColumns, onVisibilityChange }: ColumnVisibilityToggleProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Колонки
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-3">Видимые колонки</h4>
            <div className="space-y-2">
              {columns.map((column) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.id}
                    checked={visibleColumns.has(column.id)}
                    onCheckedChange={(checked) => onVisibilityChange(column.id, checked as boolean)}
                  />
                  <Label htmlFor={column.id} className="text-sm font-normal cursor-pointer">
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
