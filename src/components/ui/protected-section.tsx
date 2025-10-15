/**
 * ProtectedSection - Atomic Component
 * Секция с проверкой roles/permissions
 * 
 * Architecture:
 * - Atomic Design: Organism
 * - Conditional rendering
 * - Access Control integration
 */

import * as React from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import type { UserRole, Permission } from "@/lib/access-control/permissions"

export interface ProtectedSectionProps {
  role?: UserRole
  permission?: Permission
  requireAll?: Permission[]
  requireAny?: Permission[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function ProtectedSection({
  role,
  permission,
  requireAll,
  requireAny,
  fallback,
  children
}: ProtectedSectionProps) {
  const { hasRole, hasPermission, hasAllPermissions, hasAnyPermission } = useAuth()

  let hasAccess = true

  // Check role
  if (role && !hasRole(role)) {
    hasAccess = false
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    hasAccess = false
  }

  // Check all permissions
  if (requireAll && !hasAllPermissions(requireAll)) {
    hasAccess = false
  }

  // Check any permission
  if (requireAny && !hasAnyPermission(requireAny)) {
    hasAccess = false
  }

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

// ============================================================================
// Convenience Components
// ============================================================================

export function AdminSection({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <ProtectedSection role="admin" fallback={fallback}>{children}</ProtectedSection>
}

export function ManagerSection({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { isAdmin, isManager } = useAuth()
  
  if (!isAdmin && !isManager) {
    return fallback ? <>{fallback}</> : null
  }
  
  return <>{children}</>
}

