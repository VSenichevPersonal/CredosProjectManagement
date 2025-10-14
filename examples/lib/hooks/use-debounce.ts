"use client"

import { useEffect, useState } from "react"

/**
 * Debounce hook для оптимизации поиска и фильтрации
 * @param value - значение для debounce
 * @param delay - задержка в миллисекундах (по умолчанию 500ms)
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
