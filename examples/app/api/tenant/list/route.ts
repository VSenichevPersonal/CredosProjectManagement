import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        `
        id,
        role_id,
        roles!inner (
          name
        )
      `,
      )
      .eq("id", user.id) // Use id instead of auth_id
      .single()

    if (userError || !userData) {
      logger.error("User not found in public.users", { userId: user.id, error: userError })
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isSuperAdmin = userData.roles?.name === "super_admin"

    if (isSuperAdmin) {
      // Super admin can see all tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, name, slug, description")
        .eq("is_active", true)
        .order("name")

      if (tenantsError) {
        logger.error("Failed to fetch tenants", { error: tenantsError })
        return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 })
      }

      return NextResponse.json({ tenants })
    }

    const { data: userWithTenant, error: tenantError } = await supabase
      .from("users")
      .select(
        `
        tenant_id,
        tenants!inner (
          id,
          name,
          slug,
          description
        )
      `,
      )
      .eq("id", user.id) // Use id instead of auth_id
      .single()

    if (tenantError || !userWithTenant) {
      logger.error("Tenant not found for user", { userId: user.id, error: tenantError })
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    return NextResponse.json({
      tenants: [userWithTenant.tenants],
    })
  } catch (error) {
    logger.error("Error fetching tenants", { error })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
