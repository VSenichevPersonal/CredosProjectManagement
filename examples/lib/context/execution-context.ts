/**
 * @intent: Single source of truth for all execution dependencies
 * @llm-note: This object is passed to every service and contains all runtime state
 * @architecture: Core pattern - all business logic depends on this context
 */

import type { DatabaseProvider } from "@/providers/database-provider"
import type { User } from "@/types/domain/user"
import type { Logger } from "@/lib/utils/logger"
import type { AccessControlService } from "@/lib/services/access-control-service"
import type { AuditService } from "@/lib/services/audit-service"
import type { AuthorizationService } from "@/lib/services/authorization-service"
import type { ApplicabilityService } from "@/services/applicability-service"

export interface ExecutionContext {
  // User context
  user?: User
  organizationId?: string
  tenantId?: string

  // Infrastructure providers
  db: DatabaseProvider

  // Business services
  logger: Logger
  audit: AuditService
  access: AccessControlService
  authz: AuthorizationService
  applicability: ApplicabilityService

  // Request metadata
  requestId: string
  timestamp: Date

  // Request object (for headers, etc.)
  request?: Request

  getSubordinateOrganizations?: () => Promise<string[]>
}

/**
 * @intent: Type guard to check if user is authenticated
 * @llm-note: Use this to ensure user exists before accessing user properties
 */
export function requireAuth(ctx: ExecutionContext): asserts ctx is ExecutionContext & { user: User } {
  if (!ctx.user) {
    throw new Error("Authentication required")
  }
}

/**
 * @intent: Type guard to check if user has organization
 * @llm-note: Use this for operations that require organization context
 */
export function requireOrganization(
  ctx: ExecutionContext,
): asserts ctx is ExecutionContext & { user: User; organizationId: string } {
  requireAuth(ctx)
  if (!ctx.organizationId) {
    throw new Error("Organization context required")
  }
}

/**
 * @intent: Type guard to check if user has tenant
 * @llm-note: Use this for operations that require tenant context
 */
export function requireTenant(
  ctx: ExecutionContext,
): asserts ctx is ExecutionContext & { user: User; tenantId: string } {
  requireAuth(ctx)
  if (!ctx.tenantId) {
    throw new Error("Tenant context required")
  }
}

export { createExecutionContext } from "./create-context"
