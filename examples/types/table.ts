/**
 * @intent: TypeScript types for Universal Data Table
 * @llm-note: Shared types for all table components
 */

import type { ReactNode } from "react"

/**
 * Column definition for table
 */
export interface ColumnDefinition<T = any> {
  id: string
  label: string
  key?: keyof T | string
  sortable?: boolean
  defaultVisible?: boolean
  width?: string
  minWidth?: string
  align?: "left" | "center" | "right"
  render?: (value: any, row: T) => ReactNode
  exportRender?: (value: any, row: T) => string
  tooltip?: string
}

/**
 * Pagination state
 */
export interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

/**
 * Sort state
 */
export interface SortState {
  column: string | null
  direction: "asc" | "desc"
}

/**
 * Filter definition
 */
export interface FilterDefinition {
  id: string
  label: string
  type: "select" | "multiselect" | "date" | "daterange" | "boolean"
  options?: Array<{ label: string; value: string }>
  defaultValue?: any
}

/**
 * Active filter
 */
export interface ActiveFilter {
  filterId: string
  label: string
  value: any
  displayValue: string
}

/**
 * Table state
 */
export interface TableState<T = any> {
  // Data
  items: T[]
  totalItems: number
  
  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
  
  // Sort
  sortColumn: string | null
  sortDirection: "asc" | "desc"
  setSortColumn: (column: string | null) => void
  setSortDirection: (direction: "asc" | "desc") => void
  handleSort: (column: string) => void
  
  // Pagination
  currentPage: number
  itemsPerPage: number
  totalPages: number
  setCurrentPage: (page: number) => void
  setItemsPerPage: (count: number) => void
  
  // Column visibility
  visibleColumns: Set<string>
  setVisibleColumns: (columns: Set<string>) => void
  handleColumnVisibility: (columnId: string, visible: boolean) => void
  
  // View mode
  viewMode: "table" | "cards"
  setViewMode: (mode: "table" | "cards") => void
  
  // Filters
  activeFilters: Map<string, any>
  setFilter: (filterId: string, value: any) => void
  clearFilter: (filterId: string) => void
  clearAllFilters: () => void
}

/**
 * Props for UniversalDataTable
 */
export interface UniversalDataTableProps<T = any> {
  // Basic
  title: string
  description?: string
  icon?: ReactNode
  
  // Data
  data: T[]
  columns: ColumnDefinition<T>[]
  isLoading?: boolean
  
  // Search
  searchPlaceholder?: string
  searchable?: boolean
  
  // Filters
  filters?: FilterDefinition[]
  renderFilters?: (activeFilters: Map<string, any>, setFilter: (id: string, value: any) => void) => ReactNode
  
  // CRUD
  onAdd?: () => void
  addButtonLabel?: string
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onRowClick?: (row: T) => void
  
  // Column visibility
  defaultVisibleColumns?: string[]
  hideColumnToggle?: boolean
  
  // Import/Export
  exportFilename?: string
  onImport?: (data: any[]) => Promise<void>
  canExport?: boolean
  canImport?: boolean
  
  // View mode
  allowViewToggle?: boolean
  defaultViewMode?: "table" | "cards"
  renderCard?: (item: T) => ReactNode
  
  // Pagination
  serverSidePagination?: boolean
  totalItems?: number
  currentPage?: number
  itemsPerPage?: number
  onPageChange?: (page: number) => void
  onItemsPerPageChange?: (count: number) => void
  
  // Sorting
  serverSideSorting?: boolean
  sortColumn?: string
  sortDirection?: "asc" | "desc"
  onSortChange?: (column: string, direction: "asc" | "desc") => void
  
  // State persistence
  storageKey?: string  // Key for localStorage persistence
  
  // Empty state
  emptyStateTitle?: string
  emptyStateDescription?: string
  emptyStateIcon?: ReactNode
  emptyStateAction?: ReactNode
  
  // Customization
  className?: string
  rowClassName?: (row: T) => string
  enableRowSelection?: boolean
  onSelectionChange?: (selectedRows: T[]) => void
}

