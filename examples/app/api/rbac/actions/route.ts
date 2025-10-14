import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: actions, error } = await supabase
      .from("actions")
      .select("id, name, code, description")
      .eq("is_active", true)
      .order("code")

    if (error) {
      console.error("[v0] Failed to fetch actions:", error)
      return NextResponse.json({ error: "Failed to fetch actions" }, { status: 500 })
    }

    // Sort by predefined order
    const sortOrder: Record<string, number> = {
      read: 1,
      create: 2,
      update: 3,
      delete: 4,
      approve: 5,
      export: 6,
      manage: 7,
    }

    const sortedActions = actions?.sort((a, b) => {
      const orderA = sortOrder[a.code] || 999
      const orderB = sortOrder[b.code] || 999
      return orderA - orderB
    })

    return NextResponse.json({ data: sortedActions })
  } catch (error) {
    console.error("[v0] Failed to fetch actions:", error)
    return NextResponse.json({ error: "Failed to fetch actions" }, { status: 500 })
  }
}
