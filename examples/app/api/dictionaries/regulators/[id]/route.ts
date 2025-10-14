import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/get-user"
import { NextResponse } from "next/server"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to delete
    if (user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden: Only super_admin can delete regulators" }, { status: 403 })
    }

    const { id } = params

    // First check if regulator exists and belongs to current tenant
    const { data: regulator, error: fetchError } = await supabase
      .from("regulators")
      .select("id, tenant_id, name")
      .eq("id", id)
      .eq("tenant_id", user.tenantId)
      .single()

    if (fetchError || !regulator) {
      return NextResponse.json({ error: "Regulator not found or access denied" }, { status: 404 })
    }

    // Check if regulator is used in regulatory_frameworks
    const { data: frameworks, error: frameworksError } = await supabase
      .from("regulatory_frameworks")
      .select("id")
      .eq("regulator_id", id)
      .limit(1)

    if (frameworksError) {
      console.error("[v0] Error checking regulatory frameworks:", frameworksError)
      return NextResponse.json({ error: "Error checking dependencies" }, { status: 500 })
    }

    if (frameworks && frameworks.length > 0) {
      return NextResponse.json(
        {
          error: `Невозможно удалить регулятора "${regulator.name}", так как он используется в нормативных документах`,
        },
        { status: 400 },
      )
    }

    // Delete the regulator
    const { error: deleteError } = await supabase
      .from("regulators")
      .delete()
      .eq("id", id)
      .eq("tenant_id", user.tenantId)

    if (deleteError) {
      console.error("[v0] Error deleting regulator:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log(`[v0] Regulator deleted successfully: ${regulator.name} (${id})`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in regulator deletion API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
