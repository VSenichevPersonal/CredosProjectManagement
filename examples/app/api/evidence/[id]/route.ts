import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { EvidenceService } from "@/services/evidence-service"
import { createExecutionContext } from "@/lib/context/create-context"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    const { data: evidence, error } = await supabase
      .from("evidence")
      .select(
        `
        *,
        uploaded_by_user:users!evidence_uploaded_by_fkey(id, name, email),
        reviewed_by_user:users!evidence_reviewed_by_fkey(id, name, email),
        compliance_record:compliance_records(
          id,
          requirement:requirements(id, code, title)
        ),
        organization:organizations(id, name),
        control_measure_evidence(
          id,
          notes,
          relevance_score,
          control_measure:control_measures(id, title, description, status)
        )
      `,
      )
      .eq("id", params.id)
      .single()

    if (error) throw error

    return NextResponse.json({ data: evidence })
  } catch (error) {
    console.error("[Evidence API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: error instanceof Error && error.message.includes("not found") ? 404 : 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    const body = await request.json()

    const evidence = await EvidenceService.update(ctx, params.id, body)

    return NextResponse.json({ data: evidence })
  } catch (error) {
    console.error("[Evidence API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: error instanceof Error && error.message.includes("not found") ? 404 : 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const ctx = await createExecutionContext(supabase)

    const evidence = await EvidenceService.getById(ctx, params.id)

    if (evidence.storagePath) {
      const { error: storageError } = await supabase.storage.from("evidence-files").remove([evidence.storagePath])
      if (storageError) {
        console.error("[Evidence API] Storage deletion error:", storageError)
      }
    }

    await EvidenceService.delete(ctx, params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Evidence API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: error instanceof Error && error.message.includes("not found") ? 404 : 500 },
    )
  }
}
