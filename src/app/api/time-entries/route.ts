/**
 * @intent: Handle time entry CRUD operations for Credos PM
 * @llm-note: Thin controller - all logic is in TimeTrackingService
 * @architecture: API Layer - validation → context → service → response
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { TimeTrackingService } from "@/services/time-tracking.service"
import { createTimeEntrySchema, bulkTimeEntrySchema } from "@/lib/validators/time-entry-validators"
import { validate } from "@/lib/utils/validation"
import { handleApiError } from "@/lib/utils/errors"

// GET /api/time-entries - List time entries with filters
export async function GET(request: NextRequest) {
  try {
    console.log("[Credos PM] [Time Entries API] Starting request")

    const ctx = await createExecutionContext(request)
    console.log("[Credos PM] [Time Entries API] Context created", { userId: ctx.userId })

    const searchParams = request.nextUrl.searchParams

    const filters = {
      projectId: searchParams.get("projectId") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      billable: searchParams.get("billable") === "true" ? true : searchParams.get("billable") === "false" ? false : undefined,
      sortField: searchParams.get("sortField") || "date",
      sortDirection: (searchParams.get("sortDirection") as "asc" | "desc") || "desc",
      page: Number.parseInt(searchParams.get("page") || "1"),
      limit: Number.parseInt(searchParams.get("limit") || "50"),
    }

    console.log("[Credos PM] [Time Entries API] Filters:", filters)

    const result = await TimeTrackingService.getTimeEntries(ctx, filters)
    console.log("[Credos PM] [Time Entries API] Time entries fetched:", { count: result.length })

    return Response.json({
      data: result,
      total: result.length,
    })
  } catch (error) {
    console.error("[Credos PM] [Time Entries API] Error:", error)
    return handleApiError(error)
  }
}

// POST /api/time-entries - Create new time entry
export async function POST(request: NextRequest) {
  try {
    console.log("[Credos PM] [Time Entries API] Creating time entry")

    const ctx = await createExecutionContext(request)
    console.log("[Credos PM] [Time Entries API] Context created", { userId: ctx.userId })

    const body = await request.json()
    console.log("[Credos PM] [Time Entries API] Request body:", body)

    // Check if it's bulk operation
    if (body.entries && Array.isArray(body.entries)) {
      const validatedData = validate(bulkTimeEntrySchema, body)
      const result = await TimeTrackingService.createBulkTimeEntries(ctx, validatedData.entries)
      console.log("[Credos PM] [Time Entries API] Bulk time entries created:", { count: result.length })
      return Response.json(result)
    } else {
      const validatedData = validate(createTimeEntrySchema, body)
      const result = await TimeTrackingService.createTimeEntry(ctx, validatedData)
      console.log("[Credos PM] [Time Entries API] Time entry created:", { id: result.id })
      return Response.json(result)
    }
  } catch (error) {
    console.error("[Credos PM] [Time Entries API] Error:", error)
    return handleApiError(error)
  }
}
