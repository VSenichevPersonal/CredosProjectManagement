/**
 * @intent: Handle requirement CRUD operations
 * @llm-note: Thin controller - all logic is in RequirementService
 * @architecture: API Layer - validation → context → service → response
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { RequirementService } from "@/services/requirement-service"
import { createRequirementSchema } from "@/lib/validators/requirement-validators"
import { validate } from "@/lib/utils/validation"
import { handleApiError } from "@/lib/utils/errors"

// GET /api/requirements - List all requirements
export async function GET(request: NextRequest) {
  try {
    console.log("[v0] [Requirements API] Starting request")

    const ctx = await createExecutionContext(request)
    console.log("[v0] [Requirements API] Context created", { tenantId: ctx.tenantId })

    const searchParams = request.nextUrl.searchParams

    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const sortField = searchParams.get("sortField") || "code"
    const sortDirection = searchParams.get("sortDirection") || "asc"

    const filters = {
      category_id: searchParams.get("category_id") || undefined,
      criticality_level: searchParams.get("criticality_level") || undefined,
      regulatory_framework_id: searchParams.get("regulatory_framework_id") || undefined,
      document_status: searchParams.get("document_status") || undefined,
      regulator_id: searchParams.get("regulator_id") || undefined,
      search: searchParams.get("search") || undefined,
      sortField,
      sortDirection,
      page,
      limit,
    }

    console.log("[v0] [Requirements API] Filters:", filters)

    const requirements = await RequirementService.list(ctx, filters)
    console.log("[v0] [Requirements API] Requirements fetched:", { count: requirements.length })

    const countFilters = { ...filters }
    delete countFilters.page
    delete countFilters.limit
    const allRequirements = await RequirementService.list(ctx, countFilters)
    const totalCount = allRequirements.length

    console.log("[v0] [Requirements API] Response:", { count: requirements.length, total: totalCount })

    return Response.json({
      data: requirements,
      total: totalCount,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("[v0] [Requirements API] Error:", error)
    console.error("[v0] [Requirements API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("[v0] [Requirements API] Error type:", error?.constructor?.name)
    return handleApiError(error)
  }
}

// POST /api/requirements - Create new requirement
export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)

    const body = await request.json()

    console.log("[v0] Received requirement creation request:", JSON.stringify(body, null, 2))

    const cleanedBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, value === "" ? undefined : value]),
    )

    console.log("[v0] Cleaned body:", JSON.stringify(cleanedBody, null, 2))

    const validatedData = validate(createRequirementSchema, cleanedBody)

    console.log("[v0] Validated data:", JSON.stringify(validatedData, null, 2))

    const requirement = await RequirementService.create(ctx, validatedData)

    console.log("[v0] Requirement created successfully:", requirement.id)

    return Response.json({ data: requirement }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating requirement:", error)
    return handleApiError(error)
  }
}
