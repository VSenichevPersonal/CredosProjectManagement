import { KPICard } from "@/components/dashboard/kpi-card"
import { RequirementsTable } from "@/components/dashboard/requirements-table"
import { ComplianceChart } from "@/components/dashboard/compliance-chart"
import { TrendChart } from "@/components/dashboard/trend-chart"
import { ComplianceOverviewCard } from "@/components/dashboard/compliance-overview-card"
import { ControlsStatsCard } from "@/components/dashboard/controls-stats-card"
import { EvidenceStatsCard } from "@/components/dashboard/evidence-stats-card"
import { WelcomeTour } from "@/components/help/welcome-tour"
import { ComplianceTrendChart } from "@/components/analytics/compliance-trend-chart"
import { OrganizationComparisonChart } from "@/components/analytics/organization-comparison-chart"
import { RequirementCategoryChart } from "@/components/analytics/requirement-category-chart"
import { RiskHeatmap } from "@/components/analytics/risk-heatmap"
import { ComplianceByRegulatorChart } from "@/components/analytics/compliance-by-regulator-chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  console.log("[v0] Dashboard: Loading data for tenant", { tenantId: user.tenantId })

  const supabase = await createServerClient()

  const requirementsQuery = supabase
    .from("requirements")
    .select("*, document:regulatory_frameworks(*)")
    .order("created_at", { ascending: false })

  if (user.tenantId) {
    requirementsQuery.eq("tenant_id", user.tenantId)
  }

  const complianceQuery = supabase
    .from("compliance_records")
    .select("*, requirement:requirements(*), organization:organizations(*)")
    .order("updated_at", { ascending: false })

  if (user.tenantId) {
    complianceQuery.eq("tenant_id", user.tenantId)
  }

  if (user.organizationId) {
    complianceQuery.eq("organization_id", user.organizationId)
  }

  // Stage 14: Use control_measures instead of organization_controls
  const controlsQuery = supabase.from("control_measures").select("status, tenant_id, organization_id")

  if (user.tenantId) {
    controlsQuery.eq("tenant_id", user.tenantId)
  }

  if (user.organizationId) {
    controlsQuery.eq("organization_id", user.organizationId)
  }

  const evidenceQuery = supabase.from("evidence").select("status, tenant_id")

  if (user.tenantId) {
    evidenceQuery.eq("tenant_id", user.tenantId)
  }

  const organizationsQuery = supabase.from("organizations").select("*")

  if (user.tenantId) {
    organizationsQuery.eq("tenant_id", user.tenantId)
  }

  const risksQuery = supabase.from("risks").select("*")

  const [requirementsResult, complianceResult, controlsResult, evidenceResult, organizationsResult, risksResult] =
    await Promise.all([
      requirementsQuery,
      complianceQuery,
      controlsQuery,
      evidenceQuery,
      organizationsQuery,
      risksQuery,
    ])

  console.log("[v0] Dashboard: Data loaded", {
    requirements: requirementsResult.data?.length || 0,
    compliance: complianceResult.data?.length || 0,
    controls: controlsResult.data?.length || 0,
    evidence: evidenceResult.data?.length || 0,
    organizations: organizationsResult.data?.length || 0,
  })

  const requirements = requirementsResult.data || []
  const complianceList = complianceResult.data || []
  const controls = controlsResult.data || []
  const evidence = evidenceResult.data || []
  const organizations = organizationsResult.data || []
  const risks = risksResult.data || []

  const stats = {
    total: requirements.length,
    completed: complianceList.filter((c) => c.status === "compliant").length,
    inProgress: complianceList.filter((c) => c.status === "in_progress").length,
    overdue: complianceList.filter((c) => c.status === "non_compliant").length,
  }

  // Stage 14: control_measures statuses
  const controlsStats = {
    total: controls.length,
    implemented: controls.filter((c) => c.status === "implemented" || c.status === "verified").length,
    inProgress: controls.filter((c) => c.status === "in_progress").length,
    notStarted: controls.filter((c) => c.status === "planned" || c.status === "not_started").length,
  }

  const evidenceStats = {
    total: evidence.length,
    approved: evidence.filter((e) => e.status === "approved").length,
    pending: evidence.filter((e) => e.status === "pending").length,
    rejected: evidence.filter((e) => e.status === "rejected").length,
  }

  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const currentMonthCompliance = complianceList.filter((c) => {
    const updatedAt = new Date(c.updated_at)
    return updatedAt >= currentMonthStart
  })

  const previousMonthCompliance = complianceList.filter((c) => {
    const updatedAt = new Date(c.updated_at)
    return updatedAt >= previousMonthStart && updatedAt <= previousMonthEnd
  })

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, direction: "neutral" as const }
    const change = ((current - previous) / previous) * 100
    const roundedChange = Math.round(change)
    return {
      value: roundedChange,
      direction: roundedChange > 0 ? ("up" as const) : roundedChange < 0 ? ("down" as const) : ("neutral" as const),
    }
  }

  const currentCompleted = currentMonthCompliance.filter((c) => c.status === "compliant").length
  const previousCompleted = previousMonthCompliance.filter((c) => c.status === "compliant").length
  const completedTrend = calculateTrend(currentCompleted, previousCompleted)

  const currentInProgress = currentMonthCompliance.filter((c) => c.status === "in_progress").length
  const previousInProgress = previousMonthCompliance.filter((c) => c.status === "in_progress").length
  const inProgressTrend = calculateTrend(currentInProgress, previousInProgress)

  const currentOverdue = currentMonthCompliance.filter((c) => c.status === "non_compliant").length
  const previousOverdue = previousMonthCompliance.filter((c) => c.status === "non_compliant").length
  const overdueTrend = calculateTrend(currentOverdue, previousOverdue)

  const totalTrend = calculateTrend(requirements.length, requirements.length)

  const totalRequirements = requirements.length
  const completedCompliance = complianceList.filter((c) => c.status === "compliant").length
  const overallCompletionRate = totalRequirements > 0 ? Math.round((completedCompliance / totalRequirements) * 100) : 0

  const criticalRequirements = requirements.filter((r) => r.criticality_level === "critical").length
  const criticalCompleted = complianceList.filter(
    (c) =>
      c.status === "compliant" && requirements.find((r) => r.id === c.requirement_id)?.criticality_level === "critical",
  ).length
  const criticalCompletionRate =
    criticalRequirements > 0 ? Math.round((criticalCompleted / criticalRequirements) * 100) : 0

  const totalRisks = risks.length
  const criticalRisks = risks.filter((r) => r.risk_level === "critical").length
  const highRisks = risks.filter((r) => r.risk_level === "high").length

  const requirementsWithCompliance = requirements.slice(0, 10).map((req) => ({
    ...req,
    compliance: complianceList.find((c) => c.requirement_id === req.id),
  }))

  // Calculate trend data for last 6 months
  const trendData = []
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = monthDate.toLocaleDateString("ru-RU", { month: "short" })
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

    const monthRecords = complianceList.filter((r) => {
      const updatedAt = new Date(r.updated_at)
      return updatedAt >= monthStart && updatedAt <= monthEnd
    })

    const monthCompleted = monthRecords.filter((r) => r.status === "compliant").length
    const monthInProgress = monthRecords.filter((r) => r.status === "in_progress").length
    const monthNotStarted = monthRecords.filter((r) => r.status === "not_started" || r.status === "non_compliant").length

    trendData.push({
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      completed: monthCompleted,
      inProgress: monthInProgress,
      notStarted: monthNotStarted,
    })
  }

  return (
    <>
      <WelcomeTour />

      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Дашборд и аналитика</h1>
          <p className="text-muted-foreground">Добро пожаловать, {user.name || user.email}</p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="analytics">Расширенная аналитика</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KPICard label="Всего требований" value={stats.total} trend={totalTrend} />
              <KPICard label="Выполнено" value={stats.completed} trend={completedTrend} />
              <KPICard label="В работе" value={stats.inProgress} trend={inProgressTrend} />
              <KPICard label="Просрочено" value={stats.overdue} trend={overdueTrend} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <ComplianceOverviewCard
                totalRequirements={requirements.length}
                applicableRequirements={stats.total}
                completedRequirements={stats.completed}
                inProgressRequirements={stats.inProgress}
                overdueRequirements={stats.overdue}
                trend={completedTrend}
              />
              <ControlsStatsCard
                total={controlsStats.total}
                implemented={controlsStats.implemented}
                inProgress={controlsStats.inProgress}
                notStarted={controlsStats.notStarted}
              />
              <EvidenceStatsCard
                total={evidenceStats.total}
                approved={evidenceStats.approved}
                pending={evidenceStats.pending}
                rejected={evidenceStats.rejected}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TrendChart data={trendData} />
              <ComplianceChart
                completed={stats.completed}
                inProgress={stats.inProgress}
                overdue={stats.overdue}
                notStarted={stats.total - stats.completed - stats.inProgress - stats.overdue}
              />
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold">Требуют внимания</h2>
              <RequirementsTable requirements={requirementsWithCompliance} />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
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
                <CardHeader>
                  <CardTitle>Организации</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{organizations.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Подведомственных учреждений</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="trends" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="trends">Тренды</TabsTrigger>
                <TabsTrigger value="comparison">Сравнение</TabsTrigger>
                <TabsTrigger value="categories">Категории</TabsTrigger>
                <TabsTrigger value="risks">Риски</TabsTrigger>
              </TabsList>

              <TabsContent value="trends" className="space-y-4">
                <ComplianceTrendChart trendData={trendData} />
                <ComplianceByRegulatorChart compliance={complianceList} />
              </TabsContent>

              <TabsContent value="comparison" className="space-y-4">
                <OrganizationComparisonChart organizations={organizations} compliance={complianceList} />
              </TabsContent>

              <TabsContent value="categories" className="space-y-4">
                <RequirementCategoryChart requirements={requirements} compliance={complianceList} />
              </TabsContent>

              <TabsContent value="risks" className="space-y-4">
                <RiskHeatmap risks={risks} organizations={organizations} />
              </TabsContent>
            </Tabs>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Топ организаций по выполнению</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {organizations.slice(0, 5).map((org) => {
                      const orgCompliance = complianceList.filter((c) => c.organization_id === org.id)
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
                    {requirements.slice(0, 5).map((req) => {
                      const reqCompliance = complianceList.filter((c) => c.requirement_id === req.id)
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
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
