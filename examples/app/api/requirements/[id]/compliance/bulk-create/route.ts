import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { ComplianceService } from "@/services/compliance-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[v0] Bulk create compliance records - START", { requirementId: params.id })

    const ctx = await createExecutionContext(request)
    console.log("[v0] Context created", { userId: ctx.user?.id, tenantId: ctx.tenantId })

    const body = await request.json()
    console.log("[v0] Request body", body)

    const { organizationIds } = body

    if (!Array.isArray(organizationIds) || organizationIds.length === 0) {
      console.log("[v0] Invalid organizationIds", { organizationIds })
      return NextResponse.json({ error: "organizationIds is required and must be a non-empty array" }, { status: 400 })
    }

    console.log("[v0] Creating compliance records", { requirementId: params.id, count: organizationIds.length })

    // Create compliance records for all organizations
    await ComplianceService.assignRequirementToOrganizations(ctx, params.id, organizationIds)

    console.log("[v0] Compliance records created successfully")

    return NextResponse.json({
      success: true,
      created: organizationIds.length,
      message: `Created ${organizationIds.length} compliance records`,
    })
  } catch (error: any) {
    console.error("[v0] Failed to bulk create compliance records:", error)
    console.error("[v0] Error stack:", error.stack)
    return NextResponse.json(
      {
        error: error.message || "Failed to create compliance records",
        details: error.stack,
      },
      { status: 500 },
    )
  }
}
