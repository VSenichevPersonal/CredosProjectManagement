/**
 * @intent: API endpoint for document generation wizard
 * @architecture: RESTful endpoint with ExecutionContext
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { DocumentGenerationWizardService } from "@/services/document-generation-wizard-service"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/document-wizard
 * Start new wizard session
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ctx = await createExecutionContext(supabase)

    const body = await request.json()
    const { packageId, organizationId } = body

    if (!packageId || !organizationId) {
      return NextResponse.json(
        { error: "packageId and organizationId are required" },
        { status: 400 },
      )
    }

    const session = await DocumentGenerationWizardService.startWizard(ctx, {
      packageId,
      organizationId,
    })

    return NextResponse.json({ data: session }, { status: 201 })
  } catch (error) {
    console.error("[Document Wizard API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

