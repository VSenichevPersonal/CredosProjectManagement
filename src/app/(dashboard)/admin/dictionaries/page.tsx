"use client"

import Link from "next/link"
import { Building2, Briefcase, Tag, DollarSign, Calendar } from "lucide-react"

const dictionaries = [
  {
    href: "/admin/dictionaries/customers",
    title: "Клиенты",
    desc: "Управление клиентами и заказчиками",
    icon: Building2,
    status: "active",
  },
  {
    href: "/admin/dictionaries/activities",
    title: "Виды деятельности",
    desc: "Типы работ и активностей",
    icon: Briefcase,
    status: "active",
  },
  {
    href: "/admin/dictionaries/tags",
    title: "Теги",
    desc: "Метки для проектов и задач",
    icon: Tag,
    status: "active",
  },
  {
    href: "/admin/dictionaries/rates",
    title: "Ставки проектов",
    desc: "Почасовые ставки по проектам",
    icon: DollarSign,
    status: "planned",
  },
  {
    href: "/admin/dictionaries/calendars",
    title: "Рабочие календари",
    desc: "Производственные календари и выходные",
    icon: Calendar,
    status: "planned",
  },
]

export default function DictionariesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-['PT_Sans']">Справочники</h1>
        <p className="text-gray-600 mt-1">Управление основными справочниками системы</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dictionaries.map((dict) => {
          const Icon = dict.icon
          const isActive = dict.status === "active"
          
          const content = (
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{dict.title}</h3>
                  {!isActive && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                      В разработке
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{dict.desc}</p>
              </div>
            </div>
          )
          
          if (isActive) {
            return (
              <Link
                key={dict.href}
                href={dict.href}
                className="border rounded-lg p-6 transition-all hover:bg-muted hover:shadow-md cursor-pointer"
              >
                {content}
              </Link>
            )
          }
          
          return (
            <div
              key={dict.href}
              className="border rounded-lg p-6 opacity-50 cursor-not-allowed"
            >
              {content}
            </div>
          )
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          📌 О справочниках
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Справочники — это настраиваемые списки данных, которые используются во всей системе.
          Изменения в справочниках влияют на все связанные проекты, задачи и отчёты.
          Деактивированные элементы остаются в истории, но недоступны для новых записей.
        </p>
      </div>
    </div>
  )
}
