"use client"

/**
 * Export Buttons Component
 * 
 * Кнопки для экспорта отчётов в различных форматах
 */

import { ExportButton } from "@/components/shared/export-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, FileText } from "lucide-react"

export function ExportButtons() {
  const today = new Date().toISOString().split('T')[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Экспорт данных
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Выберите данные для экспорта</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <ExportButton
            endpoint="/api/compliance/export"
            filename={`compliance_records_${today}.xlsx`}
            label="Записи соответствия"
            variant="ghost"
            size="sm"
          />
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <ExportButton
            endpoint="/api/requirements/export"
            filename={`requirements_${today}.xlsx`}
            label="Требования"
            variant="ghost"
            size="sm"
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

