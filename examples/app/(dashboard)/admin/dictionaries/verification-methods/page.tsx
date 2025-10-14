"use client"

import { AdminDataTable } from "@/components/admin/admin-data-table"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface VerificationMethod {
  id: string
  code: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export default function VerificationMethodsPage() {
  const [methods, setMethods] = useState<VerificationMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMethods()
  }, [])

  async function loadMethods() {
    try {
      setIsLoading(true)
      const response = await fetch("/api/dictionaries/verification-methods")
      if (!response.ok) {
        throw new Error("Failed to load verification methods")
      }
      const data = await response.json()
      setMethods(data.data || [])
    } catch (error) {
      console.error("[v0] Error loading verification methods:", error)
      toast.error("Ошибка загрузки способов подтверждения")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(method: VerificationMethod) {
    if (!confirm(`Вы уверены, что хотите удалить способ подтверждения "${method.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/dictionaries/verification-methods/${method.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete verification method")
      }

      toast.success("Способ подтверждения успешно удален")
      await loadMethods()
    } catch (error) {
      console.error("[v0] Error deleting verification method:", error)
      toast.error(error instanceof Error ? error.message : "Ошибка удаления способа подтверждения")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Способы подтверждения соответствия</h1>
        <p className="text-muted-foreground mt-2">Управление методами подтверждения выполнения требований</p>
        <p className="text-sm text-muted-foreground mt-1">
          Регулятор или суперадмин могут задать конкретный способ подтверждения для требования. Если конкретный способ
          не задан - организации выбирают способ сами на основании закона.
        </p>
      </div>

      <AdminDataTable
        title="Способы подтверждения"
        data={methods}
        columns={[
          { key: "code", label: "Код", sortable: true },
          { key: "name", label: "Название", sortable: true },
          { key: "description", label: "Описание" },
          { key: "sort_order", label: "Порядок", sortable: true },
          {
            key: "is_active",
            label: "Статус",
            render: (value) => (value ? "Активен" : "Неактивен"),
          },
        ]}
        searchPlaceholder="Поиск способов подтверждения..."
        onAdd={() => toast.info("Функция добавления в разработке")}
        onEdit={(item) => toast.info("Функция редактирования в разработке")}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  )
}
