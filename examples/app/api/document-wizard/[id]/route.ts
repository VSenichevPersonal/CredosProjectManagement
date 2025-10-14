/**
 * @intent: API endpoint for single wizard session
 * @architecture: RESTful endpoint with ExecutionContext
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { DocumentGenerationWizardService } from "@/services/document-generation-wizard-service"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/document-wizard/:id
 * Get wizard session
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const ctx = await createExecutionContext(supabase)

    const session = await DocumentGenerationWizardService.getById(ctx, params.id)

    return NextResponse.json({ data: session })
  } catch (error) {
    console.error("[Document Wizard API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

