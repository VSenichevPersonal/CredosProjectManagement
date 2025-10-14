"use client"

import { useState } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import type { ColumnDefinition } from "@/types/table"
import type { Direction } from "@/types/domain"
import { Building2 } from "lucide-react"

export default function DirectionsPage() {
  const [data, setData] = useState<Direction[]>([])

  const columns: ColumnDefinition<Direction>[] = [
    { id: "name", label: "Название", key: "name", sortable: true },
    { id: "description", label: "Описание", key: "description" },
    { id: "budget", label: "Бюджет (₽)", key: "budget", sortable: true, render: (v) => v.budget?.toLocaleString('ru') || '—' },
    { 
      id: "color", 
      label: "Цвет", 
      key: "color",
      render: (v) => <div className="flex items-center gap-2"><div className={`h-4 w-4 rounded-full bg-${v.color}-500`} />{v.color}</div>
    },
  ]

  return (
    <div className="p-6">
      <UniversalDataTable
        title="Направления"
        description="Бизнес-направления компании (ИБ, ПИБ, ТК, Аудит)"
        icon={Building2}
        data={data}
        columns={columns}
        canExport
        exportFilename="directions"
      />
    </div>
  )
}

