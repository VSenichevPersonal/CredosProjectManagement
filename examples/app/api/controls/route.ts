import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: controls, error } = await supabase.from("controls").select("*").order("code", { ascending: true })

    if (error) throw error

    return NextResponse.json({ data: controls })
  } catch (error) {
    console.error("Failed to fetch controls:", error)
    return NextResponse.json({ error: "Failed to fetch controls" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const { requirementIds, ...controlData } = body

    const { data: control, error: controlError } = await supabase
      .from("controls")
      .insert([controlData])
      .select()
      .single()

    if (controlError) throw controlError

    if (requirementIds && Array.isArray(requirementIds) && requirementIds.length > 0) {
      const mappings = requirementIds.map((requirementId: string) => ({
        requirement_id: requirementId,
        control_id: control.id,
        mapping_type: "direct",
        coverage_percentage: 100,
      }))

      const { error: mappingError } = await supabase.from("requirement_controls").insert(mappings)

      if (mappingError) {
        console.error("[v0] Failed to create requirement mappings:", mappingError)
        // Don't fail the whole operation if mappings fail
      }
    }

    return NextResponse.json({ data: control }, { status: 201 })
  } catch (error) {
    console.error("Failed to create control:", error)
    return NextResponse.json({ error: "Failed to create control" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const { id, requirementIds, ...controlData } = body

    if (!id) {
      return NextResponse.json({ error: "Control ID is required" }, { status: 400 })
    }

    const { data: control, error: controlError } = await supabase
      .from("controls")
      .update(controlData)
      .eq("id", id)
      .select()
      .single()

    if (controlError) throw controlError

    // Update requirement mappings if provided
    if (requirementIds !== undefined) {
      // Delete existing mappings
      const { error: deleteError } = await supabase.from("requirement_controls").delete().eq("control_id", id)

      if (deleteError) {
        console.error("[v0] Failed to delete existing requirement mappings:", deleteError)
      }

      // Insert new mappings
      if (Array.isArray(requirementIds) && requirementIds.length > 0) {
        const mappings = requirementIds.map((requirementId: string) => ({
          requirement_id: requirementId,
          control_id: id,
          mapping_type: "direct",
          coverage_percentage: 100,
        }))

        const { error: mappingError } = await supabase.from("requirement_controls").insert(mappings)

        if (mappingError) {
          console.error("[v0] Failed to create requirement mappings:", mappingError)
        }
      }
    }

    return NextResponse.json({ data: control })
  } catch (error) {
    console.error("Failed to update control:", error)
    return NextResponse.json({ error: "Failed to update control" }, { status: 500 })
  }
}
