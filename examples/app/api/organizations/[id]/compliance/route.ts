import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { ComplianceService } from "@/services/compliance-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const organizationId = params.id

    console.log("[v0] GET /api/organizations/[id]/compliance - organizationId:", organizationId)

    const ctx = await createExecutionContext()

    // Get compliance records for this organization
    const result = await ComplianceService.list(ctx, {
      organizationId,
      sortField: "updated_at",
      sortDirection: "desc",
      page: 1,
      limit: 100,
    })

    console.log("[v0] Organization compliance records fetched:", { count: result.data.length })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error in GET /api/organizations/[id]/compliance:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
