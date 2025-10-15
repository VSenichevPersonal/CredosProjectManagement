/**
 * @intent: Handle single project operations (GET, PUT, DELETE)
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { handleApiError } from "@/lib/utils/errors"
import { z } from "zod"

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  directionId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalBudget: z.number().optional(),
})

// GET /api/projects/[id] - Get single project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await createExecutionContext(request)
    await ctx.access.require("projects:read")

    const project = await ctx.db.projects.getById(ctx, params.id)

    if (!project) {
      return Response.json(
        { error: "Проект не найден" },
        { status: 404 }
      )
    }

    return Response.json(project)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await createExecutionContext(request)
    await ctx.access.require("projects:update")

    const body = await request.json()
    const validatedData = updateProjectSchema.parse(body)

    const project = await ctx.db.projects.update(ctx, params.id, validatedData)

    ctx.logger.info("Project updated", { id: params.id })

    return Response.json(project)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await createExecutionContext(request)
    await ctx.access.require("projects:delete")

    await ctx.db.projects.delete(ctx, params.id)

    ctx.logger.info("Project deleted", { id: params.id })

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

