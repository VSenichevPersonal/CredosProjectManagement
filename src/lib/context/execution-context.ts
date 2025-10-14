/**
 * @intent: Single source of truth for all execution dependencies
 * @llm-note: This object is passed to every service and contains all runtime state
 * @architecture: Core pattern - all business logic depends on this context
 */

import type { Employee } from '@/types/domain'
import type { DatabaseProvider } from '@/providers/database-provider.interface'

export interface Logger {
  info(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  error(message: string, meta?: any): void
  debug(message: string, meta?: any): void
}

export interface AccessControlService {
  require(permission: Permission): Promise<void>
  check(permission: Permission): boolean
  hasRole(role: UserRole): boolean
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

export type UserRole = 
  | 'admin'           // Полный доступ ко всем функциям
  | 'manager'         // Управление проектами и командами
  | 'project_manager' // Управление проектами
  | 'team_lead'       // Управление командой
  | 'employee'        // Базовые права сотрудника
  | 'hr'              // HR функции
  | 'finance'         // Финансовые функции

export type Permission = 
  // Project permissions
  | 'projects:read'
  | 'projects:create'
  | 'projects:update'
  | 'projects:delete'
  
  // Task permissions
  | 'tasks:read'
  | 'tasks:create'
  | 'tasks:update'
  | 'tasks:delete'
  
  // Time tracking permissions
  | 'time:read'
  | 'time:create'
  | 'time:update'
  | 'time:delete'
  
  // Approval permissions
  | 'time:approve'
  | 'time:reject'
  
  // Employee permissions
  | 'employees:read'
  | 'employees:create'
  | 'employees:update'
  | 'employees:delete'
  
  // Direction permissions
  | 'directions:read'
  | 'directions:create'
  | 'directions:update'
  | 'directions:delete'
  
  // Reports permissions
  | 'reports:read'
  | 'reports:export'
  
  // Finance permissions
  | 'finance:read'
  | 'finance:update'

// Permission mapping by role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'projects:read', 'projects:create', 'projects:update', 'projects:delete',
    'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete',
    'time:read', 'time:create', 'time:update', 'time:delete', 'time:approve', 'time:reject',
    'employees:read', 'employees:create', 'employees:update', 'employees:delete',
    'directions:read', 'directions:create', 'directions:update', 'directions:delete',
    'reports:read', 'reports:export',
    'finance:read', 'finance:update'
  ],
  manager: [
    'projects:read', 'projects:create', 'projects:update',
    'tasks:read', 'tasks:create', 'tasks:update',
    'time:read', 'time:create', 'time:update', 'time:approve', 'time:reject',
    'employees:read', 'employees:update',
    'directions:read',
    'reports:read', 'reports:export'
  ],
  project_manager: [
    'projects:read', 'projects:create', 'projects:update',
    'tasks:read', 'tasks:create', 'tasks:update',
    'time:read', 'time:approve', 'time:reject',
    'employees:read',
    'reports:read'
  ],
  team_lead: [
    'projects:read',
    'tasks:read', 'tasks:create', 'tasks:update',
    'time:read', 'time:create', 'time:update', 'time:approve',
    'employees:read',
    'reports:read'
  ],
  employee: [
    'projects:read',
    'tasks:read', 'tasks:update',
    'time:read', 'time:create', 'time:update'
  ],
  hr: [
    'employees:read', 'employees:create', 'employees:update',
    'time:read', 'time:approve',
    'reports:read'
  ],
  finance: [
    'projects:read',
    'time:read',
    'employees:read',
    'reports:read', 'reports:export',
    'finance:read', 'finance:update'
  ]
}

// Helper functions
export function hasPermission(ctx: ExecutionContext, permission: Permission): boolean {
  return ctx.permissions.includes(permission)
}

export function hasRole(ctx: ExecutionContext, role: UserRole): boolean {
  return ctx.roles.includes(role)
}

export function canAccessEmployee(ctx: ExecutionContext, employeeId: string): boolean {
  // Admin can access everyone
  if (hasRole(ctx, 'admin')) return true
  
  // Managers can access their team members
  if (hasRole(ctx, 'manager') && ctx.employee.managerId === employeeId) return true
  
  // Team leads can access their team
  if (hasRole(ctx, 'team_lead')) {
    // TODO: Implement team hierarchy check
    return false
  }
  
  // Employees can only access themselves
  return ctx.employeeId === employeeId
}

export function canAccessProject(ctx: ExecutionContext, projectId: string): boolean {
  // Admin can access all projects
  if (hasRole(ctx, 'admin')) return true
  
  // Project managers can access their projects
  if (hasRole(ctx, 'project_manager')) {
    // TODO: Implement project access check
    return true
  }
  
  // Employees can access projects they're assigned to
  // TODO: Implement project assignment check
  return true
}

export function canApproveTimeEntries(ctx: ExecutionContext): boolean {
  return hasPermission(ctx, 'time:approve')
}

export function canManageEmployees(ctx: ExecutionContext): boolean {
  return hasPermission(ctx, 'employees:create') || 
         hasPermission(ctx, 'employees:update') || 
         hasPermission(ctx, 'employees:delete')
}

export function canViewReports(ctx: ExecutionContext): boolean {
  return hasPermission(ctx, 'reports:read')
}

export function canViewFinance(ctx: ExecutionContext): boolean {
  return hasPermission(ctx, 'finance:read')
}
