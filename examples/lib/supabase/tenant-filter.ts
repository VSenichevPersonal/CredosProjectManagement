import { logger } from "@/lib/logger"

/**
 * Applies tenant_id filter to a Supabase query
 * @param query - Supabase query builder
 * @param tenantId - Tenant ID to filter by
 * @returns Query with tenant filter applied
 */
export function withTenantFilter<T extends { eq: (col: string, val: any) => T }>(query: T, tenantId: string): T {
  if (!tenantId) {
    throw new Error("tenantId is required for all database operations. This indicates a configuration error.")
  }
  logger.trace("[withTenantFilter] Applying tenant filter", { tenantId })
  return query.eq("tenant_id", tenantId)
}
