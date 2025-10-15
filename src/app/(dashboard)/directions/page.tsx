"use client"

import { useState, useEffect } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import type { ColumnDefinition } from "@/types/table"
import type { Direction } from "@/types/domain"
import { Building2 } from "lucide-react"
import { useApi } from "@/lib/hooks/use-api"
import { useToast } from "@/hooks/use-toast"

export default function DirectionsPage() {
  const [data, setData] = useState<Direction[]>([])
  const [loading, setLoading] = useState(true)

  const api = useApi()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/directions')
      if (response.ok) {
        const result = await response.json()
        setData(result.data || [])
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: "Не удалось загрузить направления",
      })
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDefinition<Direction>[] = [
    { id: "name", label: "Название", key: "name", sortable: true },
    { id: "description", label: "Описание", key: "description" },
    { id: "budget", label: "Бюджет (₽)", key: "budget", sortable: true, render: (v) => v?.toLocaleString('ru') || '—' },
    { 
      id: "color", 
      label: "Цвет", 
      key: "color",
      render: (v) => v ? <div className="flex items-center gap-2"><div className={`h-4 w-4 rounded-full`} style={{backgroundColor: v}} />{v}</div> : '—'
    },
  ]

  const handleAdd = () => {
    toast({ title: "Перейдите в Справочники", description: "Создание доступно в /admin/dictionaries/directions" })
  }

  const handleEdit = (direction: Direction) => {
    toast({ title: "В разработке", description: "Редактирование скоро будет доступно" })
  }

  const handleDelete = async (direction: Direction) => {
    if (!confirm(`Удалить направление "${direction.name}"?`)) return

    try {
      await api.execute(`/api/directions/${direction.id}`, {
        method: 'DELETE',
      })

      toast({
        title: "Успешно!",
        description: "Направление удалено",
      })

      loadData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить направление",
      })
    }
  }

  return (
    <div>
      <UniversalDataTable
        title="Направления"
        description="Бизнес-направления компании (ИБ, ПИБ, ТК, Аудит)"
        icon={Building2}
        data={data}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel="Создать направление"
        isLoading={loading}
        canExport
        exportFilename="directions"
      />
    </div>
  )
}
