import type { Metadata } from "next"
import { RolesManagement } from "@/components/admin/roles-management"

export const metadata: Metadata = {
  title: "Управление ролями | Кибероснова Комплаенс",
  description: "Управление ролями и правами доступа",
}

export default function RolesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Управление ролями</h1>
        <p className="text-muted-foreground">Настройка ролей и прав доступа для пользователей системы</p>
      </div>

      <RolesManagement />
    </div>
  )
}
