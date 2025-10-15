/**
 * @intent: Handle single task operations
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { handleApiError } from "@/lib/utils/errors"
import { z } from "zod"

const updateTaskSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  dueDate: z.string().optional(),
})

// GET /api/tasks/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await createExecutionContext(request)
    await ctx.access.require("tasks:read")

    const task = await ctx.db.tasks.getById(ctx, params.id)

    if (!task) {
      return Response.json(
        { error: "Задача не найдена" },
        { status: 404 }
      )
    }

    return Response.json(task)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/tasks/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await createExecutionContext(request)
    await ctx.access.require("tasks:update")

    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    const task = await ctx.db.tasks.update(ctx, params.id, validatedData)

    ctx.logger.info("Task updated", { id: params.id })

    return Response.json(task)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await createExecutionContext(request)
    await ctx.access.require("tasks:delete")

    await ctx.db.tasks.delete(ctx, params.id)

    ctx.logger.info("Task deleted", { id: params.id })

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

