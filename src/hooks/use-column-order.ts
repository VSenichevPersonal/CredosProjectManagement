/**
 * @intent: Hook for managing column order with drag-and-drop
 * @llm-note: Allows users to reorder columns by dragging headers
 */

import { useState, useEffect } from "react"
import type { ColumnDefinition } from "@/types/table"

interface UseColumnOrderProps {
  columns: ColumnDefinition[]
  storageKey?: string
}

export function useColumnOrder({ columns, storageKey }: UseColumnOrderProps) {
  // Load column order from localStorage
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (typeof window !== "undefined" && storageKey) {
      const saved = localStorage.getItem(`${storageKey}-column-order`)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("[useColumnOrder] Failed to parse saved order", e)
        }
      }
    }
    // Default order
    return columns.map(col => col.id)
  })

  const [draggingColumn, setDraggingColumn] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  // Save to localStorage when order changes
  useEffect(() => {
    if (typeof window !== "undefined" && storageKey) {
      localStorage.setItem(`${storageKey}-column-order`, JSON.stringify(columnOrder))
    }
  }, [columnOrder, storageKey])

  const handleDragStart = (columnId: string, e: React.DragEvent) => {
    setDraggingColumn(columnId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (columnId: string, e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (targetColumnId: string, e: React.DragEvent) => {
    e.preventDefault()
    
    if (!draggingColumn || draggingColumn === targetColumnId) {
      setDraggingColumn(null)
      setDragOverColumn(null)
      return
    }

    const newOrder = [...columnOrder]
    const dragIndex = newOrder.indexOf(draggingColumn)
    const dropIndex = newOrder.indexOf(targetColumnId)

    // Remove from old position
    newOrder.splice(dragIndex, 1)
    // Insert at new position
    newOrder.splice(dropIndex, 0, draggingColumn)

    setColumnOrder(newOrder)
    setDraggingColumn(null)
    setDragOverColumn(null)
  }

  const handleDragEnd = () => {
    setDraggingColumn(null)
    setDragOverColumn(null)
  }

  // Get ordered columns
  const getOrderedColumns = () => {
    return columnOrder
      .map(id => columns.find(col => col.id === id))
      .filter(Boolean) as ColumnDefinition[]
  }

  const resetColumnOrder = () => {
    setColumnOrder(columns.map(col => col.id))
  }

  return {
    columnOrder,
    orderedColumns: getOrderedColumns(),
    draggingColumn,
    dragOverColumn,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    resetColumnOrder,
  }
}

