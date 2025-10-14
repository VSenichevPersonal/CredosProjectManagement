/**
 * @intent: Manage evidence-to-control-measure links (many-to-many)
 * @llm-note: Thin controller - all logic in EvidenceLinkService
 * @architecture: API Layer - validation → context → service → response
 */

import type { NextRequest } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { EvidenceLinkService } from "@/services/evidence-link-service"
import { handleApiError } from "@/lib/utils/errors"

export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    const searchParams = request.nextUrl.searchParams

    const evidenceId = searchParams.get("evidenceId")
    const controlMeasureId = searchParams.get("controlMeasureId")

    if (!evidenceId && !controlMeasureId) {
      return Response.json({ error: "Either evidenceId or controlMeasureId is required" }, { status: 400 })
    }

    const links = evidenceId
      ? await EvidenceLinkService.findByEvidence(ctx, evidenceId)
      : await EvidenceLinkService.findByControlMeasure(ctx, controlMeasureId!)

    return Response.json({ data: links })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    const body = await request.json()

    const { evidenceId, controlMeasureId, relevanceScore, linkReason, notes } = body

    if (!evidenceId || !controlMeasureId) {
      return Response.json({ error: "evidenceId and controlMeasureId are required" }, { status: 400 })
    }

    const link = await EvidenceLinkService.linkToMeasure(
      ctx,
      evidenceId,
      controlMeasureId,
      relevanceScore,
      notes || linkReason  // Support both 'notes' and 'linkReason'
    )

    return Response.json({ data: link }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
