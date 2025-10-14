/**
 * @intent: Hook for managing table state (search, sort, pagination, columns)
 * @llm-note: Centralizes all table state logic for reusability
 */

import { useState, useMemo, useEffect } from "react"
import type { ColumnDefinition } from "@/types/table"

interface UseTableStateProps<T> {
  data: T[]
  columns: ColumnDefinition<T>[]
  storageKey?: string
  initialSort?: {
    column: string
    direction: "asc" | "desc"
  }
  initialItemsPerPage?: number
}

export function useTableState<T extends Record<string, any>>({
  data,
  columns,
  storageKey,
  initialSort,
  initialItemsPerPage = 20,
}: UseTableStateProps<T>) {
  // Search
  const [searchQuery, setSearchQuery] = useState("")

  // Sort
  const [sortColumn, setSortColumn] = useState<string | null>(initialSort?.column || null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(initialSort?.direction || "asc")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

  // Column visibility - load from localStorage
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    if (typeof window !== "undefined" && storageKey) {
      const saved = localStorage.getItem(`${storageKey}-columns`)
      if (saved) {
        try {
          return new Set(JSON.parse(saved))
        } catch (e) {
          console.error("[useTableState] Failed to parse saved columns", e)
        }
      }
    }
    // Default: all columns with defaultVisible !== false
    return new Set(columns.filter((col) => col.defaultVisible !== false).map((col) => col.id))
  })

  // View mode - load from localStorage
  const [viewMode, setViewMode] = useState<"table" | "cards">(() => {
    if (typeof window !== "undefined" && storageKey) {
      const saved = localStorage.getItem(`${storageKey}-view`)
      if (saved === "table" || saved === "cards") {
        return saved
      }
    }
    return "table"
  })

  // Filters
  const [activeFilters, setActiveFilters] = useState<Map<string, any>>(new Map())

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && storageKey) {
      localStorage.setItem(`${storageKey}-columns`, JSON.stringify(Array.from(visibleColumns)))
      localStorage.setItem(`${storageKey}-view`, viewMode)
    }
  }, [visibleColumns, viewMode, storageKey])

  // Process data: filter, sort, paginate
  const processedData = useMemo(() => {
    let result = [...data]

    // 1. Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((row) => {
        return Object.values(row).some((value) => {
          if (value === null || value === undefined) return false
          return String(value).toLowerCase().includes(query)
        })
      })
    }

    // 2. Apply filters
    activeFilters.forEach((value, filterId) => {
      if (value !== null && value !== undefined && value !== "") {
        result = result.filter((row) => {
          const rowValue = row[filterId]
          if (Array.isArray(value)) {
            return value.includes(rowValue)
          }
          return rowValue === value
        })
      }
    })

    // 3. Sort
    if (sortColumn) {
      result.sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]

        // Handle null/undefined
        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1

        // String comparison
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue, "ru")
            : bValue.localeCompare(aValue, "ru")
        }

        // Number/Date comparison
        const aNum = aValue instanceof Date ? aValue.getTime() : Number(aValue)
        const bNum = bValue instanceof Date ? bValue.getTime() : Number(bValue)

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === "asc" ? aNum - bNum : bNum - aNum
        }

        // Fallback to string
        return sortDirection === "asc"
          ? String(aValue).localeCompare(String(bValue), "ru")
          : String(bValue).localeCompare(String(aValue), "ru")
      })
    }

    // 4. Paginate
    const totalItems = result.length
    const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(totalItems / itemsPerPage)

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = itemsPerPage === -1 ? totalItems : startIndex + itemsPerPage
    const paginatedItems = result.slice(startIndex, endIndex)

    return {
      items: paginatedItems,
      totalItems,
      totalPages,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalItems),
    }
  }, [data, searchQuery, sortColumn, sortDirection, currentPage, itemsPerPage, activeFilters])

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeFilters])

  // Handlers
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleColumnVisibility = (columnId: string, visible: boolean) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (visible) {
        next.add(columnId)
      } else {
        next.delete(columnId)
      }
      return next
    })
  }

  const setFilter = (filterId: string, value: any) => {
    setActiveFilters((prev) => {
      const next = new Map(prev)
      next.set(filterId, value)
      return next
    })
  }

  const clearFilter = (filterId: string) => {
    setActiveFilters((prev) => {
      const next = new Map(prev)
      next.delete(filterId)
      return next
    })
  }

  const clearAllFilters = () => {
    setActiveFilters(new Map())
  }

  return {
    // State
    searchQuery,
    sortColumn,
    sortDirection,
    currentPage,
    itemsPerPage,
    visibleColumns,
    viewMode,
    activeFilters,

    // Setters
    setSearchQuery,
    setSortColumn,
    setSortDirection,
    setCurrentPage,
    setItemsPerPage,
    setVisibleColumns,
    setViewMode,
    setFilter,
    clearFilter,
    clearAllFilters,

    // Computed data
    processedData,

    // Helpers
    handleSort,
    handleColumnVisibility,
  }
}

