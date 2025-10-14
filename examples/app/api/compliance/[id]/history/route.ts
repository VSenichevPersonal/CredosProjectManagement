import { createExecutionContext } from "@/lib/context/create-context"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await createExecutionContext()

    if (!ctx.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Tenant filtering is handled by RLS policies
    const { data, error } = await ctx.db.supabase
      .from("compliance_history")
      .select(
        `
        *,
        user:users(id, name, email)
      `,
      )
      .eq("compliance_record_id", params.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error("[v0] Failed to fetch compliance history:", error)
    return NextResponse.json({ error: "Failed to fetch compliance history" }, { status: 500 })
  }
}
