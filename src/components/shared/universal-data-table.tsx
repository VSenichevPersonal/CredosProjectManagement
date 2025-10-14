"use client"

/**
 * @intent: Universal data table component with all standard features
 * @llm-note: Standardized table for all list pages - pagination, sorting, columns, import/export
 * @architecture: Reusable component following reference-book-pattern.md
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Search, 
  Plus, 
  MoreVertical, 
  ArrowUp, 
  ArrowDown, 
  ChevronsUpDown,
  LayoutGrid,
  LayoutList,
  Loader2
} from "lucide-react"
import type { UniversalDataTableProps, ColumnDefinition } from "@/types/table"
import { useTableState } from "@/hooks/use-table-state"
import { useResizableColumns } from "@/hooks/use-resizable-columns"
import { useColumnOrder } from "@/hooks/use-column-order"
import { TablePagination } from "./table-pagination"
import { ColumnVisibilityToggle } from "./column-visibility-toggle"
import { TableImportExportButtons } from "./table-import-export-buttons"
import { TableFilters } from "./table-filters"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function UniversalDataTable<T extends Record<string, any>>({
  // Basic
  title,
  description,
  icon: Icon = undefined,
  
  // Data
  data,
  columns,
  isLoading,
  
  // Search
  searchPlaceholder = "Поиск...",
  searchable = true,
  
  // Filters
  filters,
  renderFilters,
  
  // CRUD
  onAdd,
  addButtonLabel = "Создать",
  onEdit,
  onDelete,
  onRowClick,
  
  // Column visibility
  defaultVisibleColumns,
  hideColumnToggle = false,
  
  // Import/Export
  exportFilename = "data",
  onImport,
  canExport = true,
  canImport = false,
  
  // View mode
  allowViewToggle = false,
  defaultViewMode = "table",
  renderCard,
  
  // Server-side features
  serverSidePagination = false,
  totalItems: serverTotalItems,
  currentPage: serverCurrentPage,
  itemsPerPage: serverItemsPerPage,
  onPageChange: serverOnPageChange,
  onItemsPerPageChange: serverOnItemsPerPageChange,
  
  serverSideSorting = false,
  sortColumn: serverSortColumn,
  sortDirection: serverSortDirection,
  onSortChange,
  
  // State persistence
  storageKey,
  
  // Empty state
  emptyStateTitle = "Нет данных",
  emptyStateDescription = "Данные отсутствуют или не соответствуют фильтрам",
  emptyStateIcon: EmptyIcon = undefined,
  emptyStateAction,
  
  // Customization
  className,
  rowClassName,
  enableRowSelection = false,
  onSelectionChange,
}: UniversalDataTableProps<T>) {
  // Use table state hook for client-side features
  const tableState = useTableState({
    data,
    columns,
    storageKey,
    initialItemsPerPage: serverItemsPerPage || 20,
  })

  // Use resizable columns hook
  const resizableColumns = useResizableColumns({
    columns,
    storageKey: storageKey ? `${storageKey}-resize` : undefined,
  })

  // Determine if we're using server-side or client-side
  const isServerSide = serverSidePagination || serverSideSorting
  
  // Use server state or client state
  const currentPage = isServerSide ? (serverCurrentPage || 1) : tableState.currentPage
  const itemsPerPage = isServerSide ? (serverItemsPerPage || 20) : tableState.itemsPerPage
  const sortColumn = isServerSide ? serverSortColumn : tableState.sortColumn
  const sortDirection = isServerSide ? serverSortDirection : tableState.sortDirection
  
  const { items, totalItems, totalPages, startIndex, endIndex } = isServerSide
    ? {
        items: data,
        totalItems: serverTotalItems || data.length,
        totalPages: Math.ceil((serverTotalItems || data.length) / itemsPerPage),
        startIndex: (currentPage - 1) * itemsPerPage + 1,
        endIndex: Math.min(currentPage * itemsPerPage, serverTotalItems || data.length),
      }
    : tableState.processedData

  // Handlers
  const handleSort = (columnKey: string) => {
    if (isServerSide && onSortChange) {
      const newDirection = sortColumn === columnKey && sortDirection === "asc" ? "desc" : "asc"
      onSortChange(columnKey, newDirection)
    } else {
      tableState.handleSort(columnKey)
    }
  }

  const handlePageChange = (page: number) => {
    if (isServerSide && serverOnPageChange) {
      serverOnPageChange(page)
    } else {
      tableState.setCurrentPage(page)
    }
  }

  const handleItemsPerPageChange = (count: number) => {
    if (isServerSide && serverOnItemsPerPageChange) {
      serverOnItemsPerPageChange(count)
    } else {
      tableState.setItemsPerPage(count)
    }
  }

  const renderSortIcon = (columnKey: string) => {
    if (sortColumn === columnKey) {
      return sortDirection === "asc" ? (
        <ArrowUp className="ml-2 h-3 w-3" />
      ) : (
        <ArrowDown className="ml-2 h-3 w-3" />
      )
    }
    return <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
  }

  const viewMode = tableState.viewMode

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-6 w-6 text-primary" />}
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              {addButtonLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            {searchable && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={tableState.searchQuery}
                  onChange={(e) => tableState.setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
          {!hideColumnToggle && (
            <ColumnVisibilityToggle
              columns={columns}
              visibleColumns={tableState.visibleColumns}
              onChange={tableState.handleColumnVisibility}
            />
          )}
          
          {(canExport || canImport) && (
            <TableImportExportButtons
              data={items}
              filename={exportFilename}
              onImport={onImport}
              canExport={canExport}
              canImport={canImport}
            />
          )}
          
          {allowViewToggle && renderCard && (
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => tableState.setViewMode("table")}
                className="rounded-r-none"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => tableState.setViewMode("cards")}
                className="rounded-l-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          )}
          </div>
        </div>
        
        {/* Advanced Filters */}
        {filters && filters.length > 0 && (
          <TableFilters
            filters={filters}
            activeFilters={tableState.activeFilters}
            onFilterChange={tableState.setFilter}
            onClearAll={tableState.clearAllFilters}
          />
        )}
        
        {/* Custom Filters (legacy support) */}
        {renderFilters && renderFilters(tableState.activeFilters, tableState.setFilter)}
      </div>

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Загрузка данных...</p>
            </div>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              {/* EmptyIcon removed for simplicity */}
              <p className="text-lg font-medium">{emptyStateTitle}</p>
              <p className="text-sm mt-2">{emptyStateDescription}</p>
              {emptyStateAction && <div className="mt-4">{emptyStateAction}</div>}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "cards" && renderCard ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id}>{renderCard(item)}</div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns
                    .filter((col) => tableState.visibleColumns.has(col.id))
                    .map((column) => (
                      <TableHead
                        key={column.id}
                        className={cn(
                          column.sortable && "cursor-pointer select-none hover:bg-muted/50",
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right",
                          "relative"
                        )}
                        style={{ 
                          width: resizableColumns.getColumnWidth(column.id) || column.width, 
                          minWidth: column.minWidth 
                        }}
                        onClick={() => column.sortable && handleSort(column.key as string || column.id)}
                      >
                        <div className="flex items-center">
                          {column.label}
                          {column.sortable && renderSortIcon(column.key as string || column.id)}
                        </div>
                        
                        {/* Resize handle */}
                        <div
                          className={cn(
                            "absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50",
                            resizableColumns.resizingColumn === column.id && "bg-primary"
                          )}
                          onMouseDown={(e) => resizableColumns.handleMouseDown(column.id, e)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableHead>
                    ))}
                  {(onEdit || onDelete) && <TableHead className="text-right">Действия</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      onRowClick && "cursor-pointer hover:bg-muted/50",
                      rowClassName && rowClassName(row)
                    )}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {columns
                      .filter((col) => tableState.visibleColumns.has(col.id))
                      .map((column) => {
                        const value = column.key ? row[column.key as string] : row[column.id]
                        return (
                          <TableCell
                            key={column.id}
                            className={cn(
                              column.align === "center" && "text-center",
                              column.align === "right" && "text-right"
                            )}
                          >
                            {column.render ? column.render(value, row) : value}
                          </TableCell>
                        )
                      })}
                    
                    {(onEdit || onDelete) && (
                      <TableCell 
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(row)}>
                                Редактировать
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem 
                                onClick={() => onDelete(row)}
                                className="text-destructive focus:text-destructive"
                              >
                                Удалить
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  )
}

