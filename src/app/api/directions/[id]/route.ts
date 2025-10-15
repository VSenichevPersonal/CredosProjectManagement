/**
 * @intent: Handle single direction operations
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { handleApiError } from "@/lib/utils/errors"
import { z } from "zod"

const updateDirectionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  budget: z.number().min(0).optional(),
  budgetThreshold: z.number().min(0).optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/directions/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await createExecutionContext(request)
    await ctx.access.require("directions:read")

    const direction = await ctx.db.directions.getById(ctx, params.id)

    if (!direction) {
      return Response.json(
        { error: "Направление не найдено" },
        { status: 404 }
      )
    }

    return Response.json(direction)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/directions/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await createExecutionContext(request)
    await ctx.access.require("directions:update")

    const body = await request.json()
    const validatedData = updateDirectionSchema.parse(body)

    const direction = await ctx.db.directions.update(ctx, params.id, validatedData)

    ctx.logger.info("Direction updated", { id: params.id })

    return Response.json(direction)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/directions/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await createExecutionContext(request)
    await ctx.access.require("directions:delete")

    await ctx.db.directions.delete(ctx, params.id)

    ctx.logger.info("Direction deleted", { id: params.id })

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

