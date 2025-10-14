"use client"

/**
 * Tenant Users Tab
 *
 * Displays and manages users of the tenant
 */

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { TenantUser } from "@/types/domain/tenant"
import { MoreVertical, UserPlus, Mail } from "lucide-react"

interface TenantUsersTabProps {
  tenantId: string
  users: TenantUser[]
  onRefresh: () => void
}

export function TenantUsersTab({ tenantId, users, onRefresh }: TenantUsersTabProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleRemoveUser = async (userId: string) => {
    if (!confirm("Удалить пользователя из теnanта?")) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove user")
      }

      onRefresh()
    } catch (error) {
      console.error("Error removing user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "default"
      case "admin":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Пользователи</h3>
          <p className="text-sm text-muted-foreground">Всего пользователей: {users.length}</p>
        </div>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Добавить пользователя
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Нет пользователей</div>
          ) : (
            <div className="space-y-3">
              {users.map((tenantUser) => (
                <div key={tenantUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {tenantUser.user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{tenantUser.user?.name || "Без имени"}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {tenantUser.user?.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={getRoleColor(tenantUser.role)}>{tenantUser.role}</Badge>
                    <Badge variant={tenantUser.isActive ? "default" : "secondary"}>
                      {tenantUser.isActive ? "Активен" : "Неактивен"}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isLoading}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Изменить роль</DropdownMenuItem>
                        <DropdownMenuItem>{tenantUser.isActive ? "Деактивировать" : "Активировать"}</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleRemoveUser(tenantUser.userId)}
                        >
                          Удалить из теnanта
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
