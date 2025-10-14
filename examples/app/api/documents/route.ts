import { type NextRequest, NextResponse } from "next/server"
import { DocumentService } from "@/services/document-service"
import { createDocumentSchema } from "@/types/dto/document-dto"
import { createExecutionContext } from "@/lib/context/execution-context"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ctx = await createExecutionContext(supabase)

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const requirementId = searchParams.get("requirementId")
    const search = searchParams.get("search")
    const organizationId = searchParams.get("organizationId")

    const filters = {
      status: status || undefined,
      requirementId: requirementId || undefined,
      search: search || undefined,
      organizationId: organizationId || undefined,
    }

    const documents = await DocumentService.list(ctx, filters)

    return NextResponse.json({ data: documents })
  } catch (error) {
    console.error("[Documents API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ctx = await createExecutionContext(supabase)

    const body = await request.json()
    const validatedData = createDocumentSchema.parse(body)

    const document = await DocumentService.create(ctx, validatedData)

    return NextResponse.json({ data: document }, { status: 201 })
  } catch (error) {
    console.error("[Documents API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
