"use client"

import { DictionaryManagementPanel, type DictionaryConfig } from "@/components/admin/dictionary-management-panel"
import { Building2 } from "lucide-react"
import type { Customer } from "@/types/domain"
import type { ColumnDefinition } from "@/types/table"

const columns: ColumnDefinition<Customer>[] = [
  {
    id: "name",
    label: "Название",
    key: "name",
    sortable: true,
  },
  {
    id: "legalName",
    label: "Юр. название",
    key: "legalName",
    render: (v) => v || "—",
  },
  {
    id: "inn",
    label: "ИНН",
    key: "inn",
    render: (v) => v || "—",
  },
  {
    id: "contactPerson",
    label: "Контактное лицо",
    key: "contactPerson",
    render: (v) => v || "—",
  },
  {
    id: "email",
    label: "Email",
    key: "email",
    render: (v) => v || "—",
  },
  {
    id: "phone",
    label: "Телефон",
    key: "phone",
    render: (v) => v || "—",
  },
  {
    id: "isActive",
    label: "Статус",
    key: "isActive",
    render: (v) => (v ? "✅ Активен" : "❌ Неактивен"),
  },
]

const config: DictionaryConfig<Customer> = {
  title: "Клиенты",
  description: "Управление клиентами и заказчиками",
  icon: Building2,
  apiPath: "/api/customers",
  columns,
  searchPlaceholder: "Поиск клиентов...",
  fields: [
    {
      id: "name",
      label: "Название",
      type: "text",
      required: true,
      placeholder: "ООО «Рога и Копыта»",
    },
    {
      id: "legalName",
      label: "Полное юридическое название",
      type: "text",
      placeholder: "Общество с ограниченной ответственностью «Рога и Копыта»",
    },
    {
      id: "inn",
      label: "ИНН",
      type: "text",
      placeholder: "1234567890",
    },
    {
      id: "kpp",
      label: "КПП",
      type: "text",
      placeholder: "123456789",
    },
    {
      id: "contactPerson",
      label: "Контактное лицо",
      type: "text",
      placeholder: "Иванов Иван Иванович",
    },
    {
      id: "email",
      label: "Email",
      type: "email",
      placeholder: "contact@company.ru",
    },
    {
      id: "phone",
      label: "Телефон",
      type: "text",
      placeholder: "+7 (999) 123-45-67",
    },
    {
      id: "address",
      label: "Адрес",
      type: "textarea",
      placeholder: "123456, г. Москва, ул. Примерная, д. 1",
    },
    {
      id: "website",
      label: "Веб-сайт",
      type: "url",
      placeholder: "https://company.ru",
    },
    {
      id: "notes",
      label: "Примечания",
      type: "textarea",
      placeholder: "Дополнительная информация...",
    },
    {
      id: "isActive",
      label: "Активен",
      type: "boolean",
    },
  ],
}

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-['PT_Sans']">Клиенты</h1>
        <p className="text-gray-600 mt-1">Управление клиентами и заказчиками</p>
      </div>
      <DictionaryManagementPanel config={config} />
    </div>
  )
}

