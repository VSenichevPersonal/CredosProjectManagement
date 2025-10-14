/**
 * API Route: Get Executive Summary data
 * 
 * GET /api/reports/executive-summary
 */

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"
import { RecommendationsEngine } from "@/services/recommendations-engine"
import type { ExecutiveSummaryData } from "@/types/domain/recommendation"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[API] Executive Summary: Loading data", { userId: user.id, tenantId: user.tenantId })

    const supabase = await createServerClient()

    // Load all necessary data in parallel
    const [
      { data: requirements },
      { data: compliance },
      { data: organizations },
      { data: measures },
      { data: evidence },
      { data: evidenceLinks },
      { data: risks },
      { data: rules },
    ] = await Promise.all([
      supabase.from("requirements").select("*").eq("tenant_id", user.tenantId || ""),
      supabase.from("compliance_records").select("*").eq("tenant_id", user.tenantId || ""),
      supabase.from("organizations").select("*").eq("tenant_id", user.tenantId || ""),
      supabase.from("control_measures").select("*").eq("tenant_id", user.tenantId || ""),
      supabase.from("evidence").select("*").eq("tenant_id", user.tenantId || ""),
      supabase.from("evidence_links").select("*").eq("tenant_id", user.tenantId || ""),
      supabase.from("risks").select("*").eq("tenant_id", user.tenantId || ""),
      supabase.from("recommendation_rules").select("*").eq("tenant_id", user.tenantId || "").eq("is_active", true),
    ])

    console.log("[API] Executive Summary: Data loaded", {
      requirements: requirements?.length || 0,
      compliance: compliance?.length || 0,
      organizations: organizations?.length || 0,
      measures: measures?.length || 0,
      evidence: evidence?.length || 0,
      rules: rules?.length || 0,
    })

    // Calculate dashboard metrics
    const metrics = RecommendationsEngine.calculateMetrics({
      requirements: requirements || [],
      compliance: compliance || [],
      organizations: organizations || [],
      measures: measures || [],
      evidence: evidence || [],
      evidenceLinks: evidenceLinks || [],
      risks: risks || [],
    })

    // Generate recommendations
    const recommendations = RecommendationsEngine.generateRecommendations(
      rules || [],
      metrics
    )

    console.log("[API] Executive Summary: Generated recommendations", { count: recommendations.length })

    // Calculate regulator status
    const regulators = [
      { id: 'fstec', name: 'ФСТЭК', field: 'fstecCompletionRate' },
      { id: 'fsb', name: 'ФСБ', field: 'fsbCompletionRate' },
      { id: 'roskomnadzor', name: 'Роскомнадзор', field: 'roskomnadzorCompletionRate' },
    ]

    const regulatorStatus = regulators.map(reg => {
      const rate = metrics[reg.field as keyof typeof metrics] as number
      const regulatorReqs = (requirements || []).filter((r: any) => 
        r.regulator === reg.name || r.regulatory_framework?.name?.includes(reg.name)
      )
      const regulatorCompliant = (compliance || []).filter((c: any) =>
        c.status === 'compliant' &&
        regulatorReqs.some((r: any) => r.id === c.requirement_id)
      ).length

      return {
        name: reg.name,
        completionRate: Math.round(rate),
        status: rate >= 80 ? 'good' : rate >= 60 ? 'warning' : 'critical',
        requirementsTotal: regulatorReqs.length,
        requirementsCompleted: regulatorCompliant,
      }
    }) as ExecutiveSummaryData['regulatorStatus']

    // Calculate risk heatmap
    const riskHeatmap = (organizations || []).slice(0, 10).map((org: any) => {
      const orgRisks = (risks || []).filter((r: any) => r.organization_id === org.id)
      return {
        organizationId: org.id,
        organizationName: org.name,
        risks: {
          low: orgRisks.filter((r: any) => r.risk_level === 'low').length,
          medium: orgRisks.filter((r: any) => r.risk_level === 'medium').length,
          high: orgRisks.filter((r: any) => r.risk_level === 'high').length,
          critical: orgRisks.filter((r: any) => r.risk_level === 'critical').length,
        },
      }
    })

    // Calculate trend data (last 3 months)
    const now = new Date()
    const trendData = []
    for (let i = 2; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = monthDate.toLocaleDateString("ru-RU", { month: "short" })
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

      const monthRecords = (compliance || []).filter((r: any) => {
        const updatedAt = new Date(r.updated_at)
        return updatedAt >= monthStart && updatedAt <= monthEnd
      })

      trendData.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        completed: monthRecords.filter((r: any) => r.status === 'compliant').length,
        inProgress: monthRecords.filter((r: any) => r.status === 'in_progress').length,
        total: monthRecords.length,
      })
    }

    // Top weak organizations
    const weakOrganizations = metrics.weakOrganizations.map(org => ({
      ...org,
      criticalIssues: (compliance || []).filter((c: any) => 
        c.organization_id === org.id && 
        c.status === 'non_compliant' &&
        (requirements || []).find((r: any) => r.id === c.requirement_id)?.criticality === 'critical'
      ).length,
    })).slice(0, 5)

    // Build response
    const summaryData: ExecutiveSummaryData = {
      overallCompletionRate: Math.round(metrics.overallCompletionRate),
      criticalCompletionRate: Math.round(metrics.criticalCompletionRate),
      totalOrganizations: metrics.totalOrganizations,
      monthlyTrend: metrics.lastMonthTrend,
      regulatorStatus,
      recommendations,
      riskHeatmap,
      trendData,
      weakOrganizations,
    }

    return NextResponse.json(summaryData)
  } catch (error: any) {
    console.error("[API] Executive Summary: Error", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
