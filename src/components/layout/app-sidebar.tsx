"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Clock,
  FolderOpen,
  CheckSquare,
  Building2,
  Users,
  DollarSign,
  ChevronDown,
  Home,
  Calendar,
  Target,
  TrendingUp,
  BarChart3,
  Settings,
  Book,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigationGroups = [
  {
    id: "overview",
    name: "Обзор",
    icon: Home,
    items: [
      { name: "Дашборд", href: "/", icon: LayoutDashboard },
      { name: "Аналитика", href: "/analytics", icon: TrendingUp },
    ],
  },
  {
    id: "time-tracking",
    name: "Учет времени",
    icon: Clock,
    items: [
      { name: "Мои часы", href: "/my-time", icon: Clock },
      { name: "Согласование часов", href: "/approvals", icon: CheckSquare },
    ],
  },
  {
    id: "projects",
    name: "Проекты",
    icon: FolderOpen,
    items: [
      { name: "Все проекты", href: "/projects", icon: FolderOpen },
      { name: "Мои задачи", href: "/my-tasks", icon: Target },
    ],
  },
  {
    id: "directions",
    name: "Направления",
    icon: Building2,
    items: [
      { name: "Направления", href: "/directions", icon: Building2 },
    ],
  },
  {
    id: "employees",
    name: "Сотрудники",
    icon: Users,
    items: [
      { name: "Сотрудники", href: "/employees", icon: Users },
    ],
  },
  {
    id: "analytics",
    name: "Аналитика",
    icon: BarChart3,
    items: [
      { name: "Рентабельность", href: "/analytics/profitability", icon: TrendingUp },
    ],
  },
  {
    id: "admin",
    name: "Администрирование",
    icon: Settings,
    items: [
      { name: "Справочники", href: "/admin/dictionaries", icon: Book },
      { name: "Финансовые регистры", href: "/admin/finance", icon: DollarSign },
    ],
  },
  {
    id: "finance",
    name: "Финансы",
    icon: DollarSign,
    items: [
      { name: "Фонд ЗП", href: "/salary-fund", icon: DollarSign },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  const activeGroupId =
    navigationGroups.find((group) => group.items.some((item) => pathname === item.href))?.id || "overview"

  // Только один раздел раскрыт (accordion)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(activeGroupId)

  const toggleGroup = (groupId: string) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId)
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-credos-border bg-white">
      <Link href="/" className="flex h-20 items-center justify-center border-b border-credos-border px-4 hover:bg-gray-50 transition-colors">
        <Image 
          src="/credos-logo.svg" 
          alt="Кредо-С" 
          width={160} 
          height={48}
          className="h-12 w-auto"
        />
      </Link>

      <nav className="flex flex-col gap-3 overflow-y-auto p-4" style={{ height: "calc(100vh - 5rem)" }}>
        {navigationGroups.map((group) => {
          const isExpanded = expandedGroup === group.id
          const hasActiveItem = group.items.some((item) => pathname === item.href)

          return (
            <div key={group.id} className="flex flex-col gap-1.5">
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-bold uppercase tracking-wider transition-all",
                  "hover:bg-credos-muted",
                  hasActiveItem ? "text-credos-primary" : "text-gray-600",
                )}
                style={{ fontWeight: 600 }}
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
                            ? "bg-credos-primary text-white shadow-sm"
                            : "text-gray-700 hover:bg-credos-muted hover:text-credos-primary",
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
