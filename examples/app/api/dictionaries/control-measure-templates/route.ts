/**
 * @intent: Handle control measure templates dictionary operations
 * @llm-note: Tenant-scoped dictionary - filtered by tenant_id
 * @architecture: API Layer - context → db → response
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { Permission } from "@/lib/access-control/permissions"
import { handleApiError } from "@/lib/utils/errors"

export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)

    const templates = await ctx.db.controlMeasureTemplates.findMany({})

    return NextResponse.json({ data: templates })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)

    await ctx.access.require(Permission.DICTIONARY_MANAGE)

    const body = await request.json()
    const newTemplate = await ctx.db.controlMeasureTemplates.create({
      ...body,
      tenantId: ctx.tenantId,
      createdBy: ctx.user!.id,
    })

    await ctx.audit.log({
      eventType: "control_measure_template_created",
      userId: ctx.user!.id,
      resourceType: "control_measure_template",
      resourceId: newTemplate.id,
      changes: body,
    })

    return NextResponse.json(newTemplate, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
