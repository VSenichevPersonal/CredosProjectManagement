import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Settings } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

export default async function AdminSettingsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userData?.role !== "super_admin") {
    redirect("/")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Настройки системы</h1>
          <p className="text-sm text-muted-foreground">Глобальные настройки и конфигурация системы</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Применимость требований</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Автоматический пересчет применимости</Label>
                <p className="text-sm text-muted-foreground">
                  Пересчитывать применимые требования при изменении атрибутов организации
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="space-y-2">
              <Label>Периодичность пересчета (часы)</Label>
              <Input type="number" defaultValue="24" className="w-32" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Уведомления</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Уведомления о новых доказательствах</Label>
                <p className="text-sm text-muted-foreground">
                  Отправлять уведомления администраторам о загруженных доказательствах
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Уведомления о просроченных требованиях</Label>
                <p className="text-sm text-muted-foreground">Отправлять уведомления о требованиях с истекшим сроком</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Экспорт отчетов</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Формат экспорта по умолчанию</Label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Включать конфиденциальные данные</Label>
                <p className="text-sm text-muted-foreground">
                  Включать конфиденциальную информацию в экспортируемые отчеты
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button>Сохранить настройки</Button>
        </div>
      </div>
    </div>
  )
}
