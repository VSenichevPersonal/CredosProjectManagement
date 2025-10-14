"use client"

import { useState } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import type { ColumnDefinition } from "@/types/table"
import type { Employee } from "@/types/domain"
import { Users } from "lucide-react"

export default function EmployeesPage() {
  const [data, setData] = useState<Employee[]>([])

  const columns: ColumnDefinition<Employee>[] = [
    { id: "fullName", label: "ФИО", key: "fullName", sortable: true },
    { id: "email", label: "Email", key: "email", sortable: true },
    { id: "position", label: "Должность", key: "position" },
    { id: "defaultHourlyRate", label: "Ставка (₽/ч)", key: "defaultHourlyRate", sortable: true, render: (v) => v.defaultHourlyRate?.toLocaleString('ru') || '—' },
    { 
      id: "isActive", 
      label: "Статус", 
      key: "isActive",
      render: (v) => v.isActive ? <span className="text-green-600">Активен</span> : <span className="text-gray-400">Неактивен</span>
    },
  ]

  return (
    <div className="p-6">
      <UniversalDataTable
        title="Сотрудники"
        description="Сотрудники компании"
        icon={Users}
        data={data}
        columns={columns}
        canExport
        exportFilename="employees"
      />
    </div>
  )
}

