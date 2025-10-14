import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { Permission } from "@/lib/access-control/permissions"
import { calculateEvidenceFreshness } from "@/lib/utils/evidence-freshness"

export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    await ctx.access.require(Permission.REPORT_VIEW)

    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get("organizationId")

    console.log("[v0] Readiness Report API", {
      tenantId: ctx.user!.tenantId,
      organizationId,
      userId: ctx.user!.id,
    })

    const db = ctx.db

    // Get all requirements for this tenant
    const requirements = await db.requirements.findMany({})

    console.log("[v0] Readiness Report: Requirements loaded", {
      count: requirements.length,
      tenantId: ctx.user!.tenantId,
    })

    // Get compliance records
    let complianceRecords
    if (organizationId) {
      complianceRecords = await db.compliance.findMany({
        organization_id: organizationId,
      })
    } else {
      complianceRecords = await db.compliance.findMany({})
    }

    console.log("[v0] Readiness Report: Compliance records loaded", {
      count: complianceRecords.length,
      organizationId,
    })

    // Get evidence
    const evidence = await db.evidence.findMany({})

    const staleEvidence = evidence.filter((e) => {
      const freshness = calculateEvidenceFreshness(
        new Date(e.updatedAt),
        e.expiresAt ? new Date(e.expiresAt) : undefined,
      )
      return freshness.score < 40
    })

    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const upcomingDeadlines = complianceRecords
      .filter((cr) => {
        if (!cr.nextReviewDate) return false
        const reviewDate = new Date(cr.nextReviewDate)
        return reviewDate > now && reviewDate <= thirtyDaysFromNow
      })
      .map((cr) => {
        const req = requirements.find((r) => r.id === cr.requirementId)
        const reviewDate = new Date(cr.nextReviewDate!)
        const daysUntil = Math.floor((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return {
          complianceRecordId: cr.id,
          requirementId: cr.requirementId,
          requirementTitle: req?.title || "Неизвестное требование",
          nextReviewDate: cr.nextReviewDate,
          daysUntil,
        }
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)

    const requirementsWithEvidence = new Set(evidence.map((e) => e.requirementId).filter(Boolean))
    const missingEvidence = requirements
      .filter((r) => !requirementsWithEvidence.has(r.id))
      .map((r) => ({
        requirementId: r.id,
        requirementCode: r.code,
        requirementTitle: r.title,
        criticality: r.criticality,
      }))

    // Calculate readiness metrics
    const totalRequirements = requirements.length
    const requirementsByCategory = groupBy(requirements, "category")
    const requirementsByCriticality = groupBy(requirements, "criticality")

    // Calculate compliance status
    const compliantRecords = complianceRecords.filter((r) => r.status === "compliant")
    const nonCompliantRecords = complianceRecords.filter((r) => r.status === "non_compliant")
    const partiallyCompliantRecords = complianceRecords.filter((r) => r.status === "partially_compliant")
    const notApplicableRecords = complianceRecords.filter((r) => r.status === "not_applicable")

    const complianceRate = totalRequirements > 0 ? (compliantRecords.length / totalRequirements) * 100 : 0

    // Calculate document status
    const needDocumentCount = requirements.filter((r) => r.documentStatus === "need_document").length
    const okCount = requirements.filter((r) => r.documentStatus === "ok").length
    const needsUpdateCount = requirements.filter((r) => r.documentStatus === "needs_update").length
    const notRelevantCount = requirements.filter((r) => r.documentStatus === "not_relevant").length

    // Calculate evidence metrics
    const approvedEvidence = evidence.filter((e) => e.status === "approved")
    const pendingEvidence = evidence.filter((e) => e.status === "pending")
    const rejectedEvidence = evidence.filter((e) => e.status === "rejected")

    // Calculate readiness by category
    const readinessByCategory = Object.entries(requirementsByCategory).map(([category, reqs]) => {
      const categoryCompliance = complianceRecords.filter(
        (cr) => reqs.some((r: any) => r.id === cr.requirementId) && cr.status === "compliant",
      )
      return {
        category,
        total: reqs.length,
        compliant: categoryCompliance.length,
        rate: reqs.length > 0 ? (categoryCompliance.length / reqs.length) * 100 : 0,
      }
    })

    // Calculate readiness by criticality
    const readinessByCriticality = Object.entries(requirementsByCriticality).map(([criticality, reqs]) => {
      const criticalityCompliance = complianceRecords.filter(
        (cr) => reqs.some((r: any) => r.id === cr.requirementId) && cr.status === "compliant",
      )
      return {
        criticality,
        total: reqs.length,
        compliant: criticalityCompliance.length,
        rate: reqs.length > 0 ? (criticalityCompliance.length / reqs.length) * 100 : 0,
      }
    })

    const report = {
      generatedAt: new Date().toISOString(),
      organizationId,
      summary: {
        totalRequirements,
        complianceRate: Math.round(complianceRate * 10) / 10,
        compliantCount: compliantRecords.length,
        nonCompliantCount: nonCompliantRecords.length,
        partiallyCompliantCount: partiallyCompliantRecords.length,
        notApplicableCount: notApplicableRecords.length,
      },
      documentStatus: {
        needDocument: needDocumentCount,
        ok: okCount,
        needsUpdate: needsUpdateCount,
        notRelevant: notRelevantCount,
      },
      evidence: {
        total: evidence.length,
        approved: approvedEvidence.length,
        pending: pendingEvidence.length,
        rejected: rejectedEvidence.length,
      },
      readinessByCategory,
      readinessByCriticality,
      criticalIssues: nonCompliantRecords
        .filter((cr) => {
          const req = requirements.find((r) => r.id === cr.requirementId)
          return req?.criticality === "critical" || req?.criticality === "high"
        })
        .map((cr) => {
          const req = requirements.find((r) => r.id === cr.requirementId)
          return {
            requirementCode: req?.code,
            requirementTitle: req?.title,
            criticality: req?.criticality,
            lastChecked: cr.updatedAt,
          }
        }),
      upcomingDeadlines,
      staleEvidence: staleEvidence.map((e) => ({
        id: e.id,
        title: e.title || e.fileName,
        requirementId: e.requirementId,
        updatedAt: e.updatedAt,
        freshnessScore: calculateEvidenceFreshness(
          new Date(e.updatedAt),
          e.expiresAt ? new Date(e.expiresAt) : undefined,
        ).score,
      })),
      missingEvidence,
    }

    console.log("[v0] Readiness Report: Generated successfully", {
      totalRequirements: report.summary.totalRequirements,
      complianceRate: report.summary.complianceRate,
      needDocument: report.documentStatus.needDocument,
      upcomingDeadlines: upcomingDeadlines.length,
      staleEvidence: staleEvidence.length,
      missingEvidence: missingEvidence.length,
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error("[v0] Failed to generate readiness report:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate readiness report" },
      { status: 500 },
    )
  }
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key])
      if (!result[groupKey]) {
        result[groupKey] = []
      }
      result[groupKey].push(item)
      return result
    },
    {} as Record<string, T[]>,
  )
}
