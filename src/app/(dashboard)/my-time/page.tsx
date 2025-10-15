"use client"

import { useState } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import { TimeEntryDialog } from "@/components/time-tracking/time-entry-dialog"
import type { ColumnDefinition } from "@/types/table"
import type { TimeEntry } from "@/types/domain"
import { Clock, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function MyTimePage() {
  const [data, setData] = useState<TimeEntry[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const columns: ColumnDefinition<TimeEntry>[] = [
    { id: "date", label: "Дата", key: "date", sortable: true },
    { id: "hours", label: "Часы", key: "hours", sortable: true },
    { id: "description", label: "Описание", key: "description" },
    { 
      id: "status", 
      label: "Статус", 
      key: "status", 
      sortable: true,
      render: (v, row) => {
        const colors: Record<string, string> = {
          draft: "bg-gray-100 text-gray-800",
          submitted: "bg-blue-100 text-blue-800",
          approved: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800"
        }
        const labels: Record<string, string> = {
          draft: "Черновик",
          submitted: "На согласовании",
          approved: "Утверждено",
          rejected: "Отклонено"
        }
        return <Badge className={colors[row.status] || ""}>{labels[row.status] || row.status}</Badge>
      }
    },
  ]

  return (
    <div>
      <UniversalDataTable
        title="Мои часы"
        description="Учёт моего рабочего времени"
        icon={Clock}
        data={data}
        columns={columns}
        onAdd={() => setIsDialogOpen(true)}
        addButtonLabel="Добавить время"
        canExport
        exportFilename="my-time"
      />
      <TimeEntryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          setIsDialogOpen(false)
          // TODO: refresh data
        }}
      />
    </div>
  )
}

