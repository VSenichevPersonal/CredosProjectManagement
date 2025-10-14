/**
 * @intent: API endpoint for documents needing attention
 * @architecture: RESTful endpoint for dashboard alerts
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { DocumentActualityService } from "@/services/document-actuality-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)

    if (!ctx.user || !ctx.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get("organizationId") || undefined

    const service = new DocumentActualityService(ctx.db)

    const documents = await service.getDocumentsNeedingAttention(ctx.user.id, ctx.tenantId, organizationId)

    return NextResponse.json({ data: documents })
  } catch (error) {
    console.error("[v0] Documents needing attention error:", error)
    return NextResponse.json({ error: "Failed to get documents" }, { status: 500 })
  }
}
