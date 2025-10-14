"use client"

/**
 * Export Button Component
 * 
 * Кнопка для экспорта данных в Excel через API
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExportButtonProps {
  endpoint: string
  filename: string
  label?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  params?: Record<string, string>
}

export function ExportButton({
  endpoint,
  filename,
  label = "Экспорт в Excel",
  variant = "outline",
  size = "default",
  params = {},
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Build URL with params
      const url = new URL(endpoint, window.location.origin)
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value)
      })

      console.log("[ExportButton] Exporting:", { endpoint, params })

      // Fetch file
      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }

      // Get blob
      const blob = await response.blob()

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      console.log("[ExportButton] Export completed")

      toast({
        title: "Экспорт завершён",
        description: `Файл ${filename} успешно загружен`,
      })
    } catch (error: any) {
      console.error("[ExportButton] Export error:", error)
      toast({
        title: "Ошибка экспорта",
        description: error.message || "Не удалось экспортировать данные",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Экспорт...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  )
}

