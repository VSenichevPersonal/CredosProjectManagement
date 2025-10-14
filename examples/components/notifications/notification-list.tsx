"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  FileText,
  Users,
  Building2,
  Upload,
  Trash2,
  Shield,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  metadata?: Record<string, any>
}

interface NotificationListProps {
  notifications: Notification[]
}

const NOTIFICATION_ICONS: Record<string, any> = {
  deadline: AlertCircle,
  deadline_approaching: Clock,
  status_change: CheckCircle2,
  status_changed: CheckCircle2,
  assignment: Users,
  requirement_assigned: Users,
  document: FileText,
  organization: Building2,
  info: Info,
  review_requested: Shield,
  approved: CheckCircle2,
  rejected: AlertCircle,
  comment_added: Info,
  evidence_uploaded: Upload,
  evidence_approved: CheckCircle2,
  evidence_rejected: AlertCircle,
  bulk_operation_completed: Trash2,
  control_test_due: Clock,
  compliance_record_created: FileText,
}

const NOTIFICATION_COLORS: Record<string, string> = {
  deadline: "text-orange-500",
  deadline_approaching: "text-orange-500",
  status_change: "text-green-500",
  status_changed: "text-green-500",
  assignment: "text-blue-500",
  requirement_assigned: "text-blue-500",
  document: "text-purple-500",
  organization: "text-cyan-500",
  info: "text-gray-500",
  review_requested: "text-yellow-600",
  approved: "text-green-600",
  rejected: "text-red-600",
  comment_added: "text-blue-400",
  evidence_uploaded: "text-purple-600",
  evidence_approved: "text-green-600",
  evidence_rejected: "text-red-600",
  bulk_operation_completed: "text-indigo-600",
  control_test_due: "text-orange-600",
  compliance_record_created: "text-teal-600",
}

export function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const markAsRead = async (notificationId: string) => {
    setLoading(notificationId)
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      })

      if (!response.ok) throw new Error("Failed to mark as read")

      router.refresh()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отметить уведомление как прочитанное",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to mark all as read")

      toast({
        title: "Успешно",
        description: "Все уведомления отмечены как прочитанные",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отметить все уведомления как прочитанные",
        variant: "destructive",
      })
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground">Нет уведомлений</p>
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Непрочитанных: <span className="font-medium">{unreadCount}</span>
          </p>
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Отметить все как прочитанные
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notification) => {
          const Icon = NOTIFICATION_ICONS[notification.type] || Bell
          const iconColor = NOTIFICATION_COLORS[notification.type] || "text-gray-500"

          return (
            <div
              key={notification.id}
              className={cn(
                "flex gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50",
                !notification.is_read && "bg-accent/20",
              )}
            >
              <div className={cn("mt-1 shrink-0", iconColor)}>
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={cn("text-sm font-medium", !notification.is_read && "font-semibold")}>
                    {notification.title}
                  </h4>
                  {!notification.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                </div>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </p>
              </div>

              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAsRead(notification.id)}
                  disabled={loading === notification.id}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
