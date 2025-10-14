/**
 * @intent: API endpoint for selecting generation provider
 * @architecture: RESTful endpoint with ExecutionContext
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { DocumentGenerationWizardService } from "@/services/document-generation-wizard-service"
import { createClient } from "@/lib/supabase/server"

/**
 * PATCH /api/document-wizard/:id/provider
 * Select generation provider
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const ctx = await createExecutionContext(supabase)

    const body = await request.json()
    const { providerType, providerConfig } = body

    if (!providerType) {
      return NextResponse.json({ error: "providerType is required" }, { status: 400 })
    }

    const session = await DocumentGenerationWizardService.selectProvider(ctx, params.id, {
      providerType,
      providerConfig,
    })

    return NextResponse.json({ data: session })
  } catch (error) {
    console.error("[Document Wizard Provider API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

