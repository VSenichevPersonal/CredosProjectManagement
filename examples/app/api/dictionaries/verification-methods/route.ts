import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("verification_methods")
      .select("id, code, name, description, is_active, created_at")
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching verification methods:", error)
      throw error
    }

    console.log("[v0] Verification methods loaded:", data?.length || 0)
    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Failed to fetch verification methods:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch verification methods" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("verification_methods")
      .insert({
        code: body.code,
        name: body.name,
        description: body.description,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating verification method:", error)
      throw error
    }

    console.log("[v0] Verification method created:", data.id)
    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Failed to create verification method:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create verification method" },
      { status: 500 },
    )
  }
}
