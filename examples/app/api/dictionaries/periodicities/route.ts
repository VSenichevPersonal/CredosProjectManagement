import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("periodicities")
      .select("id, code, name, description")
      .eq("is_active", true)
      .order("name")

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Failed to fetch periodicities:", error)
    return NextResponse.json({ error: "Failed to fetch periodicities" }, { status: 500 })
  }
}
