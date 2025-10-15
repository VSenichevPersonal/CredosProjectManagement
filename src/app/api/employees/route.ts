/**
 * @intent: Handle employee CRUD operations
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { handleApiError } from "@/lib/utils/errors"
import { z } from "zod"

const createEmployeeSchema = z.object({
  email: z.string().email("Некорректный email"),
  fullName: z.string().min(1, "ФИО обязательно"),
  position: z.string().min(1, "Должность обязательна"),
  directionId: z.string().uuid("Некорректный ID направления"),
  defaultHourlyRate: z.number().min(0).optional(),
  phone: z.string().optional(),
})

// GET /api/employees - List all employees
export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    ctx.logger.info("GET /api/employees - Fetching employees")

    await ctx.access.require("employees:read")

    const searchParams = request.nextUrl.searchParams
    const filters = {
      directionId: searchParams.get("directionId") || undefined,
      isActive: searchParams.get("isActive") === "false" ? false : true,
    }

    const employees = await ctx.db.employees.getAll(ctx, filters)
    ctx.logger.info("Employees fetched", { count: employees.length })

    return Response.json({
      data: employees,
      total: employees.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    ctx.logger.info("POST /api/employees - Creating employee")

    await ctx.access.require("employees:create")

    const body = await request.json()
    const validatedData = createEmployeeSchema.parse(body)

    // Check if email already exists
    const existingEmployee = await ctx.db.employees.getByEmail(ctx, validatedData.email)
    if (existingEmployee) {
      return Response.json(
        { error: "Сотрудник с таким email уже существует" },
        { status: 400 }
      )
    }

    const employee = await ctx.db.employees.create(ctx, {
      email: validatedData.email,
      fullName: validatedData.fullName,
      position: validatedData.position,
      directionId: validatedData.directionId,
      defaultHourlyRate: validatedData.defaultHourlyRate || 0,
      isActive: true,
    })

    ctx.logger.info("Employee created", { id: employee.id })

    return Response.json(employee, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

