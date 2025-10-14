import { createServerClient } from "@/lib/supabase/server"
import { NotificationList } from "@/components/notifications/notification-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, CheckCircle2, AlertCircle } from "lucide-react"

export default async function NotificationsPage() {
  const supabase = await createServerClient()

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  const totalCount = notifications?.length || 0
  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0
  const readCount = totalCount - unreadCount

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Уведомления</h1>
        <p className="text-muted-foreground">Все системные уведомления и оповещения</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Всего уведомлений</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Непрочитанных</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Прочитанных</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список уведомлений</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationList notifications={notifications || []} />
        </CardContent>
      </Card>
    </div>
  )
}
