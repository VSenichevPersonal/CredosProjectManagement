"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Upload, Clipboard } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface TableImportExportButtonsProps {
  data: any[]
  filename: string
  onImport?: (data: any[]) => Promise<void>
  canExport?: boolean
  canImport?: boolean
}

export function TableImportExportButtons({
  data,
  filename,
  onImport,
  canExport = true,
  canImport = true,
}: TableImportExportButtonsProps) {
  const [isImporting, setIsImporting] = useState(false)
  const { toast } = useToast()

  const handleExportExcel = async () => {
    try {
      // Convert data to CSV format
      if (data.length === 0) {
        toast({
          title: "Нет данных",
          description: "Нет данных для экспорта",
          variant: "destructive",
        })
        return
      }

      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(","),
        ...data.map((row) => headers.map((header) => JSON.stringify(row[header] ?? "")).join(",")),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`
      link.click()

      toast({
        title: "Экспорт завершен",
        description: `Файл ${link.download} загружен`,
      })
    } catch (error) {
      console.error("[v0] Export error:", error)
      toast({
        title: "Ошибка экспорта",
        description: error instanceof Error ? error.message : "Не удалось экспортировать данные",
        variant: "destructive",
      })
    }
  }

  const handleImportExcel = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".csv,.xlsx,.xls"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !onImport) return

      try {
        setIsImporting(true)
        const text = await file.text()
        const lines = text.split("\n")
        const headers = lines[0].split(",")
        const importedData = lines.slice(1).map((line) => {
          const values = line.split(",")
          return headers.reduce((obj, header, index) => {
            obj[header.trim()] = values[index]?.trim()
            return obj
          }, {} as any)
        })

        await onImport(importedData)
        toast({
          title: "Импорт завершен",
          description: `Импортировано ${importedData.length} записей`,
        })
      } catch (error) {
        console.error("[v0] Import error:", error)
        toast({
          title: "Ошибка импорта",
          description: error instanceof Error ? error.message : "Не удалось импортировать данные",
          variant: "destructive",
        })
      } finally {
        setIsImporting(false)
      }
    }
    input.click()
  }

  const handleImportFromClipboard = async () => {
    try {
      setIsImporting(true)
      const text = await navigator.clipboard.readText()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length === 0) {
        toast({
          title: "Буфер обмена пуст",
          description: "Скопируйте таблицу в буфер обмена",
          variant: "destructive",
        })
        return
      }

      // Parse tab-separated or comma-separated values
      const separator = lines[0].includes("\t") ? "\t" : ","
      const headers = lines[0].split(separator).map((h) => h.trim())
      const importedData = lines.slice(1).map((line) => {
        const values = line.split(separator)
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index]?.trim()
          return obj
        }, {} as any)
      })

      if (onImport) {
        await onImport(importedData)
        toast({
          title: "Импорт завершен",
          description: `Импортировано ${importedData.length} записей из буфера обмена`,
        })
      }
    } catch (error) {
      console.error("[v0] Clipboard import error:", error)
      toast({
        title: "Ошибка импорта",
        description: error instanceof Error ? error.message : "Не удалось импортировать данные из буфера обмена",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  if (!canExport && !canImport) return null

  return (
    <div className="flex items-center gap-2">
      {canExport && (
        <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-9 bg-transparent">
          <Download className="h-4 w-4 mr-2" />
          Скачать
        </Button>
      )}

      {canImport && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isImporting} className="h-9 bg-transparent">
              <Upload className="h-4 w-4 mr-2" />
              Загрузить
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleImportExcel}>
              <Upload className="h-4 w-4 mr-2" />
              Из файла Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImportFromClipboard}>
              <Clipboard className="h-4 w-4 mr-2" />
              Из буфера обмена
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
