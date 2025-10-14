/**
 * @intent: API endpoint for document packages
 * @architecture: RESTful endpoint with ExecutionContext
 */

import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"
import { DocumentPackageService } from "@/services/document-package-service"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ctx = await createExecutionContext(supabase)

    const packages = await DocumentPackageService.list(ctx)

    return NextResponse.json({ data: packages })
  } catch (error) {
    console.error("[Document Packages API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

