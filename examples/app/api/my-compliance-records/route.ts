import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/execution-context"
import { ComplianceService } from "@/services/compliance-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)

    if (!ctx.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status") || undefined
    const search = searchParams.get("search") || undefined

    const filters: any = {
      page,
      limit,
      status,
      search,
    }

    // If user has organization, filter by it
    if (ctx.user.organizationId) {
      filters.organizationId = ctx.user.organizationId
    }

    const result = await ComplianceService.list(ctx, filters)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] My Compliance Records API error:", error)
    return NextResponse.json({ error: "Failed to fetch compliance records" }, { status: 500 })
  }
}
