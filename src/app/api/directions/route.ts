/**
 * @intent: Handle direction CRUD operations
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { handleApiError } from "@/lib/utils/errors"
import { z } from "zod"

const createDirectionSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  code: z.string().optional(),
  description: z.string().optional(),
  budget: z.number().min(0).optional(),
  budgetThreshold: z.number().min(0).optional(),
  color: z.string().optional(),
})

// GET /api/directions - List all directions
export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    ctx.logger.info("GET /api/directions - Fetching directions")

    await ctx.access.require("directions:read")

    const directions = await ctx.db.directions.getAll(ctx)
    ctx.logger.info("Directions fetched", { count: directions.length })

    return Response.json({
      data: directions,
      total: directions.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/directions - Create new direction
export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    ctx.logger.info("POST /api/directions - Creating direction")

    await ctx.access.require("directions:create")

    const body = await request.json()
    const validatedData = createDirectionSchema.parse(body)

    const direction = await ctx.db.directions.create(ctx, {
      name: validatedData.name,
      description: validatedData.description,
      budget: validatedData.budget,
      budgetThreshold: validatedData.budgetThreshold,
      color: validatedData.color || "blue",
      isActive: true,
    })

    ctx.logger.info("Direction created", { id: direction.id })

    return Response.json(direction, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

