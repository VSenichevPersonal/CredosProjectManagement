import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const regulatorFilter = searchParams.get("regulator")
    const criticalityFilter = searchParams.get("criticality")

    let requirementsQuery = supabase
      .from("requirements")
      .select("id, code, title, regulator_id, criticality")
      .order("code")

    if (regulatorFilter) {
      requirementsQuery = requirementsQuery.eq("regulator_id", regulatorFilter)
    }
    if (criticalityFilter) {
      requirementsQuery = requirementsQuery.eq("criticality", criticalityFilter)
    }

    const { data: requirements, error: reqError } = await requirementsQuery

    if (reqError) {
      console.error("[v0] Failed to fetch requirements:", reqError)
      return NextResponse.json({ error: "Failed to fetch requirements" }, { status: 500 })
    }

    const { data: organizations, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, type_id, parent_id, organization_types(code, name)")
      .order("name")

    if (orgError) {
      console.error("[v0] Failed to fetch organizations:", orgError)
      return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 })
    }

    const { data: compliance, error: compError } = await supabase
      .from("compliance_records")
      .select("requirement_id, organization_id, status")

    if (compError) {
      console.error("[v0] Failed to fetch compliance:", compError)
      return NextResponse.json({ error: "Failed to fetch compliance" }, { status: 500 })
    }

    // Build heatmap matrix
    const matrix: Record<string, Record<string, string>> = {}

    requirements?.forEach((req) => {
      matrix[req.id] = {}
      organizations?.forEach((org) => {
        const complianceRecord = compliance?.find((c) => c.requirement_id === req.id && c.organization_id === org.id)
        matrix[req.id][org.id] = complianceRecord?.status || "not_assigned"
      })
    })

    return NextResponse.json({
      requirements: requirements || [],
      organizations: organizations || [],
      matrix,
    })
  } catch (error) {
    console.error("[v0] Heatmap error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
