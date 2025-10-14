/**
 * @intent: API endpoint for reviewing documents and updating actuality
 * @architecture: RESTful endpoint with ExecutionContext
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { DocumentActualityService } from "@/services/document-actuality-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext(request)

    if (!ctx.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reviewNotes, nextReviewDate, validityPeriodDays } = body

    const service = new DocumentActualityService(ctx.db)

    const document = await service.reviewDocument({
      documentId: params.id,
      userId: ctx.user.id,
      reviewNotes,
      nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : undefined,
      validityPeriodDays: validityPeriodDays ? Number(validityPeriodDays) : undefined,
    })

    // Audit log
    await ctx.audit.log({
      eventType: "document_reviewed",
      userId: ctx.user.id,
      resourceType: "document",
      resourceId: params.id,
      metadata: { reviewNotes, nextReviewDate, validityPeriodDays },
    })

    return NextResponse.json({ data: document })
  } catch (error) {
    console.error("[v0] Document review error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to review document" },
      { status: 500 },
    )
  }
}
