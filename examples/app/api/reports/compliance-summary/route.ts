import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { Permission } from "@/lib/access-control/permissions"

export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    await ctx.access.require(Permission.REPORT_VIEW)

    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get("organizationId")
    const regulatorFilter = searchParams.get("regulator")
    const format = searchParams.get("format") || "json"

    console.log("[v0] Compliance Summary API", {
      tenantId: ctx.user!.tenantId,
      organizationId,
      regulatorFilter,
      format,
    })

    const db = ctx.db

    // Fetch compliance records
    let complianceData = await db.complianceRecords.findMany({})

    // Filter by organization if specified
    if (organizationId) {
      complianceData = complianceData.filter((c) => c.organization_id === organizationId)
    }

    // Fetch related data
    const requirements = await db.requirements.findMany({})
    const organizations = await db.organizations.findMany({})
    const users = await db.users.findMany({})

    // Filter by regulator if specified
    if (regulatorFilter) {
      const filteredReqIds = requirements.filter((r) => r.regulator_id === regulatorFilter).map((r) => r.id)
      complianceData = complianceData.filter((c) => filteredReqIds.includes(c.requirement_id))
    }

    console.log("[v0] Compliance Summary: Data loaded", {
      compliance: complianceData.length,
      requirements: requirements.length,
      organizations: organizations.length,
      tenantId: ctx.user!.tenantId,
    })

    // Enrich compliance data with related information
    const enrichedData = complianceData.map((item) => {
      const req = requirements.find((r) => r.id === item.requirement_id)
      const org = organizations.find((o) => o.id === item.organization_id)
      const user = users.find((u) => u.id === item.assigned_to)

      return {
        ...item,
        requirements: req
          ? {
              id: req.id,
              code: req.code,
              title: req.title,
              regulator_id: req.regulator_id,
              criticality: req.criticality,
              deadline: req.deadline,
              category: req.category,
            }
          : null,
        organizations: org
          ? {
              id: org.id,
              name: org.name,
              inn: org.inn,
              organization_types: { code: org.type_id, name: org.type_id },
            }
          : null,
        users: user
          ? {
              id: user.id,
              full_name: user.full_name,
              email: user.email,
            }
          : null,
      }
    })

    // Calculate statistics
    const stats = {
      total: enrichedData.length,
      byStatus: {} as Record<string, number>,
      byCriticality: {} as Record<string, number>,
      byRegulator: {} as Record<string, number>,
      overdue: 0,
      completionRate: 0,
    }

    enrichedData.forEach((item) => {
      const status = item.status
      const criticality = item.requirements?.criticality
      const regulator = item.requirements?.regulator_id

      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1
      if (criticality) stats.byCriticality[criticality] = (stats.byCriticality[criticality] || 0) + 1
      if (regulator) stats.byRegulator[regulator] = (stats.byRegulator[regulator] || 0) + 1

      if (item.status === "overdue") stats.overdue++
    })

    const approved = stats.byStatus["approved"] || 0
    stats.completionRate = stats.total > 0 ? Math.round((approved / stats.total) * 100) : 0

    const reportData = {
      generatedAt: new Date().toISOString(),
      generatedBy: ctx.user!.email,
      filters: { organizationId, regulator: regulatorFilter },
      statistics: stats,
      details: enrichedData,
    }

    console.log("[v0] Compliance Summary: Generated successfully", {
      total: stats.total,
      completionRate: stats.completionRate,
    })

    // Return CSV format if requested
    if (format === "csv") {
      const csv = generateCSV(enrichedData)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="compliance-report-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("[v0] Report generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateCSV(data: any[]): string {
  const headers = [
    "Код требования",
    "Название требования",
    "Регулятор",
    "Критичность",
    "Категория",
    "Организация",
    "ИНН",
    "Тип организации",
    "Статус",
    "Ответственный",
    "Дата завершения",
    "Комментарий",
  ]

  const rows = data.map((item) => [
    item.requirements?.code || "",
    item.requirements?.title || "",
    item.requirements?.regulator_id || "",
    item.requirements?.criticality || "",
    item.requirements?.category || "",
    item.organizations?.name || "",
    item.organizations?.inn || "",
    item.organizations?.organization_types?.name || "",
    item.status || "",
    item.users?.full_name || "",
    item.completed_at ? new Date(item.completed_at).toLocaleDateString("ru-RU") : "",
    item.comments || "",
  ])

  return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")
}
