import { createServerClient } from "@/lib/supabase/server"

export interface ExtendedUser {
  id: string
  email?: string
  role: string
  organizationId?: string
  tenantId?: string
  fullName?: string
  subordinateOrganizationIds?: string[]
}

export async function getCurrentUser(): Promise<ExtendedUser | null> {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error("[v0] [getCurrentUser] Auth error:", authError)
    return null
  }

  if (!user) {
    return null
  }

  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("role, organization_id, tenant_id, name")
    .eq("id", user.id)
    .single()

  if (userDataError) {
    console.error("[v0] [getCurrentUser] Error fetching user data:", {
      error: userDataError,
      userId: user.id,
      email: user.email,
    })
    return {
      id: user.id,
      email: user.email,
      role: "authenticated",
      subordinateOrganizationIds: [],
    }
  }

  if (!userData) {
    console.error("[v0] [getCurrentUser] No user data found in users table:", {
      userId: user.id,
      email: user.email,
    })
    return {
      id: user.id,
      email: user.email,
      role: "authenticated",
      subordinateOrganizationIds: [],
    }
  }

  let subordinateOrganizationIds: string[] = []

  if (userData?.organization_id) {
    const { data: subordinateOrgs, error } = await supabase.rpc("get_subordinate_organizations", {
      org_id: userData.organization_id,
    })

    if (error) {
      console.error("[v0] [getCurrentUser] Error loading subordinate organizations:", error)
    } else {
      subordinateOrganizationIds = subordinateOrgs?.map((org: { id: string }) => org.id) || []

      console.log("[v0] [getCurrentUser] Loaded subordinate organizations", {
        organizationId: userData.organization_id,
        subordinateCount: subordinateOrganizationIds.length,
        subordinateIds: subordinateOrganizationIds,
      })
    }
  } else {
    console.log(
      "[v0] [getCurrentUser] User has no organization_id (likely super_admin), skipping subordinate organizations",
    )
  }

  console.log("[v0] [getCurrentUser] User data fetched successfully:", {
    userId: user.id,
    role: userData.role,
    tenantId: userData.tenant_id,
    organizationId: userData.organization_id,
  })

  return {
    id: user.id,
    email: user.email,
    role: userData?.role || "authenticated",
    organizationId: userData?.organization_id,
    tenantId: userData?.tenant_id,
    fullName: userData?.name,
    subordinateOrganizationIds,
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}
