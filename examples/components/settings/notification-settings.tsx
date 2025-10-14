"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Bell } from "lucide-react"

export function NotificationSettings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    emailNewRequirement: true,
    emailDeadlineReminder: true,
    emailStatusChange: true,
    emailComments: false,
    inAppNewRequirement: true,
    inAppDeadlineReminder: true,
    inAppStatusChange: true,
    inAppComments: true,
  })

  const handleSave = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/users/notification-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!response.ok) throw new Error("Failed to update settings")

      toast({
        title: "Настройки сохранены",
        description: "Ваши предпочтения уведомлений обновлены",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <CardTitle>Настройки уведомлений</CardTitle>
        </div>
        <CardDescription>Выберите, какие уведомления вы хотите получать</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Email уведомления</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-new-requirement">Новые требования</Label>
                <p className="text-sm text-muted-foreground">Когда вам назначено новое требование</p>
              </div>
              <Switch
                id="email-new-requirement"
                checked={settings.emailNewRequirement}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNewRequirement: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-deadline">Напоминания о дедлайнах</Label>
                <p className="text-sm text-muted-foreground">За 7 дней до истечения срока</p>
              </div>
              <Switch
                id="email-deadline"
                checked={settings.emailDeadlineReminder}
                onCheckedChange={(checked) => setSettings({ ...settings, emailDeadlineReminder: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-status">Изменения статуса</Label>
                <p className="text-sm text-muted-foreground">Когда статус требования изменен</p>
              </div>
              <Switch
                id="email-status"
                checked={settings.emailStatusChange}
                onCheckedChange={(checked) => setSettings({ ...settings, emailStatusChange: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-comments">Комментарии</Label>
                <p className="text-sm text-muted-foreground">Когда кто-то комментирует ваше требование</p>
              </div>
              <Switch
                id="email-comments"
                checked={settings.emailComments}
                onCheckedChange={(checked) => setSettings({ ...settings, emailComments: checked })}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Уведомления в системе</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inapp-new-requirement">Новые требования</Label>
                <p className="text-sm text-muted-foreground">Показывать в колокольчике уведомлений</p>
              </div>
              <Switch
                id="inapp-new-requirement"
                checked={settings.inAppNewRequirement}
                onCheckedChange={(checked) => setSettings({ ...settings, inAppNewRequirement: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inapp-deadline">Напоминания о дедлайнах</Label>
                <p className="text-sm text-muted-foreground">Показывать приближающиеся дедлайны</p>
              </div>
              <Switch
                id="inapp-deadline"
                checked={settings.inAppDeadlineReminder}
                onCheckedChange={(checked) => setSettings({ ...settings, inAppDeadlineReminder: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inapp-status">Изменения статуса</Label>
                <p className="text-sm text-muted-foreground">Уведомления об обновлениях статуса</p>
              </div>
              <Switch
                id="inapp-status"
                checked={settings.inAppStatusChange}
                onCheckedChange={(checked) => setSettings({ ...settings, inAppStatusChange: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inapp-comments">Комментарии</Label>
                <p className="text-sm text-muted-foreground">Новые комментарии к вашим требованиям</p>
              </div>
              <Switch
                id="inapp-comments"
                checked={settings.inAppComments}
                onCheckedChange={(checked) => setSettings({ ...settings, inAppComments: checked })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить настройки
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
