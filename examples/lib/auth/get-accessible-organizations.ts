import type { ExtendedUser } from "./get-user"

/**
 * Get list of organization IDs that user can access
 *
 * Access rules:
 * - super_admin: all organizations in tenant
 * - regulator: all organizations in tenant
 * - other roles: own organization + subordinate organizations
 */
export function getAccessibleOrganizationIds(user: ExtendedUser): string[] | "all" {
  // Super admin and regulator see all organizations in tenant
  if (user.role === "super_admin" || user.role === "regulator") {
    return "all"
  }

  // User without organization cannot access any organizations
  if (!user.organizationId) {
    return []
  }

  // User sees own organization + subordinate organizations
  return [user.organizationId, ...(user.subordinateOrganizationIds || [])]
}

/**
 * Check if user can access specific organization
 */
export function canAccessOrganization(user: ExtendedUser, organizationId: string): boolean {
  const accessibleIds = getAccessibleOrganizationIds(user)

  // Super admin and regulator can access all
  if (accessibleIds === "all") {
    return true
  }

  // Check if organization is in accessible list
  return accessibleIds.includes(organizationId)
}
