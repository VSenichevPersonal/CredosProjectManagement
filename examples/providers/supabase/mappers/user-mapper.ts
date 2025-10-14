import type { User } from "@/types/domain/user"

export const UserMapper = {
  fromDb(row: any): User {
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      organizationId: row.organization_id,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      tenantId: row.tenant_id,
    }
  },

  toDb(user: Partial<User>): any {
    return {
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      organization_id: user.organizationId,
      is_active: user.isActive,
      tenant_id: user.tenantId,
    }
  },
}
