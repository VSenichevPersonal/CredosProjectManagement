import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { ApplicabilityService } from "@/services/applicability-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: organizationId } = params

    console.log("[v0] GET /api/organizations/[id]/requirements - organizationId:", organizationId)

    const ctx = await createExecutionContext()

    const result = await ApplicabilityService.getOrganizationRequirements(ctx, organizationId)

    console.log("[v0] Organization requirements result:", {
      totalRequirements: result.totalRequirements,
      applicableRequirements: result.applicableRequirements,
      requirementsCount: result.requirements.length,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Failed to get organization requirements:", error)
    return NextResponse.json({ error: "Failed to get organization requirements" }, { status: 500 })
  }
}
