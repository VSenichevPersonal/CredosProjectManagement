"use client"

import { DictionaryManagementPanel, type DictionaryConfig } from "@/components/admin/dictionary-management-panel"
import { Briefcase } from "lucide-react"
import type { Activity } from "@/types/domain"
import type { ColumnDefinition } from "@/types/table"

const columns: ColumnDefinition<Activity>[] = [
  {
    id: "name",
    label: "Название",
    key: "name",
    sortable: true,
  },
  {
    id: "description",
    label: "Описание",
    key: "description",
    render: (v) => v || "—",
  },
  {
    id: "isBillable",
    label: "Тип",
    key: "isBillable",
    render: (v) => (v ? "💰 Оплачиваемая" : "🎁 Неоплачиваемая"),
  },
  {
    id: "defaultHourlyRate",
    label: "Ставка",
    key: "defaultHourlyRate",
    render: (v) => v ? `${v} ₽/ч` : "—",
  },
  {
    id: "isActive",
    label: "Статус",
    key: "isActive",
    render: (v) => (v ? "✅ Активна" : "❌ Неактивна"),
  },
]

const config: DictionaryConfig<Activity> = {
  title: "Виды деятельности",
  description: "Управление видами деятельности и активностей",
  icon: Briefcase,
  apiPath: "/api/activities",
  columns,
  searchPlaceholder: "Поиск видов деятельности...",
  fields: [
    {
      id: "name",
      label: "Название",
      type: "text",
      required: true,
      placeholder: "Разработка",
    },
    {
      id: "description",
      label: "Описание",
      type: "textarea",
      placeholder: "Подробное описание вида деятельности...",
    },
    {
      id: "isBillable",
      label: "Оплачиваемая",
      type: "boolean",
    },
    {
      id: "defaultHourlyRate",
      label: "Стандартная ставка (₽/ч)",
      type: "number",
      min: 0,
      step: 100,
      placeholder: "1500",
    },
    {
      id: "isActive",
      label: "Активна",
      type: "boolean",
    },
  ],
}

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-['PT_Sans']">Виды деятельности</h1>
        <p className="text-gray-600 mt-1">Управление видами деятельности и активностей</p>
      </div>
      <DictionaryManagementPanel config={config} />
    </div>
  )
}

