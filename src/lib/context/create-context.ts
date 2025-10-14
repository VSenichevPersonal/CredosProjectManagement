/**
 * CreateExecutionContext
 * 
 * Factory for creating ExecutionContext from Next.js requests.
 * Handles authentication, authorization, and user context setup.
 */

/**
 * @intent: Factory for creating ExecutionContext from Next.js request
 * @llm-note: Creates complete context with all dependencies
 * @architecture: Core pattern - all API routes start here
 */

import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { ExecutionContext, UserRole, Permission } from './execution-context'
import type { Employee } from '@/types/domain'
import { AccessControlServiceImpl } from '@/lib/services/access-control-service'
import { LoggerServiceImpl } from '@/lib/services/logger-service'
import { getDatabaseProvider } from '@/providers/provider-factory'

export async function createExecutionContext(request: NextRequest): Promise<ExecutionContext> {
  const supabase = createServerClient()
  
  // Get current user from Supabase auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized: User not authenticated')
  }
  
  // Get employee data
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select(`
      *,
      direction:directions(*),
      manager:employees!manager_id(*)
    `)
    .eq('id', user.id)
    .single()
  
  if (employeeError || !employee) {
    throw new Error('Employee not found')
  }
  
  if (!employee.is_active) {
    throw new Error('Employee account is inactive')
  }
  
  // Determine user roles based on position and permissions
  const roles = determineUserRoles(employee)
  
  // Get permissions for roles
  const permissions = getPermissionsForRoles(roles)
  
  // Generate request ID for tracking
  const requestId = generateRequestId()
  
  // Create services
  const logger = new LoggerServiceImpl(`[${employee.email}]`)
  const access = new AccessControlServiceImpl(roles, permissions)
  const db = await getDatabaseProvider()

  return {
    user: mapEmployeeFromDb(employee),
    userId: user.id,
    employeeId: employee.id,
    db,
    logger,
    access,
    requestId,
    timestamp: new Date(),
    request
  }
}

function determineUserRoles(employee: any): UserRole[] {
  const roles: UserRole[] = ['employee'] // Everyone has base employee role
  
  // Role determination based on position and other factors
  const position = employee.position?.toLowerCase() || ''
  
  if (position.includes('директор') || position.includes('руководитель')) {
    roles.push('admin')
  } else if (position.includes('менеджер проектов')) {
    roles.push('project_manager')
  } else if (position.includes('тимлид') || position.includes('лидер команды')) {
    roles.push('team_lead')
  } else if (position.includes('hr') || position.includes('кадры')) {
    roles.push('hr')
  } else if (position.includes('финанс') || position.includes('бухгалтер')) {
    roles.push('finance')
  }
  
  // If has subordinates, add manager role
  if (employee.manager_id === null && roles.length === 1) {
    roles.push('manager')
  }
  
  return roles
}

function getPermissionsForRoles(roles: UserRole[]): Permission[] {
  const permissions = new Set<Permission>()
  
  for (const role of roles) {
    const rolePermissions = ROLE_PERMISSIONS[role] || []
    rolePermissions.forEach(permission => permissions.add(permission))
  }
  
  return Array.from(permissions)
}

function mapEmployeeFromDb(dbEmployee: any): Employee {
  return {
    id: dbEmployee.id,
    email: dbEmployee.email,
    fullName: dbEmployee.full_name,
    position: dbEmployee.position,
    directionId: dbEmployee.direction_id,
    direction: dbEmployee.direction ? {
      id: dbEmployee.direction.id,
      name: dbEmployee.direction.name,
      description: dbEmployee.direction.description,
      color: dbEmployee.direction.color,
      isActive: dbEmployee.direction.is_active,
      createdAt: dbEmployee.direction.created_at,
      updatedAt: dbEmployee.direction.updated_at
    } : undefined,
    managerId: dbEmployee.manager_id,
    manager: dbEmployee.manager ? {
      id: dbEmployee.manager.id,
      email: dbEmployee.manager.email,
      fullName: dbEmployee.manager.full_name,
      position: dbEmployee.manager.position,
      directionId: dbEmployee.manager.direction_id,
      hourlyRate: dbEmployee.manager.hourly_rate,
      isActive: dbEmployee.manager.is_active,
      createdAt: dbEmployee.manager.created_at,
      updatedAt: dbEmployee.manager.updated_at
    } : undefined,
    hourlyRate: dbEmployee.hourly_rate,
    isActive: dbEmployee.is_active,
    createdAt: dbEmployee.created_at,
    updatedAt: dbEmployee.updated_at
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Import ROLE_PERMISSIONS from execution-context
import { ROLE_PERMISSIONS } from './execution-context'
