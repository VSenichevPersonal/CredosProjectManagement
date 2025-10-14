/**
 * @intent: API endpoint for document actuality statistics
 * @architecture: RESTful endpoint for dashboard
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

    const stats = await service.getActualityStatistics(ctx.tenantId, organizationId)

    return NextResponse.json({ data: stats })
  } catch (error) {
    console.error("[v0] Actuality stats error:", error)
    return NextResponse.json({ error: "Failed to get statistics" }, { status: 500 })
  }
}
