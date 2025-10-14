/**
 * @intent: API endpoint for unlinking template from requirement
 * @llm-note: DELETE /api/requirements/[id]/templates/[linkId] - remove template link
 */

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createExecutionContext } from "@/lib/context/create-context"
import { ControlTemplateService } from "@/lib/services/control-template-service"

export async function DELETE(request: NextRequest, { params }: { params: { id: string; linkId: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { linkId } = params

    const ctx = await createExecutionContext(request)
    const service = new ControlTemplateService()

    await service.unlinkTemplateFromRequirement(ctx, linkId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to unlink template from requirement:", error)
    const message = error instanceof Error ? error.message : "Failed to unlink template from requirement"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
