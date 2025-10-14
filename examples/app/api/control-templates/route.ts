/**
 * @intent: API endpoints for control templates
 * @llm-note: GET /api/control-templates - list templates with filters
 *            POST /api/control-templates - create new template
 */

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { ControlTemplateService } from "@/lib/services/control-template-service"
import type { CreateControlTemplateDTO, ControlTemplateFilters } from "@/types/domain/control-template"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters for filters
    const searchParams = request.nextUrl.searchParams
    const filters: ControlTemplateFilters = {}

    if (searchParams.get("controlType")) {
      filters.controlType = searchParams.get("controlType") as any
    }
    if (searchParams.get("category")) {
      filters.category = searchParams.get("category") as string
    }
    if (searchParams.get("isPublic")) {
      filters.isPublic = searchParams.get("isPublic") === "true"
    }
    if (searchParams.get("search")) {
      filters.search = searchParams.get("search") as string
    }
    if (searchParams.get("tags")) {
      filters.tags = searchParams.get("tags")?.split(",")
    }

    const ctx = await createExecutionContext(request)
    const service = new ControlTemplateService()

    const templates = await service.findTemplates(ctx, filters)

    return NextResponse.json({ data: templates })
  } catch (error) {
    console.error("[v0] Failed to fetch control templates:", error)
    return NextResponse.json({ error: "Failed to fetch control templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: CreateControlTemplateDTO = await request.json()

    const ctx = await createExecutionContext(request)
    const service = new ControlTemplateService()

    const template = await service.createTemplate(ctx, body)

    return NextResponse.json({ data: template }, { status: 201 })
  } catch (error) {
    console.error("[v0] Failed to create control template:", error)
    const message = error instanceof Error ? error.message : "Failed to create control template"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
