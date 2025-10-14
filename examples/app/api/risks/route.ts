import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    logger.info("[v0] API: Fetching risks")

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      logger.warn("[v0] API: Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get("organizationId")
    const status = searchParams.get("status")
    const level = searchParams.get("level")

    let query = supabase
      .from("risks")
      .select(`
        *,
        organization:organizations(id, name),
        requirement:requirements(id, code, title),
        category:risk_categories(id, name, color),
        owner:users(id, full_name, email)
      `)
      .order("risk_score", { ascending: false })

    if (organizationId) {
      query = query.eq("organization_id", organizationId)
    }
    if (status) {
      query = query.eq("status", status)
    }
    if (level) {
      query = query.eq("risk_level", level)
    }

    const { data: risks, error } = await query

    if (error) {
      logger.error("[v0] API: Error fetching risks", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logger.info("[v0] API: Risks fetched successfully", { count: risks?.length })
    return NextResponse.json(risks)
  } catch (error: any) {
    logger.error("[v0] API: Unexpected error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.info("[v0] API: Creating new risk")

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const { data: risk, error } = await supabase.from("risks").insert([body]).select().single()

    if (error) {
      logger.error("[v0] API: Error creating risk", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logger.info("[v0] API: Risk created successfully", { riskId: risk.id })
    return NextResponse.json(risk, { status: 201 })
  } catch (error: any) {
    logger.error("[v0] API: Unexpected error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
