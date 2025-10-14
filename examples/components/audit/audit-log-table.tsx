"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, RotateCcw, FileSearch } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { UniversalDataTable } from "@/components/shared/universal-data-table"
import type { ColumnDefinition } from "@/types/table"

interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  changes: any
  ip_address?: string
  user_agent?: string
  created_at: string
  user?: { name: string; email: string }
}

interface AuditLogTableProps {
  logs: AuditLog[]
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-500/10 text-green-700 border-green-500/20",
  update: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  delete: "bg-red-500/10 text-red-700 border-red-500/20",
  bulk_create: "bg-green-600/10 text-green-800 border-green-600/20",
  bulk_update: "bg-blue-600/10 text-blue-800 border-blue-600/20",
  bulk_delete: "bg-red-600/10 text-red-800 border-red-600/20",
}

const ACTION_LABELS: Record<string, string> = {
  create: "Создание",
  update: "Обновление",
  delete: "Удаление",
  bulk_create: "Массовое создание",
  bulk_update: "Массовое обновление",
  bulk_delete: "Массовое удаление",
}

// Column definitions for UniversalDataTable
const AUDIT_COLUMNS: ColumnDefinition<AuditLog>[] = [
  {
    id: "created_at",
    label: "Дата и время",
    key: "created_at",
    sortable: true,
    defaultVisible: true,
    width: "180px",
    render: (value) => (
      <span className="text-sm">
        {formatDistanceToNow(new Date(value), { addSuffix: true, locale: ru })}
      </span>
    ),
    exportRender: (value) => new Date(value).toLocaleString("ru-RU"),
  },
  {
    id: "user",
    label: "Пользователь",
    key: "user",
    sortable: false,
    defaultVisible: true,
    render: (user) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">{user?.name || "Неизвестно"}</span>
        <span className="text-xs text-muted-foreground">{user?.email}</span>
      </div>
    ),
    exportRender: (user) => user?.email || "Unknown",
  },
  {
    id: "action",
    label: "Действие",
    key: "action",
    sortable: true,
    defaultVisible: true,
    width: "150px",
    render: (value) => (
      <Badge variant="outline" className={ACTION_COLORS[value] || ""}>
        {ACTION_LABELS[value] || value}
      </Badge>
    ),
    exportRender: (value) => ACTION_LABELS[value] || value,
  },
  {
    id: "entity_type",
    label: "Тип сущности",
    key: "entity_type",
    sortable: true,
    defaultVisible: true,
    width: "150px",
  },
  {
    id: "entity_id",
    label: "ID сущности",
    key: "entity_id",
    sortable: false,
    defaultVisible: false,
    render: (value) => <span className="font-mono text-xs">{value?.slice(0, 8)}...</span>,
  },
  {
    id: "ip_address",
    label: "IP адрес",
    key: "ip_address",
    sortable: false,
    defaultVisible: true,
    width: "140px",
    render: (value) => <span className="text-sm">{value || "—"}</span>,
  },
  {
    id: "user_agent",
    label: "User Agent",
    key: "user_agent",
    sortable: false,
    defaultVisible: false,
    render: (value) => <span className="text-xs truncate max-w-[200px]">{value || "—"}</span>,
  },
]

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [rollbackOpen, setRollbackOpen] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setDetailsOpen(true)
  }

  const handleRollback = async () => {
    if (!selectedLog) return

    setIsRollingBack(true)
    try {
      const response = await fetch("/api/audit/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditLogId: selectedLog.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to rollback operation")
      }

      setRollbackOpen(false)
      window.location.reload()
    } catch (error) {
      console.error("Rollback failed:", error)
      alert("Не удалось откатить операцию")
    } finally {
      setIsRollingBack(false)
    }
  }

  // Add custom actions column
  const columnsWithActions: ColumnDefinition<AuditLog>[] = [
    ...AUDIT_COLUMNS,
    {
      id: "actions",
      label: "Действия",
      sortable: false,
      defaultVisible: true,
      width: "120px",
      align: "right",
      render: (_, log) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(log)}>
            <Eye className="h-4 w-4" />
          </Button>
          {(log.action === "create" || log.action === "update" || log.action === "delete") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedLog(log)
                setRollbackOpen(true)
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <UniversalDataTable
        title="Журнал аудита"
        description="История всех действий пользователей в системе"
        icon={FileSearch}
        data={logs}
        columns={columnsWithActions}
        searchPlaceholder="Поиск по пользователю, действию, типу..."
        exportFilename="audit-log"
        canExport={true}
        canImport={false}
        storageKey="audit-log-table"
        emptyStateTitle="Нет записей в журнале"
        emptyStateDescription="Журнал аудита пуст"
        emptyStateIcon={FileSearch}
      />

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Детали операции</DialogTitle>
            <DialogDescription>Полная информация о действии пользователя</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Пользователь</p>
                  <p className="text-sm">{selectedLog.user?.name || "Неизвестно"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedLog.user?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Действие</p>
                  <Badge variant="outline" className={ACTION_COLORS[selectedLog.action] || ""}>
                    {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Дата</p>
                  <p className="text-sm">{new Date(selectedLog.created_at).toLocaleString("ru-RU")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IP адрес</p>
                  <p className="text-sm font-mono">{selectedLog.ip_address || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User Agent</p>
                  <p className="text-xs truncate">{selectedLog.user_agent || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Изменения</p>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                  {JSON.stringify(selectedLog.changes, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rollbackOpen} onOpenChange={setRollbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Откатить операцию</DialogTitle>
            <DialogDescription>Вы уверены, что хотите откатить эту операцию?</DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Это действие отменит изменения, внесенные выбранной операцией. Откат также будет записан в журнал аудита.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRollbackOpen(false)} disabled={isRollingBack}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleRollback} disabled={isRollingBack}>
              {isRollingBack ? "Откат..." : "Откатить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
