/**
 * @intent: Check user permissions and access control
 * @llm-note: Used via ctx.access.can() in all services
 * @architecture: RBAC + ABAC (Attribute-Based Access Control)
 */

import type { User } from "@/types/domain/user"
import type { DatabaseProvider } from "@/providers/database-provider"
import type { Logger } from "@/lib/utils/logger"
import { Permission, ROLE_PERMISSIONS, Role } from "@/lib/access-control/permissions"

export class AccessControlService {
  constructor(
    private user: User | undefined,
    private db: DatabaseProvider,
    private logger: Logger,
  ) {}

  /**
   * @intent: Check if user has permission
   * @llm-note: Use this for simple permission checks
   * @precondition: User is authenticated (or returns false)
   * @postcondition: Returns true if user has permission
   */
  async can(permission: Permission): Promise<boolean> {
    if (!this.user) {
      this.logger.debug("[v0] Access denied: No user", { permission })
      return false
    }

    const userPermissions = ROLE_PERMISSIONS[this.user.role as Role] || []
    const hasPermission = userPermissions.includes(permission)

    this.logger.debug("[v0] Permission check", {
      userId: this.user.id,
      role: this.user.role,
      permission,
      hasPermission,
    })

    return hasPermission
  }

  /**
   * @intent: Check if user can access organization
   * @llm-note: ABAC - checks organizational hierarchy
   * @precondition: User is authenticated
   * @postcondition: Returns true if user can access organization
   */
  async canAccessOrganization(organizationId: string): Promise<boolean> {
    if (!this.user) return false

    // Super admin can access all
    if (this.user.role === Role.SUPER_ADMIN) {
      return true
    }

    // User can access their own organization
    if (this.user.organizationId === organizationId) {
      return true
    }

    // Ministry user can access subordinate organizations
    if (this.user.role === Role.MINISTRY_USER && this.user.organizationId) {
      const subordinates = await this.db.organizations.findHierarchy(this.user.organizationId)
      return subordinates.some((org) => org.id === organizationId)
    }

    this.logger.warn("[v0] Organization access denied", {
      userId: this.user.id,
      requestedOrgId: organizationId,
      userOrgId: this.user.organizationId,
    })

    return false
  }

  /**
   * @intent: Check if user can edit compliance record
   * @llm-note: Complex ABAC rule combining permission and organization access
   * @precondition: User is authenticated
   * @postcondition: Returns true if user can edit compliance
   */
  async canEditCompliance(complianceId: string): Promise<boolean> {
    if (!this.user) return false

    // Check basic permission
    if (!(await this.can(Permission.COMPLIANCE_UPDATE))) {
      return false
    }

    // Get compliance record
    const compliance = await this.db.compliance.findById(complianceId)
    if (!compliance) {
      this.logger.warn("[v0] Compliance not found", { complianceId })
      return false
    }

    // Check organization access
    return this.canAccessOrganization(compliance.organizationId)
  }

  /**
   * @intent: Require permission or throw error
   * @llm-note: Use this to enforce permissions in services
   * @throws: ForbiddenError if user doesn't have permission
   */
  async require(permission: Permission): Promise<void> {
    if (!(await this.can(permission))) {
      throw new ForbiddenError(`Permission denied: ${permission}`)
    }
  }
}

/**
 * @intent: Custom error for forbidden access
 * @llm-note: Thrown when user doesn't have required permission
 */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ForbiddenError"
  }
}
