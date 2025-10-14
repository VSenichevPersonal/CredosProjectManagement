"use client"

import { useState } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import type { ColumnDefinition } from "@/types/table"
import type { TimeEntry } from "@/types/domain"
import { CheckSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function ApprovalsPage() {
  const [data, setData] = useState<TimeEntry[]>([])

  const handleApprove = (row: TimeEntry) => {
    console.log("Approve", row.id)
  }

  const handleReject = (row: TimeEntry) => {
    console.log("Reject", row.id)
  }

  const columns: ColumnDefinition<TimeEntry>[] = [
    { id: "date", label: "Дата", key: "date", sortable: true },
    { id: "employeeId", label: "Сотрудник", key: "employeeId" },
    { id: "hours", label: "Часы", key: "hours", sortable: true },
    { id: "description", label: "Описание", key: "description" },
    { 
      id: "status", 
      label: "Статус", 
      key: "status",
      render: (v) => <Badge className="bg-blue-100 text-blue-800">На согласовании</Badge>
    },
    {
      id: "actions",
      label: "Действия",
      key: "id",
      render: (v, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleApprove(row)}>Утвердить</Button>
          <Button size="sm" variant="outline" onClick={() => handleReject(row)}>Отклонить</Button>
        </div>
      )
    }
  ]

  return (
    <div className="p-6">
      <UniversalDataTable
        title="Согласование часов"
        description="Записи времени, ожидающие утверждения"
        icon={CheckSquare}
        data={data}
        columns={columns}
        canExport
        exportFilename="approvals"
      />
    </div>
  )
}

