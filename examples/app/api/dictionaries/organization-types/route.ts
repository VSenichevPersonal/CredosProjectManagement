/**
 * @intent: Handle organization types dictionary operations
 * @llm-note: Global dictionary - no tenant_id filtering needed
 * @architecture: API Layer - context → db → response
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { Permission } from "@/lib/access-control/permissions"
import { handleApiError } from "@/lib/utils/errors"

export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)

    const types = await ctx.db.organizationTypes.findMany({})

    return NextResponse.json(types)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)

    await ctx.access.require(Permission.DICTIONARY_MANAGE)

    const body = await request.json()
    const newType = await ctx.db.organizationTypes.create(body)

    await ctx.audit.log({
      eventType: "organization_type_created",
      userId: ctx.user!.id,
      resourceType: "organization_type",
      resourceId: newType.id,
      changes: body,
    })

    return NextResponse.json(newType, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
