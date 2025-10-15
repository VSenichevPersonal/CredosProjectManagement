/**
 * @intent: Single source of truth for all execution dependencies
 * @llm-note: This object is passed to every service and contains all runtime state
 * @architecture: Core pattern - all business logic depends on this context
 */

import type { Employee } from '@/types/domain'
import type { DatabaseProvider } from '@/providers/database-provider.interface'
import type { UserRole, Permission } from '@/lib/access-control/permissions'

export interface Logger {
  trace(message: string, meta?: any): void
  debug(message: string, meta?: any): void
  info(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  error(message: string, meta?: any): void
}

export interface AccessControlService {
  require(permission: Permission): Promise<void>
  check(permission: Permission): boolean
  hasRole(role: UserRole): boolean
  getRoles(): UserRole[]
  getPermissions(): Permission[]
}

export interface ExecutionContext {
  // User context
  user: Employee
  userId: string
  employeeId: string
  
  // Infrastructure providers
  db: DatabaseProvider
  
  // Business services
  logger: Logger
  access: AccessControlService
  
  // Request metadata
  requestId: string
  timestamp: Date
  
  // Request object (for headers, etc.)
  request?: Request
}

// Helper functions
export function hasPermission(ctx: ExecutionContext, permission: Permission): boolean {
  return ctx.access.check(permission)
}

export function hasRole(ctx: ExecutionContext, role: UserRole): boolean {
  return ctx.access.hasRole(role)
}

export function canAccessEmployee(ctx: ExecutionContext, employeeId: string): boolean {
  // Admin can access everyone
  if (hasRole(ctx, 'admin')) return true
  
  // Managers can access their team members (будет реализовано через employee_hierarchy)
  if (hasRole(ctx, 'manager')) {
    // TODO: Проверить иерархию через employee_hierarchy таблицу
    return false // Временно отключено
  }
  
  // Employees can only access themselves
  return ctx.employeeId === employeeId
}

export function canAccessProject(ctx: ExecutionContext, projectId: string): boolean {
  // Admin can access all projects
  if (hasRole(ctx, 'admin')) return true
  
  // Managers can access projects in their direction
  if (hasRole(ctx, 'manager')) {
    // TODO: Implement project access check by direction
    return true
  }
  
  // Employees can access projects they're assigned to
  // TODO: Implement project assignment check
  return true
}

export function canApproveTimeEntries(ctx: ExecutionContext): boolean {
  // TODO: Add time_entries:approve permission to permissions.ts
  return hasPermission(ctx, 'time_entries:read') // Temporary workaround
}

export function canManageEmployees(ctx: ExecutionContext): boolean {
  return hasPermission(ctx, 'employees:create') || 
         hasPermission(ctx, 'employees:update') || 
         hasPermission(ctx, 'employees:delete')
}

export function canViewReports(ctx: ExecutionContext): boolean {
  // TODO: Add reports:read permission to permissions.ts
  return hasPermission(ctx, 'reports:view') || hasRole(ctx, 'admin') || hasRole(ctx, 'manager')
}

export function canViewFinance(ctx: ExecutionContext): boolean {
  // TODO: Add finance permissions to permissions.ts
  return hasRole(ctx, 'admin') || hasRole(ctx, 'manager')
}
