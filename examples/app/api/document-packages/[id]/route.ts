/**
 * @intent: API endpoint for single document package
 * @architecture: RESTful endpoint with ExecutionContext
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { DocumentPackageService } from "@/services/document-package-service"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const ctx = await createExecutionContext(supabase)

    const pkg = await DocumentPackageService.getById(ctx, params.id)

    return NextResponse.json({ data: pkg })
  } catch (error) {
    console.error("[Document Package API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

