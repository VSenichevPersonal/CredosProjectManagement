/**
 * @intent: Handle single compliance operations
 * @llm-note: Thin controller - all logic is in ComplianceService
 * @architecture: API Layer - context → service → response
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { ComplianceService } from "@/services/compliance-service"
import { updateComplianceSchema } from "@/lib/validators/compliance-validators"
import { validate } from "@/lib/utils/validation"
import { handleApiError } from "@/lib/utils/errors"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)

    const compliance = await ComplianceService.getById(ctx, params.id)

    return Response.json({ data: compliance })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)

    const body = await request.json()

    const validatedData = validate(updateComplianceSchema, body)

    const compliance = await ComplianceService.update(ctx, params.id, validatedData)

    return Response.json({ data: compliance })
  } catch (error) {
    return handleApiError(error)
  }
}
