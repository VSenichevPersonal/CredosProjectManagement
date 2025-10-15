/**
 * @intent: Handle task CRUD operations
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { handleApiError } from "@/lib/utils/errors"
import { z } from "zod"

const createTaskSchema = z.object({
  projectId: z.string().uuid("Некорректный ID проекта"),
  name: z.string().min(1, "Название обязательно"),
  description: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  status: z.enum(["todo", "in_progress", "review", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  estimatedHours: z.number().min(0).optional(),
  dueDate: z.string().optional(),
})

// GET /api/tasks - List all tasks
export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    ctx.logger.info("GET /api/tasks - Fetching tasks")

    await ctx.access.require("tasks:read")

    const searchParams = request.nextUrl.searchParams
    const filters = {
      projectId: searchParams.get("projectId") || undefined,
      assigneeId: searchParams.get("assigneeId") || undefined,
      status: searchParams.get("status") || undefined,
    }

    const tasks = await ctx.db.tasks.getAll(ctx, filters)
    ctx.logger.info("Tasks fetched", { count: tasks.length })

    return Response.json({
      data: tasks,
      total: tasks.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    ctx.logger.info("POST /api/tasks - Creating task")

    await ctx.access.require("tasks:create")

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    const task = await ctx.db.tasks.create(ctx, {
      projectId: validatedData.projectId,
      name: validatedData.name,
      description: validatedData.description,
      assigneeId: validatedData.assigneeId,
      status: validatedData.status,
      priority: validatedData.priority,
      estimatedHours: validatedData.estimatedHours,
      actualHours: 0,
      dueDate: validatedData.dueDate,
    })

    ctx.logger.info("Task created", { id: task.id })

    return Response.json(task, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

