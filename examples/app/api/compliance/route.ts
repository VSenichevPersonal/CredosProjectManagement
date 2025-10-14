/**
 * @intent: Handle compliance CRUD operations
 * @llm-note: Thin controller - all logic is in ComplianceService
 * @architecture: API Layer - validation → context → service → response
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { ComplianceService } from "@/services/compliance-service"
import { handleApiError } from "@/lib/utils/errors"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] [Compliance API] Starting request")

    const ctx = await createExecutionContext(request)

    console.log("[v0] [Compliance API] Context created", { tenantId: ctx.tenantId })

    const searchParams = request.nextUrl.searchParams

    const filters = {
      requirementId: searchParams.get("requirementId") || undefined,
      organizationId: searchParams.get("organizationId") || undefined,
      status: searchParams.get("status") || undefined,
      sortField: searchParams.get("sortField") || "updated_at",
      sortDirection: (searchParams.get("sortDirection") as "asc" | "desc") || "desc",
      page: Number.parseInt(searchParams.get("page") || "1"),
      limit: Number.parseInt(searchParams.get("limit") || "20"),
    }

    const result = await ComplianceService.list(ctx, filters)

    return Response.json({
      data: Array.isArray(result) ? result : result.data,
      total: Array.isArray(result) ? result.length : result.total,
    })
  } catch (error) {
    console.error("[v0] [Compliance API] Error:", error)
    console.error("[v0] [Compliance API] Error stack:", error instanceof Error ? error.stack : "No stack")
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] [Compliance API] Starting POST request")

    const ctx = await createExecutionContext(request)
    const body = await request.json()

    console.log("[v0] [Compliance API] Request body:", body)

    // Use the correct method name: create() instead of createWithMeasures()
    // The create() method already handles measure creation from templates
    const compliance = await ComplianceService.create(ctx, {
      requirementId: body.requirementId,
      organizationId: body.organizationId,
      status: body.status || "pending",
      dueDate: body.dueDate,
      assignedTo: body.assignedTo,
      notes: body.notes,
    })

    console.log("[v0] [Compliance API] Created compliance with measures:", compliance.id)

    return Response.json({ data: compliance }, { status: 201 })
  } catch (error) {
    console.error("[v0] [Compliance API] Error:", error)
    return handleApiError(error)
  }
}
