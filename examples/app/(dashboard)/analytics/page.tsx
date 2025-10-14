import { getCurrentUser } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ComplianceTrendChart } from "@/components/analytics/compliance-trend-chart"
import { OrganizationComparisonChart } from "@/components/analytics/organization-comparison-chart"
import { RequirementCategoryChart } from "@/components/analytics/requirement-category-chart"
import { RiskHeatmap } from "@/components/analytics/risk-heatmap"
import { ComplianceByRegulatorChart } from "@/components/analytics/compliance-by-regulator-chart"
import { logger } from "@/lib/logger"

export default async function AnalyticsPage() {
  logger.info("[v0] Analytics page: Loading")

  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
  }

  console.log("[v0] Analytics: Loading data for tenant", { tenantId: user.tenantId })

  const supabase = await createServerClient()

  const requirementsQuery = supabase.from("requirements").select("*")
  if (user.tenantId) {
    requirementsQuery.eq("tenant_id", user.tenantId)
  }

  const complianceQuery = supabase
    .from("compliance_records")
    .select("*, requirement:requirements(category, regulator_id)")
  if (user.tenantId) {
    complianceQuery.eq("tenant_id", user.tenantId)
  }

  const organizationsQuery = supabase.from("organizations").select("*")
  if (user.tenantId) {
    organizationsQuery.eq("tenant_id", user.tenantId)
  }

  const risksQuery = supabase.from("risks").select("*")
  if (user.tenantId) {
    risksQuery.eq("tenant_id", user.tenantId)
  }

  // Fetch analytics data
  const [{ data: requirements }, { data: compliance }, { data: organizations }, { data: risks }] = await Promise.all([
    requirementsQuery,
    complianceQuery,
    organizationsQuery,
    risksQuery,
  ])

  console.log("[v0] Analytics: Data loaded", {
    requirements: requirements?.length || 0,
    compliance: compliance?.length || 0,
    organizations: organizations?.length || 0,
    risks: risks?.length || 0,
  })

  const trendData = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = monthDate.toLocaleDateString("ru-RU", { month: "short" })
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

    const monthRecords =
      compliance?.filter((r) => {
        const updatedAt = new Date(r.updated_at)
        return updatedAt >= monthStart && updatedAt <= monthEnd
      }) || []

    const monthCompleted = monthRecords.filter((r) => r.status === "compliant").length
    const monthInProgress = monthRecords.filter((r) => r.status === "in_progress").length
    const monthNotStarted = monthRecords.filter((r) => r.status === "not_started").length

    trendData.push({
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      completed: monthCompleted,
      inProgress: monthInProgress,
      notStarted: monthNotStarted,
    })
  }

  // Calculate statistics
  const totalRequirements = requirements?.length || 0
  const completedCompliance = compliance?.filter((c) => c.status === "compliant").length || 0
  const overallCompletionRate = totalRequirements > 0 ? Math.round((completedCompliance / totalRequirements) * 100) : 0

  const criticalRequirements = requirements?.filter((r) => r.criticality === "critical").length || 0
  const criticalCompleted =
    compliance?.filter(
      (c) =>
        c.status === "compliant" && requirements?.find((r) => r.id === c.requirement_id)?.criticality === "critical",
    ).length || 0
  const criticalCompletionRate =
    criticalRequirements > 0 ? Math.round((criticalCompleted / criticalRequirements) * 100) : 0

  const totalRisks = risks?.length || 0
  const criticalRisks = risks?.filter((r) => r.risk_level === "critical").length || 0
  const highRisks = risks?.filter((r) => r.risk_level === "high").length || 0

  logger.info("[v0] Analytics page: Data loaded", { totalRequirements, overallCompletionRate })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Расширенная аналитика</h1>
        <p className="text-muted-foreground">Детальный анализ состояния комплаенса и рисков</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Общее выполнение</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallCompletionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedCompliance} из {totalRequirements} требований
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Критические требования</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{criticalCompletionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {criticalCompleted} из {criticalRequirements} выполнено
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Всего рисков</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalRisks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {criticalRisks} критических, {highRisks} высоких
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Организации</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{organizations?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Подведомственных учреждений</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Тренды</TabsTrigger>
          <TabsTrigger value="comparison">Сравнение</TabsTrigger>
          <TabsTrigger value="categories">Категории</TabsTrigger>
          <TabsTrigger value="risks">Риски</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <ComplianceTrendChart trendData={trendData} />
          <ComplianceByRegulatorChart compliance={compliance || []} />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <OrganizationComparisonChart organizations={organizations || []} compliance={compliance || []} />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <RequirementCategoryChart requirements={requirements || []} compliance={compliance || []} />
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <RiskHeatmap risks={risks || []} organizations={organizations || []} />
        </TabsContent>
      </Tabs>

      {/* Detailed Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Топ организаций по выполнению</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {organizations?.slice(0, 5).map((org) => {
                const orgCompliance = compliance?.filter((c) => c.organization_id === org.id) || []
                const completed = orgCompliance.filter((c) => c.status === "compliant").length
                const total = orgCompliance.length
                const rate = total > 0 ? Math.round((completed / total) * 100) : 0

                return (
                  <div key={org.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{org.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${rate}%` }} />
                      </div>
                      <span className="text-sm font-bold w-12 text-right">{rate}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Требования с низким выполнением</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requirements?.slice(0, 5).map((req) => {
                const reqCompliance = compliance?.filter((c) => c.requirement_id === req.id) || []
                const completed = reqCompliance.filter((c) => c.status === "compliant").length
                const total = reqCompliance.length
                const rate = total > 0 ? Math.round((completed / total) * 100) : 0

                return (
                  <div key={req.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{req.code}</span>
                      <p className="text-xs text-muted-foreground truncate">{req.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500" style={{ width: `${rate}%` }} />
                      </div>
                      <span className="text-sm font-bold w-12 text-right">{rate}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
