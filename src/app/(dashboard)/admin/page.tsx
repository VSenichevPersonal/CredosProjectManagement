import Link from "next/link"
import { DatabaseManagementPanel } from "@/components/admin/database-management-panel"

const sections = [
  { href: "/admin/dictionaries", title: "Справочники", desc: "Направления, типы документов" },
  { href: "/admin/finance", title: "Финансовые регистры", desc: "Доходы, зарплаты" },
  { href: "/admin/users", title: "Пользователи", desc: "Управление сотрудниками" },
  { href: "/admin/permissions", title: "Матрица прав", desc: "Роли и разрешения" },
]

export default function AdminHome() {
  return (
    <div className="grid gap-6">
      {/* Навигация по разделам */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="border rounded-md p-4 hover:bg-muted transition-colors">
            <div className="text-lg font-medium">{s.title}</div>
            <div className="text-sm text-muted-foreground">{s.desc}</div>
          </Link>
        ))}
      </div>

      {/* Управление базой данных */}
      <DatabaseManagementPanel />
    </div>
  )
}
