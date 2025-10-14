/**
 * @intent: API endpoint for generating documents
 * @architecture: RESTful endpoint with ExecutionContext
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { DocumentGenerationWizardService } from "@/services/document-generation-wizard-service"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/document-wizard/:id/generate
 * Start document generation
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const ctx = await createExecutionContext(supabase)

    const session = await DocumentGenerationWizardService.generateDocuments(ctx, params.id)

    return NextResponse.json({ data: session })
  } catch (error) {
    console.error("[Document Wizard Generate API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

