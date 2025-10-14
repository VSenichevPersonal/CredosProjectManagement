import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { ControlMeasureTemplateService } from "@/services/control-measure-template-service"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    logger.debug("[ControlMeasureTemplates API] GET request", { tenantId: ctx.tenantId })

    const { searchParams } = new URL(request.url)
    const filters = {
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      isActive: searchParams.get("isActive") === "true" ? true : undefined,
    }

    const templates = await ControlMeasureTemplateService.list(ctx, filters)
    logger.trace("[ControlMeasureTemplates API] Templates fetched", { count: templates.length })

    return NextResponse.json({ data: templates })
  } catch (error) {
    logger.error("[ControlMeasureTemplates API] GET failed", error as Error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request)
    const body = await request.json()

    logger.debug("[ControlMeasureTemplates API] POST request", { body })

    const template = await ControlMeasureTemplateService.create(ctx, body)
    logger.info("[ControlMeasureTemplates API] Template created", { id: template.id })

    return NextResponse.json({ data: template }, { status: 201 })
  } catch (error) {
    logger.error("[ControlMeasureTemplates API] POST failed", error as Error)
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}
