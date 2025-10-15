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
import type { ExecutionContext } from './execution-context'
import type { Employee } from '@/types/domain'
import { AccessControlServiceImpl } from '@/lib/services/access-control-service'
import { LoggerServiceImpl } from '@/lib/services/logger-service'
import { getDatabaseProvider } from '@/providers/provider-factory'
import { type UserRole, type Permission, getPermissionsForRoles } from '@/lib/access-control/permissions'

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
  
  // Get user roles from database
  const roles = await getUserRolesFromDb(supabase, employee.id)
  
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

/**
 * Получить роли пользователя из БД (user_roles table)
 */
async function getUserRolesFromDb(supabase: any, employeeId: string): Promise<UserRole[]> {
  const { data: userRoles, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('employee_id', employeeId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching user roles:', error);
    // Если ошибка - возвращаем базовую роль
    return ['employee'];
  }

  if (!userRoles || userRoles.length === 0) {
    // Если ролей нет в БД - базовая роль
    return ['employee'];
  }

  // Собираем уникальные роли
  const roles = new Set<UserRole>();
  userRoles.forEach((ur: any) => {
    if (ur.role === 'admin' || ur.role === 'manager' || ur.role === 'employee' || ur.role === 'viewer') {
      roles.add(ur.role as UserRole);
    }
  });

  // Если нет ни одной валидной роли - даём базовую
  if (roles.size === 0) {
    return ['employee'];
  }

  return Array.from(roles);
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
      budget: dbEmployee.direction.budget,
      budgetThreshold: dbEmployee.direction.budget_threshold,
      color: dbEmployee.direction.color,
      isActive: dbEmployee.direction.is_active,
      createdAt: dbEmployee.direction.created_at,
      updatedAt: dbEmployee.direction.updated_at
    } : undefined,
    defaultHourlyRate: dbEmployee.hourly_rate,
    isActive: dbEmployee.is_active,
    createdAt: dbEmployee.created_at,
    updatedAt: dbEmployee.updated_at
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
