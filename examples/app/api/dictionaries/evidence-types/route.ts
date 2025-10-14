/**
 * @intent: Handle evidence types dictionary operations
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

    const types = await ctx.db.evidenceTypes.findMany({})

    console.log('[Evidence Types API] Loaded:', types?.length || 0, 'types')

    return NextResponse.json({ data: types })  // ✅ Единый формат { data: ... }
  } catch (error) {
    console.error('[Evidence Types API] Error:', error)
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)

    await ctx.access.require(Permission.DICTIONARY_MANAGE)

    const body = await request.json()
    const newType = await ctx.db.evidenceTypes.create(body)

    await ctx.audit.log({
      eventType: "evidence_type_created",
      userId: ctx.user!.id,
      resourceType: "evidence_type",
      resourceId: newType.id,
      changes: body,
    })

    return NextResponse.json(newType, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
