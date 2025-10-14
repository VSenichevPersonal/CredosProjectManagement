"use client"

import Link from "next/link"
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
      <div className="flex h-24 flex-col items-center justify-center gap-2 border-b border-credos-border px-4">
        <div className="flex h-16 w-full items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-credos-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">К</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold text-credos-primary">Credos</span>
              <span className="text-xs text-muted-foreground">Project Management</span>
            </div>
          </div>
        </div>
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
