"use client"

/**
 * Tenant Audit Tab
 *
 * Displays audit log of tenant changes
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { TenantAuditEntry } from "@/types/domain/tenant"
import { Clock, User } from "lucide-react"

interface TenantAuditTabProps {
  auditLog: TenantAuditEntry[]
}

export function TenantAuditTab({ auditLog }: TenantAuditTabProps) {
  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: "Создан",
      updated: "Обновлен",
      renamed: "Переименован",
      settings_changed: "Настройки изменены",
      activated: "Активирован",
      deactivated: "Деактивирован",
      suspended: "Приостановлен",
      user_added: "Пользователь добавлен",
      user_removed: "Пользователь удален",
      user_role_changed: "Роль изменена",
    }
    return labels[action] || action
  }

  const getActionColor = (action: string) => {
    if (action === "created") return "default"
    if (action.includes("user")) return "secondary"
    if (action === "deactivated" || action === "suspended") return "destructive"
    return "outline"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>История изменений</CardTitle>
      </CardHeader>
      <CardContent>
        {auditLog.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Нет записей в журнале</div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex gap-4 pb-4 border-b last:border-0">
                  <div className="flex-shrink-0 w-2 bg-primary rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={getActionColor(entry.action)}>{getActionLabel(entry.action)}</Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(entry.performedAt).toLocaleString("ru-RU")}
                      </div>
                    </div>

                    {entry.user && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        {entry.user.name || entry.user.email}
                      </div>
                    )}

                    {entry.changes && Object.keys(entry.changes).length > 0 && (
                      <div className="text-sm">
                        <p className="text-muted-foreground mb-1">Изменения:</p>
                        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(entry.changes, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
