/**
 * @intent: Handle single requirement operations
 * @llm-note: Thin controller - all logic is in RequirementService
 * @architecture: API Layer - context → service → response
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { RequirementService } from "@/services/requirement-service"
import { updateRequirementSchema } from "@/lib/validators/requirement-validators"
import { validate } from "@/lib/utils/validation"
import { handleApiError } from "@/lib/utils/errors"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)

    const requirement = await RequirementService.getById(ctx, params.id)

    return Response.json({ data: requirement })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)

    const body = await request.json()

    const validatedData = validate(updateRequirementSchema, body)

    const requirement = await RequirementService.update(ctx, params.id, validatedData)

    return Response.json({ data: requirement })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)

    const body = await request.json()

    // For PATCH, we allow partial updates without full validation
    const requirement = await RequirementService.update(ctx, params.id, body)

    return Response.json({ data: requirement })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)

    await RequirementService.delete(ctx, params.id)

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
