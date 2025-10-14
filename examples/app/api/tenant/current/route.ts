import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        `
        id,
        role_id,
        tenant_id,
        organization_id,
        roles!inner (
          name
        ),
        tenants (
          id,
          name,
          slug,
          is_active
        )
      `,
      )
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      console.error("[v0] User not found:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!userData.tenants) {
      console.log("[v0] User has no tenant assigned:", user.id)
      return NextResponse.json({ error: "No tenant assigned to user", userId: user.id }, { status: 404 })
    }

    const isSuperAdmin = userData.roles?.name === "super_admin"
    let currentTenant = userData.tenants

    // For super_admin, check cookie for selected tenant
    if (isSuperAdmin) {
      const cookieStore = await cookies()
      const selectedTenantId = cookieStore.get("selected_tenant_id")?.value

      if (selectedTenantId) {
        const { data: selectedTenant } = await supabase
          .from("tenants")
          .select("id, name, slug, is_active")
          .eq("id", selectedTenantId)
          .eq("is_active", true)
          .single()

        if (selectedTenant) {
          currentTenant = selectedTenant
        }
      }
    }

    return NextResponse.json({
      tenant: {
        id: currentTenant.id,
        name: currentTenant.name,
        slug: currentTenant.slug,
        isActive: currentTenant.is_active,
      },
      canSwitch: isSuperAdmin,
    })
  } catch (error) {
    console.error("[v0] Error getting current tenant:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
