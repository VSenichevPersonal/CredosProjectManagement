import { createServerClient } from "@/lib/supabase/server"

/**
 * Get all subordinate organizations for a given organization
 * Includes the organization itself and all its children recursively
 */
export async function getSubordinateOrganizations(organizationId: string): Promise<string[]> {
  const supabase = await createServerClient()

  const { data: subordinateOrgs, error } = await supabase.rpc("get_subordinate_organizations", {
    org_id: organizationId,
  })

  if (error) {
    console.error("[v0] Failed to get subordinate organizations:", error)
    return [organizationId]
  }

  return subordinateOrgs?.map((org: any) => org.id) || [organizationId]
}
