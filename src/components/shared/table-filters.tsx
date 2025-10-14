"use client"

/**
 * @intent: Advanced filters component for UniversalDataTable
 * @llm-note: Supports multiple filter types with active filter chips
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// Calendar removed - using simple date input instead
import { Filter, X, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { FilterDefinition } from "@/types/table"

interface TableFiltersProps {
  filters: FilterDefinition[]
  activeFilters: Map<string, any>
  onFilterChange: (filterId: string, value: any) => void
  onClearAll: () => void
}

export function TableFilters({ filters, activeFilters, onFilterChange, onClearAll }: TableFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const activeCount = Array.from(activeFilters.values()).filter(v => v !== null && v !== undefined && v !== "").length

  if (filters.length === 0) return null

  return (
    <div className="space-y-3">
      {/* Filter Toggle Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-9"
        >
          <Filter className="h-4 w-4 mr-2" />
          Фильтры
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {activeCount}
            </Badge>
          )}
        </Button>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearAll} className="h-9">
            <X className="h-4 w-4 mr-2" />
            Очистить все
          </Button>
        )}
      </div>

      {/* Active Filters Chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from(activeFilters.entries()).map(([filterId, value]) => {
            if (value === null || value === undefined || value === "") return null
            
            const filter = filters.find(f => f.id === filterId)
            if (!filter) return null

            const displayValue = 
              filter.type === "select" 
                ? filter.options?.find(opt => opt.value === value)?.label || value
                : filter.type === "date"
                ? format(new Date(value), "dd.MM.yyyy", { locale: ru })
                : value

            return (
              <Badge
                key={filterId}
                variant="secondary"
                className="gap-1 pr-1"
              >
                <span className="text-xs">{filter.label}:</span>
                <span className="font-medium">{displayValue}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => onFilterChange(filterId, null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}

      {/* Filter Panel */}
      {isOpen && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filters.map((filter) => (
              <div key={filter.id} className="space-y-2">
                <Label htmlFor={filter.id} className="text-sm font-medium">
                  {filter.label}
                </Label>

                {filter.type === "select" && (
                  <Select
                    value={activeFilters.get(filter.id) || ""}
                    onValueChange={(value) => onFilterChange(filter.id, value || null)}
                  >
                    <SelectTrigger id={filter.id} className="h-9">
                      <SelectValue placeholder={`Все ${filter.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все</SelectItem>
                      {filter.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {filter.type === "multiselect" && (
                  <div className="text-xs text-muted-foreground">
                    Множественный выбор (в разработке)
                  </div>
                )}

                {filter.type === "date" && (
                  <Input
                    type="date"
                    value={activeFilters.get(filter.id) || ""}
                    onChange={(e) => onFilterChange(filter.id, e.target.value || null)}
                  />
                )}

                {filter.type === "daterange" && (
                  <div className="text-xs text-muted-foreground">
                    Диапазон дат (в разработке)
                  </div>
                )}

                {filter.type === "boolean" && (
                  <Select
                    value={activeFilters.get(filter.id)?.toString() || ""}
                    onValueChange={(value) => 
                      onFilterChange(filter.id, value === "" ? null : value === "true")
                    }
                  >
                    <SelectTrigger id={filter.id} className="h-9">
                      <SelectValue placeholder="Все" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все</SelectItem>
                      <SelectItem value="true">Да</SelectItem>
                      <SelectItem value="false">Нет</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

