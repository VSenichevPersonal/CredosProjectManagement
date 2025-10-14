"use client"

import { AdminDataTable } from "@/components/admin/admin-data-table"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Regulator {
  id: string
  tenant_id: string
  name: string
  short_name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function RegulatorsPage() {
  const router = useRouter()
  const [regulators, setRegulators] = useState<Regulator[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRegulators()
  }, [])

  async function loadRegulators() {
    try {
      setIsLoading(true)
      const response = await fetch("/api/dictionaries/regulators")
      if (!response.ok) {
        throw new Error("Failed to load regulators")
      }
      const data = await response.json()
      setRegulators(data.data || [])
    } catch (error) {
      console.error("[v0] Error loading regulators:", error)
      toast.error("Ошибка загрузки регуляторов")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(regulator: Regulator) {
    if (!confirm(`Вы уверены, что хотите удалить регулятора "${regulator.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/dictionaries/regulators/${regulator.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete regulator")
      }

      toast.success("Регулятор успешно удален")
      // Reload the list
      await loadRegulators()
    } catch (error) {
      console.error("[v0] Error deleting regulator:", error)
      toast.error(error instanceof Error ? error.message : "Ошибка удаления регулятора")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Регуляторы</h1>
        <p className="text-muted-foreground mt-2">Управление списком регуляторных органов</p>
      </div>

      <AdminDataTable
        title="Регуляторы"
        data={regulators}
        columns={[
          { key: "name", label: "Название", sortable: true },
          { key: "short_name", label: "Краткое название", sortable: true },
          { key: "description", label: "Описание" },
          {
            key: "is_active",
            label: "Статус",
            render: (value) => (value ? "Активен" : "Неактивен"),
          },
        ]}
        searchPlaceholder="Поиск регуляторов..."
        onAdd={() => toast.info("Функция добавления в разработке")}
        onEdit={(item) => toast.info("Функция редактирования в разработке")}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  )
}
