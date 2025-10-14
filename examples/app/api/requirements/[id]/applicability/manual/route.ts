import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { ApplicabilityService } from "@/services/applicability-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    const { id } = params
    const body = await request.json()

    const service = new ApplicabilityService(ctx.db)

    if (body.action === "include") {
      await service.addManualInclude(id, body.organizationId, body.reason, ctx.user.id)
    } else if (body.action === "exclude") {
      await service.addManualExclude(id, body.organizationId, body.reason, ctx.user.id)
    } else if (body.action === "remove") {
      await service.removeManualOverride(id, body.organizationId)
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const result = await service.getApplicabilityResult(id)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to update manual mapping:", error)
    return NextResponse.json({ error: "Failed to update manual mapping" }, { status: 500 })
  }
}
