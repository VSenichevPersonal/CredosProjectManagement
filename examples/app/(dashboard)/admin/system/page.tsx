import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Database, UserCog, Filter, Settings } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"

const systemSections = [
  {
    category: "Мультитенантность",
    items: [
      {
        title: "Тенанты",
        description: "Управление вертикалями системы",
        href: "/admin/tenants",
        icon: Database,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
      },
    ],
  },
  {
    category: "Права доступа",
    items: [
      {
        title: "Роли и права",
        description: "RBAC и разрешения",
        href: "/admin/roles",
        icon: UserCog,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
      },
    ],
  },
  {
    category: "Конфигурация",
    items: [
      {
        title: "Правила применимости",
        description: "Шаблоны правил",
        href: "/admin/applicability",
        icon: Filter,
        color: "text-pink-600",
        bgColor: "bg-pink-50",
      },
      {
        title: "Настройки системы",
        description: "Глобальные параметры",
        href: "/admin/settings",
        icon: Settings,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
      },
    ],
  },
]

export default async function SystemAdminPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  // Только super_admin может видеть системные настройки
  if (userData?.role !== "super_admin") {
    redirect("/admin/tenant")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Системные настройки</h1>
        <p className="text-sm text-muted-foreground">
          Глобальные настройки системы, управление тенантами и справочниками
        </p>
      </div>

      {systemSections.map((section) => (
        <div key={section.category} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{section.category}</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="group p-4 transition-all hover:shadow-md hover:border-primary/50">
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-md p-2 ${item.bgColor} ${item.color} transition-transform group-hover:scale-110`}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
