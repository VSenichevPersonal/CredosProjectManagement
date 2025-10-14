"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils/cn"

interface Notification {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?limit=5")
      const data = await response.json()
      setNotifications(data.data || [])
      setUnreadCount(data.data?.filter((n: Notification) => !n.is_read).length || 0)
    } catch (error) {
      console.error("[v0] Failed to fetch notifications:", error)
    }
  }

  const markAllAsRead = async () => {
    setLoading(true)
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" })
      await fetchNotifications()
    } catch (error) {
      console.error("[v0] Failed to mark all as read:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Уведомления</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={loading}
              className="h-auto p-1 text-xs hover:bg-accent"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Прочитать все
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Нет новых уведомлений</div>
        ) : (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} asChild>
                <Link
                  href="/notifications"
                  className={cn("flex flex-col items-start gap-1 p-3", !notification.is_read && "bg-accent/20")}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span className={cn("text-sm", !notification.is_read && "font-semibold")}>
                      {notification.title}
                    </span>
                    {!notification.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-2">{notification.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="w-full text-center text-sm font-medium">
                Показать все
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
