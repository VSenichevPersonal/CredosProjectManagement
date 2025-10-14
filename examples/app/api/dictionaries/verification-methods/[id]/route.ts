import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const { id } = params

    // Check if verification method is used in any requirements
    const { data: requirements, error: checkError } = await supabase
      .from("requirements")
      .select("id")
      .eq("verification_method_id", id)
      .limit(1)

    if (checkError) throw checkError

    if (requirements && requirements.length > 0) {
      return NextResponse.json(
        { error: "Невозможно удалить способ подтверждения, так как он используется в требованиях" },
        { status: 400 },
      )
    }

    // Delete verification method
    const { error: deleteError } = await supabase.from("verification_methods").delete().eq("id", id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Failed to delete verification method:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete verification method" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const { id } = params
    const body = await request.json()

    const { data, error } = await supabase
      .from("verification_methods")
      .update({
        code: body.code,
        name: body.name,
        description: body.description,
        is_active: body.is_active,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating verification method:", error)
      throw error
    }

    console.log("[v0] Verification method updated:", id)
    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Failed to update verification method:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update verification method" },
      { status: 500 },
    )
  }
}
