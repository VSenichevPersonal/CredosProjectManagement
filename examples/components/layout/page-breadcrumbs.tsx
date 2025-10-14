"use client"

import { usePathname } from "next/navigation"
import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/breadcrumbs"
import { useMemo } from "react"

// Mapping путей к читаемым названиям
const pathLabels: Record<string, string> = {
  admin: "Администрирование",
  "ai-settings": "Настройки AI",
  tenant: "Настройки тенанта",
  system: "Системные настройки",
  organizations: "Организации",
  users: "Пользователи",
  requirements: "Требования",
  documents: "Документы",
  evidence: "Доказательства",
  controls: "Меры защиты",
  "control-templates": "Типовые меры",
  tenants: "Тенанты",
  roles: "Роли и права",
  dictionaries: "Справочники",
  "regulatory-frameworks": "Нормативные акты",
  "organization-types": "Типы организаций",
  periodicities: "Периодичности",
  applicability: "Правила применимости",
  settings: "Настройки",
  compliance: "Комплаенс",
  dashboard: "Панель управления",
  heatmap: "Тепловая карта",
  analytics: "Аналитика",
  "knowledge-base": "База знаний",
  marketplace: "Маркетплейс",
  notifications: "Уведомления",
  reports: "Отчеты",
  risks: "Риски",
  audit: "Аудит",
  categories: "Категории",
  regulators: "Регуляторы",
  library: "Библиотека",
  "pending-review": "На проверке",
  measures: "Меры",
  normatives: "Нормативы",
  packages: "Пакеты",
  templates: "Шаблоны",
}

export function PageBreadcrumbs() {
  const pathname = usePathname()

  const breadcrumbs = useMemo(() => {
    // Убираем начальный слэш и разбиваем путь
    const segments = pathname.split("/").filter(Boolean)

    // Если мы на главной странице
    if (segments.length === 0) {
      return []
    }

    const items: BreadcrumbItem[] = []
    let currentPath = ""

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`

      // Пропускаем динамические сегменты (UUID и числа)
      if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || segment.match(/^\d+$/)) {
        return
      }

      const label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

      // Последний элемент не должен быть ссылкой
      items.push({
        label,
        href: index === segments.length - 1 ? undefined : currentPath,
      })
    })

    return items
  }, [pathname])

  // Не показываем breadcrumbs на главной странице или если только один сегмент
  if (breadcrumbs.length === 0) {
    return null
  }

  return <Breadcrumbs items={breadcrumbs} className="mb-4" />
}
