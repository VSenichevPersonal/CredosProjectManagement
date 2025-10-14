"use client"

import { AdminDataTable } from "@/components/admin/admin-data-table"

export default function PeriodicitiesPage() {
  const columns = [
    { key: "code", label: "Код", sortable: true },
    { key: "name", label: "Название", sortable: true },
    { key: "description", label: "Описание" },
    {
      key: "is_active",
      label: "Статус",
      render: (value: boolean) => (value ? "Активен" : "Неактивен"),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-3xl">Периодичности</h1>
        <p className="text-muted-foreground">Управление периодичностями проверок</p>
      </div>

      <AdminDataTable
        data={[]}
        columns={columns}
        searchPlaceholder="Поиск периодичностей..."
        apiEndpoint="/api/dictionaries/periodicities"
      />
    </div>
  )
}
