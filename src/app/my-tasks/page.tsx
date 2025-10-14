"use client"

import { useState } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import type { ColumnDefinition } from "@/types/table"
import type { Task } from "@/types/domain"
import { Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function MyTasksPage() {
  const [data, setData] = useState<Task[]>([])

  const columns: ColumnDefinition<Task>[] = [
    { id: "name", label: "Задача", key: "name", sortable: true },
    { 
      id: "status", 
      label: "Статус", 
      key: "status",
      sortable: true,
      render: (v, row) => {
        const colors: Record<string, string> = {
          todo: "bg-gray-100 text-gray-800",
          in_progress: "bg-blue-100 text-blue-800",
          review: "bg-yellow-100 text-yellow-800",
          done: "bg-green-100 text-green-800"
        }
        const labels: Record<string, string> = {
          todo: "К выполнению",
          in_progress: "В работе",
          review: "На проверке",
          done: "Завершено"
        }
        return <Badge className={colors[row.status] || ""}>{labels[row.status] || row.status}</Badge>
      }
    },
    { 
      id: "priority", 
      label: "Приоритет", 
      key: "priority",
      render: (v, row) => {
        const colors: Record<string, string> = {
          low: "text-gray-600",
          medium: "text-blue-600",
          high: "text-orange-600",
          critical: "text-red-600"
        }
        return <span className={colors[row.priority] || ""}>{row.priority}</span>
      }
    },
    { id: "dueDate", label: "Срок", key: "dueDate", sortable: true },
    { id: "estimatedHours", label: "Оценка (ч)", key: "estimatedHours" },
  ]

  return (
    <div className="p-6">
      <UniversalDataTable
        title="Мои задачи"
        description="Задачи, назначенные мне"
        icon={Target}
        data={data}
        columns={columns}
        canExport
        exportFilename="my-tasks"
      />
    </div>
  )
}

