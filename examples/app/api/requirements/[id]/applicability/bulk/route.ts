import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { ComplianceService } from "@/services/compliance-service"
import { handleApiError } from "@/lib/utils/errors"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("[v0] Bulk create compliance records - START", { requirementId: params.id })
  try {
    const ctx = await createExecutionContext(request)
    console.log("[v0] Context created", { userId: ctx.user?.id, tenantId: ctx.tenantId })

    const body = await request.json()
    console.log("[v0] Request body", { organizationIds: body.organizationIds })

    const requirementId = params.id
    const { organizationIds } = body

    if (!Array.isArray(organizationIds) || organizationIds.length === 0) {
      return NextResponse.json({ error: "organizationIds must be a non-empty array" }, { status: 400 })
    }

    console.log("[v0] Creating compliance records", { requirementId, count: organizationIds.length })

    await ComplianceService.assignRequirementToOrganizations(ctx, requirementId, organizationIds)

    console.log("[v0] Compliance records created successfully")

    return NextResponse.json({
      message: `Processed ${organizationIds.length} organization(s)`,
      requirementId,
      organizationIds,
    })
  } catch (error) {
    console.error("[v0] Bulk create compliance records - ERROR", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return handleApiError(error)
  }
}
