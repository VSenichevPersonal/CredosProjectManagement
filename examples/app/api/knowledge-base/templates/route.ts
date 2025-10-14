import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams

    const category = searchParams.get("category")
    const regulator = searchParams.get("regulator")

    let query = supabase.from("control_templates").select("*").order("created_at", { ascending: false })

    if (category) query = query.eq("category", category)
    if (regulator) query = query.eq("regulator_id", regulator)

    const { data: templates, error } = await query

    if (error) {
      console.error("[v0] Failed to fetch templates:", error)
      return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("[v0] KB templates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
