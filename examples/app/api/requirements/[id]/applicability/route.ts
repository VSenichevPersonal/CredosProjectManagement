import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { ApplicabilityService } from "@/services/applicability-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    const { id } = params

    const service = new ApplicabilityService(ctx.db)
    const result = await service.getApplicabilityResult(id)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to get applicability:", error)
    return NextResponse.json({ error: "Failed to get applicability" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    const { id } = params
    const body = await request.json()

    const service = new ApplicabilityService(ctx.db)
    await service.updateApplicabilityRule(id, body.filterRules, ctx.user.id)

    const result = await service.getApplicabilityResult(id)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to update applicability:", error)
    return NextResponse.json({ error: "Failed to update applicability" }, { status: 500 })
  }
}
