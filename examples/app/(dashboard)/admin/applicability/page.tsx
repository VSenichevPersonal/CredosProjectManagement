import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Filter } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function AdminApplicabilityPage() {
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

  const { data: rules } = await supabase
    .from("requirement_applicability_rules")
    .select("*, requirements(code, title)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Filter className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Правила применимости</h1>
            <p className="text-sm text-muted-foreground">
              Шаблоны правил для массового применения требований к организациям
            </p>
          </div>
        </div>
        <Button>Создать шаблон правила</Button>
      </div>

      <div className="grid gap-4">
        {rules?.map((rule) => (
          <Card key={rule.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">
                  {rule.requirements?.code}: {rule.requirements?.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Применяется автоматически: {rule.is_automatic ? "Да" : "Нет"}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {rule.filters &&
                    Object.entries(rule.filters as Record<string, any>).map(([key, value]) => (
                      <span key={key} className="text-xs bg-secondary px-2 py-1 rounded">
                        {key}: {JSON.stringify(value)}
                      </span>
                    ))}
                </div>
              </div>
              <Button variant="outline" size="sm">
                Редактировать
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
