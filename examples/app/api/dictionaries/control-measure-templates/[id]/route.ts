/**
 * @intent: Handle individual control measure template operations
 * @architecture: API Layer - context → db → response
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { Permission } from "@/lib/access-control/permissions"
import { handleApiError } from "@/lib/utils/errors"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)
    const template = await ctx.db.controlMeasureTemplates.findById(params.id)

    if (!template) {
      return NextResponse.json({ error: "Control measure template not found" }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)

    await ctx.access.require(Permission.DICTIONARY_MANAGE)

    const body = await request.json()
    const updated = await ctx.db.controlMeasureTemplates.update(params.id, body)

    await ctx.audit.log({
      eventType: "control_measure_template_updated",
      userId: ctx.user!.id,
      resourceType: "control_measure_template",
      resourceId: params.id,
      changes: body,
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)

    await ctx.access.require(Permission.DICTIONARY_MANAGE)

    await ctx.db.controlMeasureTemplates.delete(params.id)

    await ctx.audit.log({
      eventType: "control_measure_template_deleted",
      userId: ctx.user!.id,
      resourceType: "control_measure_template",
      resourceId: params.id,
      changes: {},
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
