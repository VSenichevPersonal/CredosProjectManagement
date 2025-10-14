/**
 * @intent: Manager for notification settings
 * @llm-note: User preferences for toast notifications
 */

"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Save } from "lucide-react"

interface NotificationSettings {
  toastDurationMs: number
  toastPosition: string
  maxToastsVisible: number
  showSuccess: boolean
  showInfo: boolean
  showWarning: boolean
  showError: boolean
  playSound: boolean
  emailNotifications: boolean
}

export function NotificationSettingsManager() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<NotificationSettings>({
    toastDurationMs: 3000,
    toastPosition: 'top-right',
    maxToastsVisible: 3,
    showSuccess: true,
    showInfo: true,
    showWarning: true,
    showError: true,
    playSound: false,
    emailNotifications: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/notifications')
      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          setSettings(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!response.ok) throw new Error('Failed to save')

      toast({
        title: "✅ Настройки сохранены",
        description: "Изменения применены успешно"
      })
    } catch (error) {
      toast({
        title: "❌ Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Загрузка настроек...</div>
  }

  return (
    <div className="space-y-6">
      {/* Toast Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Всплывающие уведомления</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Длительность показа (мс)</Label>
            <Input
              type="number"
              min="1000"
              max="10000"
              step="1000"
              value={settings.toastDurationMs}
              onChange={(e) => setSettings({ 
                ...settings, 
                toastDurationMs: parseInt(e.target.value) 
              })}
            />
            <p className="text-xs text-muted-foreground">
              По умолчанию: 3000 мс (3 секунды)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Позиция на экране</Label>
            <Select
              value={settings.toastPosition}
              onValueChange={(value) => setSettings({ ...settings, toastPosition: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-right">Сверху справа</SelectItem>
                <SelectItem value="top-left">Сверху слева</SelectItem>
                <SelectItem value="bottom-right">Снизу справа</SelectItem>
                <SelectItem value="bottom-left">Снизу слева</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Максимум одновременно</Label>
            <Input
              type="number"
              min="1"
              max="5"
              value={settings.maxToastsVisible}
              onChange={(e) => setSettings({ 
                ...settings, 
                maxToastsVisible: parseInt(e.target.value) 
              })}
            />
            <p className="text-xs text-muted-foreground">
              Сколько уведомлений показывать одновременно (1-5)
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Notification Types */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Типы уведомлений</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Успешные операции</Label>
              <p className="text-sm text-muted-foreground">
                ✅ Показывать уведомления об успешных действиях
              </p>
            </div>
            <Switch
              checked={settings.showSuccess}
              onCheckedChange={(checked) => setSettings({ ...settings, showSuccess: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Информационные</Label>
              <p className="text-sm text-muted-foreground">
                ℹ️ Показывать информационные сообщения
              </p>
            </div>
            <Switch
              checked={settings.showInfo}
              onCheckedChange={(checked) => setSettings({ ...settings, showInfo: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Предупреждения</Label>
              <p className="text-sm text-muted-foreground">
                ⚠️ Показывать предупреждения
              </p>
            </div>
            <Switch
              checked={settings.showWarning}
              onCheckedChange={(checked) => setSettings({ ...settings, showWarning: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ошибки</Label>
              <p className="text-sm text-muted-foreground">
                ❌ Показывать уведомления об ошибках
              </p>
            </div>
            <Switch
              checked={settings.showError}
              onCheckedChange={(checked) => setSettings({ ...settings, showError: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Sound */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Звуковые уведомления</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Звук при уведомлениях</Label>
              <p className="text-sm text-muted-foreground">
                Воспроизводить звук при появлении уведомлений
              </p>
            </div>
            <Switch
              checked={settings.playSound}
              onCheckedChange={(checked) => setSettings({ ...settings, playSound: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Звук при ошибках</Label>
              <p className="text-sm text-muted-foreground">
                Воспроизводить звук при критичных ошибках
              </p>
            </div>
            <Switch
              checked={settings.soundOnError}
              onCheckedChange={(checked) => setSettings({ ...settings, soundOnError: checked })}
              disabled={!settings.playSound}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            "Сохранение..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Сохранить настройки
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

