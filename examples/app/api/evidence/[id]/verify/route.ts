import { createExecutionContext } from "@/lib/execution-context"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext()

    if (!ctx.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, reviewNotes } = body

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const { data, error } = await ctx.db.supabase
      .from("evidence")
      .update({
        status,
        review_notes: reviewNotes,
        reviewed_by: ctx.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Failed to verify evidence:", error)
    return NextResponse.json({ error: "Failed to verify evidence" }, { status: 500 })
  }
}
