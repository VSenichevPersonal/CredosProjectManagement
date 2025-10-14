import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Shield, Database, Settings } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"

const adminCategories = [
  {
    title: "Настройки тенанта",
    description: "Управление организациями, пользователями и данными текущего тенанта",
    href: "/admin/tenant",
    icon: Database,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    hoverColor: "hover:border-blue-500",
  },
  {
    title: "Системные настройки",
    description: "Глобальные настройки системы, тенанты и справочники",
    href: "/admin/system",
    icon: Settings,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    hoverColor: "hover:border-purple-500",
  },
]

export default async function AdminPage() {
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
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Администрирование</h1>
          <p className="text-sm text-muted-foreground">Выберите раздел для управления системой</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 max-w-4xl">
        {adminCategories.map((category) => (
          <Link key={category.href} href={category.href}>
            <Card className={`group p-6 transition-all hover:shadow-lg ${category.hoverColor}`}>
              <div className="flex items-start gap-4">
                <div
                  className={`rounded-lg p-3 ${category.bgColor} ${category.color} transition-transform group-hover:scale-110`}
                >
                  <category.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
