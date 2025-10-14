"use client"

import { type ReactNode, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LayoutGrid, List, Plus, Search } from "lucide-react"
import { ColumnVisibilityToggle, type ColumnDefinition } from "./column-visibility-toggle"

interface ReferenceBookLayoutProps {
  title: string
  description: string
  searchPlaceholder?: string
  onSearch: (query: string) => void
  onCreateClick?: () => void
  createButtonLabel?: string
  viewMode: "cards" | "table"
  onViewModeChange: (mode: "cards" | "table") => void
  filters?: ReactNode
  stats?: ReactNode
  children: ReactNode
  columns?: ColumnDefinition[]
  visibleColumns?: Set<string>
  onColumnVisibilityChange?: (columnId: string, visible: boolean) => void
}

export function ReferenceBookLayout({
  title,
  description,
  searchPlaceholder = "Поиск...",
  onSearch,
  onCreateClick,
  createButtonLabel = "Создать",
  viewMode,
  onViewModeChange,
  filters,
  stats,
  children,
  columns,
  visibleColumns,
  onColumnVisibilityChange,
}: ReferenceBookLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearch(value)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Additional filters */}
          {filters}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {viewMode === "table" && columns && visibleColumns && onColumnVisibilityChange && (
            <ColumnVisibilityToggle
              columns={columns}
              visibleColumns={visibleColumns}
              onVisibilityChange={onColumnVisibilityChange}
            />
          )}

          {/* View mode toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("cards")}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("table")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Create button */}
          {onCreateClick && (
            <Button onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              {createButtonLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats}

      {/* Content */}
      {children}
    </div>
  )
}
