"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  last_login_at: string | null
  organizations?: { name: string }
}

interface UsersTableProps {
  users: User[]
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  regulator_admin: "Regulator Admin",
  ministry_user: "Ministry User",
  institution_user: "Institution User",
  ciso: "CISO",
  auditor: "Auditor",
}

export function UsersTable({ users }: UsersTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const handleDelete = async (userId: string) => {
    if (!confirm("Вы уверены, что хотите деактивировать этого пользователя?")) return

    setLoading(userId)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete user")

      toast({
        title: "Пользователь деактивирован",
        description: "Пользователь больше не сможет войти в систему",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось деактивировать пользователя",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Имя</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Роль</TableHead>
            <TableHead>Организация</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Последний вход</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Пользователи не найдены
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ROLE_LABELS[user.role] || user.role}</Badge>
                </TableCell>
                <TableCell>{user.organizations?.name || "-"}</TableCell>
                <TableCell>
                  {user.is_active ? (
                    <Badge variant="default">Активен</Badge>
                  ) : (
                    <Badge variant="secondary">Неактивен</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString("ru-RU") : "Никогда"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Действия</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Отправить приглашение
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(user.id)}
                        disabled={loading === user.id}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Деактивировать
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
