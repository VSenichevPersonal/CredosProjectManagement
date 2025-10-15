"use client"

import { useState, useEffect } from "react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import type { ColumnDefinition } from "@/types/table"
import type { Employee } from "@/types/domain"
import { Users } from "lucide-react"
import { useApi } from "@/lib/hooks/use-api"
import { useToast } from "@/hooks/use-toast"

export default function EmployeesPage() {
  const [data, setData] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  const api = useApi()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const result = await response.json()
        setData(result.data || [])
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: "Не удалось загрузить сотрудников",
      })
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDefinition<Employee>[] = [
    { id: "fullName", label: "ФИО", key: "fullName", sortable: true },
    { id: "email", label: "Email", key: "email", sortable: true },
    { id: "position", label: "Должность", key: "position" },
    { id: "defaultHourlyRate", label: "Ставка (₽/ч)", key: "defaultHourlyRate", sortable: true, render: (v) => v?.toLocaleString('ru') || '—' },
    { 
      id: "isActive", 
      label: "Статус", 
      key: "isActive",
      render: (v) => v ? <span className="text-green-600">Активен</span> : <span className="text-gray-400">Неактивен</span>
    },
  ]

  const handleAdd = () => {
    toast({ title: "Перейдите в Справочники", description: "Создание доступно в /admin/dictionaries/employees" })
  }

  const handleEdit = (employee: Employee) => {
    toast({ title: "В разработке", description: "Редактирование скоро будет доступно" })
  }

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Удалить сотрудника "${employee.fullName}"?`)) return

    try {
      await api.execute(`/api/employees/${employee.id}`, {
        method: 'DELETE',
      })

      toast({
        title: "Успешно!",
        description: "Сотрудник удален",
      })

      loadData()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить сотрудника",
      })
    }
  }

  return (
    <div>
      <UniversalDataTable
        title="Сотрудники"
        description="Сотрудники компании"
        icon={Users}
        data={data}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel="Добавить сотрудника"
        isLoading={loading}
        canExport
        exportFilename="employees"
      />
    </div>
  )
}
