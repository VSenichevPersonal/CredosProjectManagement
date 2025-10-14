/**
 * @intent: Hook for resizable table columns
 * @llm-note: Enables users to resize columns by dragging column borders
 */

import { useState, useCallback, useEffect, useRef } from "react"

interface UseResizableColumnsProps {
  columns: Array<{ id: string; width?: string }>
  storageKey?: string
  minColumnWidth?: number
  maxColumnWidth?: number
}

export function useResizableColumns({
  columns,
  storageKey,
  minColumnWidth = 80,
  maxColumnWidth = 600,
}: UseResizableColumnsProps) {
  // Load column widths from localStorage
  const [columnWidths, setColumnWidths] = useState<Map<string, number>>(() => {
    if (typeof window !== "undefined" && storageKey) {
      const saved = localStorage.getItem(`${storageKey}-column-widths`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return new Map(Object.entries(parsed))
        } catch (e) {
          console.error("[useResizableColumns] Failed to parse saved widths", e)
        }
      }
    }
    
    // Default widths from column definitions
    const defaultWidths = new Map<string, number>()
    columns.forEach(col => {
      if (col.width) {
        const width = parseInt(col.width)
        if (!isNaN(width)) {
          defaultWidths.set(col.id, width)
        }
      }
    })
    return defaultWidths
  })

  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  // Save to localStorage when widths change
  useEffect(() => {
    if (typeof window !== "undefined" && storageKey) {
      const obj = Object.fromEntries(columnWidths)
      localStorage.setItem(`${storageKey}-column-widths`, JSON.stringify(obj))
    }
  }, [columnWidths, storageKey])

  const handleMouseDown = useCallback((columnId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setResizingColumn(columnId)
    setStartX(e.clientX)
    setStartWidth(columnWidths.get(columnId) || 150)
  }, [columnWidths])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn) return

    const diff = e.clientX - startX
    const newWidth = Math.max(minColumnWidth, Math.min(maxColumnWidth, startWidth + diff))
    
    setColumnWidths(prev => {
      const next = new Map(prev)
      next.set(resizingColumn, newWidth)
      return next
    })
  }, [resizingColumn, startX, startWidth, minColumnWidth, maxColumnWidth])

  const handleMouseUp = useCallback(() => {
    setResizingColumn(null)
  }, [])

  // Attach global mouse listeners
  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [resizingColumn, handleMouseMove, handleMouseUp])

  const getColumnWidth = (columnId: string) => {
    return columnWidths.get(columnId)
  }

  const resetColumnWidths = () => {
    setColumnWidths(new Map())
  }

  return {
    columnWidths,
    resizingColumn,
    handleMouseDown,
    getColumnWidth,
    resetColumnWidths,
  }
}

