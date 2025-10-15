/**
 * @intent: Handle project CRUD operations
 * @architecture: API Layer - validation → context → service → response
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { handleApiError } from "@/lib/utils/errors"
import { z } from "zod"

const createProjectSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  code: z.string().optional(),
  description: z.string().optional(),
  directionId: z.string().uuid("Некорректный ID направления"),
  managerId: z.string().uuid().optional(),
  status: z.enum(["planning", "active", "on_hold", "completed", "cancelled"]).default("planning"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalBudget: z.number().optional(),
})

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    ctx.logger.info("GET /api/projects - Fetching projects")

    await ctx.access.require("projects:read")

    const searchParams = request.nextUrl.searchParams
    const filters = {
      directionId: searchParams.get("directionId") || undefined,
      managerId: searchParams.get("managerId") || undefined,
      status: searchParams.get("status") || undefined,
    }

    const projects = await ctx.db.projects.getAll(ctx, filters)
    ctx.logger.info("Projects fetched", { count: projects.length })

    return Response.json({
      data: projects,
      total: projects.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    ctx.logger.info("POST /api/projects - Creating project")

    await ctx.access.require("projects:create")

    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    const project = await ctx.db.projects.create(ctx, {
      name: validatedData.name,
      code: validatedData.code,
      description: validatedData.description,
      directionId: validatedData.directionId,
      managerId: validatedData.managerId,
      status: validatedData.status,
      priority: validatedData.priority,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      totalBudget: validatedData.totalBudget,
      currentSpent: 0,
    })

    ctx.logger.info("Project created", { id: project.id })

    return Response.json(project, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

