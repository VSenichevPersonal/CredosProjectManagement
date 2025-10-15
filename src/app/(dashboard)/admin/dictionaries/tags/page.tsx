"use client"

import { DictionaryManagementPanel, type DictionaryConfig } from "@/components/admin/dictionary-management-panel"
import { Tag as TagIcon } from "lucide-react"
import type { Tag } from "@/types/domain"
import type { ColumnDefinition } from "@/types/table"

const columns: ColumnDefinition<Tag>[] = [
  {
    id: "name",
    label: "Название",
    key: "name",
    sortable: true,
    render: (v, row) => (
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: row.color }}
        />
        <span>{v as string}</span>
      </div>
    ),
  },
  {
    id: "color",
    label: "Цвет",
    key: "color",
    render: (v) => (
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded border"
          style={{ backgroundColor: v as string }}
        />
        <code className="text-xs">{v as string}</code>
      </div>
    ),
  },
  {
    id: "description",
    label: "Описание",
    key: "description",
    render: (v) => v || "—",
  },
  {
    id: "isActive",
    label: "Статус",
    key: "isActive",
    render: (v) => (v ? "✅ Активен" : "❌ Неактивен"),
  },
]

const config: DictionaryConfig<Tag> = {
  title: "Теги",
  description: "Управление тегами для проектов и задач",
  icon: TagIcon,
  apiPath: "/api/tags",
  columns,
  searchPlaceholder: "Поиск тегов...",
  fields: [
    {
      id: "name",
      label: "Название",
      type: "text",
      required: true,
      placeholder: "Срочно",
    },
    {
      id: "color",
      label: "Цвет (hex)",
      type: "text",
      placeholder: "#3B82F6",
    },
    {
      id: "description",
      label: "Описание",
      type: "textarea",
      placeholder: "Описание тега...",
    },
    {
      id: "isActive",
      label: "Активен",
      type: "boolean",
    },
  ],
}

export default function TagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-['PT_Sans']">Теги</h1>
        <p className="text-gray-600 mt-1">Управление тегами для проектов и задач</p>
      </div>
      <DictionaryManagementPanel config={config} />
    </div>
  )
}

