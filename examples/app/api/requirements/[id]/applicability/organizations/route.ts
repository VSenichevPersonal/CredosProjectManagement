import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    console.log("[v0] GET /api/requirements/[id]/applicability/organizations:", { id, search })

    const context = await createExecutionContext(request)
    const { applicability, user } = context

    console.log("[v0] Applicability organizations context:", {
      userId: user?.id,
      tenantId: user?.tenantId,
      role: user?.role,
    })

    // Get full applicability result with organizations list
    const result = await applicability.getApplicabilityResult(id)
    console.log("[v0] Applicability result:", {
      totalOrganizations: result.totalOrganizations,
      applicableOrganizations: result.applicableOrganizations,
      organizationsCount: result.organizations?.length || 0,
    })

    // Get all organizations for this requirement
    const organizations = await applicability.getApplicableOrganizations(id, search)
    console.log("[v0] Organizations after search filter:", organizations.length)

    return NextResponse.json({
      ...result,
      organizations,
    })
  } catch (error) {
    console.error("[v0] Failed to get organizations:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get organizations" },
      { status: 500 },
    )
  }
}
