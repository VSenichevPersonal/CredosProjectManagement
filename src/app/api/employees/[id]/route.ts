/**
 * @intent: Handle single employee operations
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { handleApiError } from "@/lib/utils/errors"
import { z } from "zod"

const updateEmployeeSchema = z.object({
  fullName: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  directionId: z.string().uuid().optional(),
  defaultHourlyRate: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/employees/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await createExecutionContext(request)
    await ctx.access.require("employees:read")

    const employee = await ctx.db.employees.getById(ctx, params.id)

    if (!employee) {
      return Response.json(
        { error: "Сотрудник не найден" },
        { status: 404 }
      )
    }

    return Response.json(employee)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/employees/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await createExecutionContext(request)
    await ctx.access.require("employees:update")

    const body = await request.json()
    const validatedData = updateEmployeeSchema.parse(body)

    const employee = await ctx.db.employees.update(ctx, params.id, validatedData)

    ctx.logger.info("Employee updated", { id: params.id })

    return Response.json(employee)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/employees/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await createExecutionContext(request)
    await ctx.access.require("employees:delete")

    // Soft delete - set isActive to false
    await ctx.db.employees.update(ctx, params.id, { isActive: false })

    ctx.logger.info("Employee deleted (soft)", { id: params.id })

    return Response.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

