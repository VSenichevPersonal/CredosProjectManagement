"use client"

import { useEffect, useState } from "react"
import { AdminDataTable, type ColumnDef } from "@/components/admin/admin-data-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserX, Shield } from "lucide-react"

interface User {
  id: string
  email: string
  name: string | null
  role: string
  is_active: boolean
  organization_id: string | null
  created_at: string
}

interface UserStats {
  total: number
  active: number
  inactive: number
  admins: number
}

const columns: ColumnDef<User>[] = [
  { key: "email", label: "Email", sortable: true },
  { key: "name", label: "Имя", sortable: true, render: (value) => value || "—" },
  {
    key: "role",
    label: "Роль",
    sortable: true,
    render: (value) => {
      const roleLabels: Record<string, string> = {
        super_admin: "Супер Админ",
        regulator_admin: "Админ Регулятора",
        ministry_user: "Пользователь Министерства",
        institution_user: "Пользователь Учреждения",
        ib_manager: "Менеджер ИБ",
        auditor: "Аудитор",
      }
      return <Badge variant="outline">{roleLabels[value] || value}</Badge>
    },
  },
  {
    key: "is_active",
    label: "Статус",
    render: (value) => <Badge variant={value ? "default" : "secondary"}>{value ? "Активен" : "Неактивен"}</Badge>,
  },
  {
    key: "created_at",
    label: "Создан",
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString("ru-RU"),
  },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats>({ total: 0, active: 0, inactive: 0, admins: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersResponse, statsResponse] = await Promise.all([fetch("/api/users"), fetch("/api/users/stats")])

      if (!usersResponse.ok || !statsResponse.ok) {
        throw new Error("Failed to fetch data")
      }

      const usersData = await usersResponse.json()
      const statsData = await statsResponse.json()

      console.log("[v0] Users loaded:", usersData.length)
      console.log("[v0] Stats loaded:", statsData)

      setUsers(usersData)
      setStats(statsData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    console.log("Add user")
    // TODO: Open dialog
  }

  const handleEdit = (user: User) => {
    console.log("Edit user:", user)
    // TODO: Open dialog
  }

  const handleDelete = (user: User) => {
    console.log("Delete user:", user)
    // TODO: Confirm and delete
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Пользователи</h1>
        <p className="text-muted-foreground">Управление пользователями и ролями</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
            <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
            <CardTitle className="text-sm font-medium">Активных</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-3xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
            <CardTitle className="text-sm font-medium">Неактивных</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-3xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
            <CardTitle className="text-sm font-medium">Администраторов</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-3xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      <AdminDataTable
        title="Список пользователей"
        columns={columns}
        data={users}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Поиск по email или имени..."
        isLoading={isLoading}
      />
    </div>
  )
}
