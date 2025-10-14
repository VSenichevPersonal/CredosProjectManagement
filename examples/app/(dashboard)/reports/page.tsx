import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-user"
import { ReadinessReport } from "@/components/reports/readiness-report"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrganizationComplianceReport } from "@/components/reports/organization-compliance-report"
import { ExportButtons } from "@/components/reports/export-buttons"

export default async function ReportsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
  }

  console.log("[v0] Reports: Loading data for tenant", { tenantId: user.tenantId })

  const supabase = await createServerClient()

  const organizationsQuery = supabase.from("organizations").select("id, name").order("name")
  if (user.tenantId) {
    organizationsQuery.eq("tenant_id", user.tenantId)
  }

  const { data: organizations } = await organizationsQuery

  console.log("[v0] Reports: Organizations loaded", { count: organizations?.length || 0 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Отчеты и аналитика</h1>
          <p className="text-muted-foreground mt-2">Генерация отчетов для регуляторов и руководства</p>
        </div>
        <ExportButtons />
      </div>

      <Tabs defaultValue="readiness" className="w-full">
        <TabsList>
          <TabsTrigger value="readiness">Отчет о готовности</TabsTrigger>
          <TabsTrigger value="compliance">Детальный отчет</TabsTrigger>
          <TabsTrigger value="executive">Executive Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="readiness" className="mt-6">
          <ReadinessReport organizations={organizations || []} />
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <OrganizationComplianceReport organizations={organizations || []} />
        </TabsContent>

        <TabsContent value="executive" className="mt-6">
          <Card className="p-6">
            <p className="text-muted-foreground">Executive Summary будет доступен в следующей версии</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
