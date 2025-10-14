import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Building2, Users, FileText, File, FolderOpen, ShieldCheck, Layers } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"

const tenantSections = [
  {
    category: "Организационная структура",
    items: [
      {
        title: "Организации",
        description: "Иерархия организаций тенанта",
        href: "/admin/organizations",
        icon: Building2,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
      },
      {
        title: "Пользователи",
        description: "Пользователи тенанта",
        href: "/admin/users",
        icon: Users,
        color: "text-green-600",
        bgColor: "bg-green-50",
      },
    ],
  },
  {
    category: "Комплаенс и контроли",
    items: [
      {
        title: "Требования",
        description: "Требования для организаций",
        href: "/admin/requirements",
        icon: FileText,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      },
      {
        title: "Меры защиты",
        description: "Контроли и меры",
        href: "/admin/controls",
        icon: ShieldCheck,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
      },
      {
        title: "Типовые меры",
        description: "Шаблоны контролей",
        href: "/admin/control-templates",
        icon: Layers,
        color: "text-violet-600",
        bgColor: "bg-violet-50",
      },
    ],
  },
  {
    category: "Документы и доказательства",
    items: [
      {
        title: "Документы",
        description: "Документы тенанта",
        href: "/admin/documents",
        icon: File,
        color: "text-cyan-600",
        bgColor: "bg-cyan-50",
      },
      {
        title: "Доказательства",
        description: "Ревью и одобрение",
        href: "/admin/evidence",
        icon: FolderOpen,
        color: "text-teal-600",
        bgColor: "bg-teal-50",
      },
    ],
  },
]

export default async function TenantAdminPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userData?.role !== "super_admin" && userData?.role !== "admin") {
    redirect("/")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Настройки тенанта</h1>
        <p className="text-sm text-muted-foreground">
          Управление организациями, пользователями и данными текущего тенанта
        </p>
      </div>

      {tenantSections.map((section) => (
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
