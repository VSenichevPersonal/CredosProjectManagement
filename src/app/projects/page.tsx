"use client"

import { useState } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import type { ColumnDefinition } from "@/types/table"
import type { Project } from "@/types/domain"
import { FolderOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function ProjectsPage() {
  const [data, setData] = useState<Project[]>([])

  const columns: ColumnDefinition<Project>[] = [
    { id: "name", label: "Название", key: "name", sortable: true },
    { 
      id: "status", 
      label: "Статус", 
      key: "status",
      render: (v, row) => {
        const colors: Record<string, string> = {
          planning: "bg-gray-100 text-gray-800",
          active: "bg-green-100 text-green-800",
          on_hold: "bg-yellow-100 text-yellow-800",
          completed: "bg-blue-100 text-blue-800",
          cancelled: "bg-red-100 text-red-800"
        }
        return <Badge className={colors[row.status] || ""}>{row.status}</Badge>
      }
    },
    { id: "startDate", label: "Дата начала", key: "startDate", sortable: true },
    { id: "totalBudget", label: "Бюджет (₽)", key: "totalBudget", sortable: true, render: (v) => v.totalBudget?.toLocaleString('ru') || '—' },
  ]

  return (
    <div className="p-6">
      <UniversalDataTable
        title="Все проекты"
        description="Управление проектами компании"
        icon={FolderOpen}
        data={data}
        columns={columns}
        canExport
        exportFilename="projects"
      />
    </div>
  )
}

