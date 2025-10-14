/**
 * @intent: API endpoint for saving wizard answers
 * @architecture: RESTful endpoint with ExecutionContext
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { DocumentGenerationWizardService } from "@/services/document-generation-wizard-service"
import { createClient } from "@/lib/supabase/server"

/**
 * PATCH /api/document-wizard/:id/answers
 * Save questionnaire answers
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const ctx = await createExecutionContext(supabase)

    const body = await request.json()
    const { answers } = body

    if (!answers) {
      return NextResponse.json({ error: "answers are required" }, { status: 400 })
    }

    const session = await DocumentGenerationWizardService.saveAnswers(ctx, params.id, {
      answers,
    })

    return NextResponse.json({ data: session })
  } catch (error) {
    console.error("[Document Wizard Answers API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

