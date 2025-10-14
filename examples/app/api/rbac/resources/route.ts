import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: resources, error } = await supabase
      .from("resources")
      .select("id, name, code, description")
      .eq("is_active", true)
      .order("name")

    if (error) {
      console.error("[v0] Failed to fetch resources:", error)
      return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 })
    }

    return NextResponse.json({ data: resources })
  } catch (error) {
    console.error("[v0] Failed to fetch resources:", error)
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 })
  }
}
