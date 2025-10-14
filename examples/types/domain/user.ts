export type UserRole = "super_admin" | "regulator_admin" | "ministry_user" | "institution_user" | "ciso" | "auditor"

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  organizationId: string
  tenantId: string // Added tenantId - every user belongs to a tenant
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}
