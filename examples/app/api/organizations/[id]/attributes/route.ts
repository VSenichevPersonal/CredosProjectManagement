import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const { id } = params

    const { data: organization, error } = await supabase
      .from("organizations")
      .select(
        "kii_category, pdn_level, is_financial, is_healthcare, is_government, employee_count, has_foreign_data, attributes_updated_at, attributes_updated_by",
      )
      .eq("id", id)
      .single()

    if (error) throw error

    return NextResponse.json({
      kiiCategory: organization.kii_category,
      pdnLevel: organization.pdn_level,
      isFinancial: organization.is_financial,
      isHealthcare: organization.is_healthcare,
      isGovernment: organization.is_government,
      employeeCount: organization.employee_count,
      hasForeignData: organization.has_foreign_data,
      attributesUpdatedAt: organization.attributes_updated_at,
      attributesUpdatedBy: organization.attributes_updated_by,
    })
  } catch (error) {
    console.error("Failed to fetch organization attributes:", error)
    return NextResponse.json({ error: "Failed to fetch organization attributes" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const { id } = params
    const body = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("organizations")
      .update({
        kii_category: body.kiiCategory,
        pdn_level: body.pdnLevel,
        is_financial: body.isFinancial,
        is_healthcare: body.isHealthcare,
        is_government: body.isGovernment,
        employee_count: body.employeeCount,
        has_foreign_data: body.hasForeignData,
        attributes_updated_at: new Date().toISOString(),
        attributes_updated_by: user.id,
      })
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update organization attributes:", error)
    return NextResponse.json({ error: "Failed to update organization attributes" }, { status: 500 })
  }
}
