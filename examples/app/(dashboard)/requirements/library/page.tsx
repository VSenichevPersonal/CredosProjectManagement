import { createServerClient } from "@/lib/supabase/server"
import { RequirementsLibrary } from "@/components/requirements/requirements-library"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function RequirementsLibraryPage() {
  const supabase = await createServerClient()

  // Fetch templates data
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/requirements/templates`,
    {
      cache: "no-store",
    },
  )
  const { data: templates } = await response.json()

  // Get total requirements count
  const { count: totalRequirements } = await supabase.from("requirements").select("*", { count: "exact", head: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Библиотека требований</h1>
        <p className="text-muted-foreground">Готовые наборы требований по российскому законодательству</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Информация</AlertTitle>
        <AlertDescription>
          В системе уже загружено {totalRequirements || 0} требований. Вы можете импортировать дополнительные шаблоны
          или создать собственные требования.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Доступные шаблоны</CardTitle>
          <CardDescription>Выберите шаблон для импорта требований в систему</CardDescription>
        </CardHeader>
        <CardContent>
          <RequirementsLibrary templates={templates || []} />
        </CardContent>
      </Card>
    </div>
  )
}
