import { type NextRequest, NextResponse } from "next/server"
import { createExecutionContext } from "@/lib/context/execution-context"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const organizationId = params.id

    console.log("[v0] GET /api/organizations/[id]/controls - organizationId:", organizationId)

    const ctx = await createExecutionContext()

    const query = ctx.db.supabase
      .from("organization_controls")
      .select(
        `
        id,
        implementation_status,
        implementation_date,
        verification_date,
        next_review_date,
        responsible_user_id,
        implementation_notes,
        control:control_id (
          id,
          code,
          title,
          description,
          category,
          control_type,
          frequency,
          is_automated
        )
      `,
      )
      .eq("organization_id", organizationId)
      .eq("tenant_id", ctx.tenantId)
      .order("created_at", { ascending: false })

    const { data: orgControls, error } = await query

    if (error) {
      console.error("[v0] Failed to fetch organization controls:", error)
      return NextResponse.json({ error: "Failed to fetch controls" }, { status: 500 })
    }

    const mappedControls = (orgControls || []).map((oc: any) => ({
      id: oc.id,
      control: oc.control
        ? {
            id: oc.control.id,
            code: oc.control.code,
            title: oc.control.title,
            description: oc.control.description,
            type: oc.control.control_type,
            frequency: oc.control.frequency,
          }
        : null,
      status: oc.implementation_status,
      effectiveness: null, // Not in current schema
      last_test_date: oc.verification_date,
      next_test_date: oc.next_review_date,
      responsible_user_id: oc.responsible_user_id,
      notes: oc.implementation_notes,
    }))

    console.log("[v0] Organization controls fetched:", { count: mappedControls.length })

    return NextResponse.json({ controls: mappedControls })
  } catch (error) {
    console.error("[v0] Error in GET /api/organizations/[id]/controls:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
