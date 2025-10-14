/**
 * @intent: Access control service for permission checking
 * @llm-note: Centralized permission management
 * @architecture: Service layer - handles all access control logic
 */

import type { AccessControlService, Permission, UserRole } from '@/lib/context/execution-context'

export class AccessControlServiceImpl implements AccessControlService {
  constructor(
    private roles: UserRole[],
    private permissions: Permission[]
  ) {}

  async require(permission: Permission): Promise<void> {
    if (!this.check(permission)) {
      throw new Error(`Access denied: missing permission '${permission}'`)
    }
  }

  check(permission: Permission): boolean {
    return this.permissions.includes(permission)
  }

  hasRole(role: UserRole): boolean {
    return this.roles.includes(role)
  }
}
