"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  FileText,
  Building2,
  CheckSquare,
  Users,
  Settings,
  Grid3x3,
  FileBarChart,
  BookOpen,
  ShieldCheck,
  ChevronDown,
  Home,
  Files,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  Layers,
  Database,
  Filter,
  FileSearch,
  Shield,
  BuildingIcon,
  Package,
  Scale,
  Sparkles,
  ListChecks,
  ShieldPlus,
  FileStack,
  ShoppingCart,
  ClipboardList,
  Calendar,
  Target,
  FilePlus2,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"

const navigationGroups = [
  {
    id: "overview",
    name: "Обзор",
    icon: Home,
    items: [
      { name: "Дашборд", href: "/", icon: LayoutDashboard },
      { name: "Тепловая карта", href: "/heatmap", icon: Grid3x3 },
      { name: "Аналитика", href: "/analytics", icon: TrendingUp },
    ],
  },
  {
    id: "compliance",
    name: "Управление соответствием",
    icon: CheckSquare,
    items: [
      { name: "Организации", href: "/organizations", icon: Building2 },
      { name: "Требования", href: "/requirements", icon: FileText },
      { name: "Записи соответствия", href: "/compliance", icon: CheckSquare },
      { name: "Отчёты", href: "/reports", icon: FileBarChart },
    ],
  },
  {
    id: "documents",
    name: "Документы",
    icon: FileStack,
    items: [
      { name: "Библиотека документов", href: "/documents", icon: Files },
      { name: "Создание документов", href: "/documents/wizard/new", icon: FilePlus2 },
    ],
  },
  {
    id: "mywork",
    name: "Моя работа",
    icon: ClipboardList,
    items: [
      { name: "Моя организация", href: "/my-organization", icon: BuildingIcon },
      { name: "Мои задачи", href: "/my-requirements", icon: FileText },
      { name: "Мои доказательства", href: "/my-compliance-records", icon: FileStack },
    ],
  },
  {
    id: "library",
    name: "Библиотека шаблонов",
    icon: Layers,
    items: [
      { name: "Шаблоны мер", href: "/control-templates", icon: Shield },
      { name: "База знаний", href: "/knowledge-base", icon: BookOpen },
    ],
  },
  {
    id: "risks",
    name: "Риски",
    icon: AlertTriangle,
    items: [
      { name: "Реестр рисков", href: "/risks", icon: AlertTriangle },
    ],
  },
  {
    id: "admin",
    name: "Администрирование",
    icon: Settings,
    items: [
      { name: "Пользователи", href: "/admin/users", icon: Users },
      { name: "Организации", href: "/admin/organizations", icon: Building2 },
      { name: "Справочники", href: "/admin/dictionaries", icon: BookOpen },
      { name: "Настройки AI", href: "/admin/ai-settings", icon: Sparkles },
      { name: "Правила рекомендаций", href: "/admin/recommendation-rules", icon: Target },
      { name: "Настройки тенанта", href: "/admin/tenant", icon: Database },
      { name: "Настройки системы", href: "/admin/system", icon: Settings },
      { name: "Роли и права", href: "/admin/roles", icon: Shield, superAdminOnly: true },
      { name: "Аудит", href: "/admin/audit", icon: FileSearch, superAdminOnly: true },
      { name: "Управление тенантами", href: "/admin/tenants", icon: BuildingIcon, superAdminOnly: true },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  const activeGroupId =
    navigationGroups.find((group) => group.items.some((item) => pathname === item.href))?.id || "overview"

  // Только один раздел раскрыт (accordion)
  const [expandedGroup, setExpandedGroup] = useState(activeGroupId)

  const toggleGroup = (groupId: string) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId)
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-24 flex-col items-center justify-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-16 w-full items-center justify-center">
          <img
            src="https://static.tildacdn.com/tild3738-3365-4538-b862-653038663431/__.svg"
            alt="Кибероснова"
            className="h-16 w-auto"
          />
        </div>
        <span className="text-base font-semibold text-sidebar-foreground">Комплаенс</span>
      </div>

      <nav className="flex flex-col gap-3 overflow-y-auto p-4" style={{ height: "calc(100vh - 6rem)" }}>
        {navigationGroups.map((group) => {
          const isExpanded = expandedGroup === group.id
          const hasActiveItem = group.items.some((item) => pathname === item.href)

          return (
            <div key={group.id} className="flex flex-col gap-1.5">
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-bold uppercase tracking-wider transition-all",
                  "hover:bg-sidebar-accent/50",
                  hasActiveItem ? "text-[#22aa7d]" : "text-[#4ab994]",
                )}
                style={{ fontWeight: 700 }}
              >
                <group.icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">{group.name}</span>
                <ChevronDown
                  className={cn("h-4 w-4 flex-shrink-0 transition-transform duration-200", isExpanded && "rotate-180")}
                />
              </button>

              {isExpanded && (
                <div className="flex flex-col gap-0.5 pl-3">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium transition-all",
                          isActive
                            ? "bg-primary-600 text-white shadow-sm"
                            : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        )}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
