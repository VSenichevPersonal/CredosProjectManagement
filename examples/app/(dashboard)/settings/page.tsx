/**
 * @intent: User settings page
 * @llm-note: Personal settings including notification preferences
 */

import { Suspense } from "react"
import { NotificationSettingsManager } from "@/components/settings/notification-settings-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, User } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Настройки</h1>
        <p className="text-muted-foreground mt-2">
          Персональные настройки и предпочтения
        </p>
      </div>
      
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Уведомления</CardTitle>
          </div>
          <CardDescription>
            Настройте как вы хотите получать уведомления
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8">Загрузка...</div>}>
            <NotificationSettingsManager />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
