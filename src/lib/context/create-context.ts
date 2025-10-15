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
import { validateRequest, pool } from '@/lib/auth/lucia'
import type { ExecutionContext } from './execution-context'
import type { Employee } from '@/types/domain'
import { AccessControlServiceImpl } from '@/lib/services/access-control-service'
import { LoggerServiceImpl } from '@/lib/services/logger-service'
import { getDatabaseProvider } from '@/providers/provider-factory'
import { type UserRole, type Permission, getPermissionsForRoles } from '@/lib/access-control/permissions'

export async function createExecutionContext(request: NextRequest): Promise<ExecutionContext> {
  // Get current user from Lucia auth
  const { user, session } = await validateRequest(request)
  
  if (!user || !session) {
    throw new Error('Unauthorized: User not authenticated')
  }
  
  // Get employee data from PostgreSQL
  const employeeResult = await pool.query(`
    SELECT 
      e.*,
      d.id as direction_id,
      d.name as direction_name,
      d.description as direction_description,
      d.budget as direction_budget,
      d.budget_threshold as direction_budget_threshold,
      d.color as direction_color,
      d.is_active as direction_is_active,
      d.created_at as direction_created_at,
      d.updated_at as direction_updated_at
    FROM employees e
    LEFT JOIN directions d ON e.direction_id = d.id
    WHERE e.id = $1
  `, [user.id])
  
  if (!employeeResult.rows[0]) {
    throw new Error('Employee not found')
  }
  
  const employee = employeeResult.rows[0]
  
  if (!employee.is_active) {
    throw new Error('Employee account is inactive')
  }
  
  // Get user roles from database
  const roles = await getUserRolesFromDb(employee.id)
  
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
async function getUserRolesFromDb(employeeId: string): Promise<UserRole[]> {
  const result = await pool.query(
    'SELECT role FROM user_roles WHERE employee_id = $1 AND is_active = true',
    [employeeId]
  )

  if (!result.rows || result.rows.length === 0) {
    // Если ролей нет в БД - базовая роль
    return ['employee'];
  }

  // Собираем уникальные роли
  const roles = new Set<UserRole>();
  result.rows.forEach((ur: any) => {
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
    direction: dbEmployee.direction_id ? {
      id: dbEmployee.direction_id,
      name: dbEmployee.direction_name,
      description: dbEmployee.direction_description,
      budget: parseFloat(dbEmployee.direction_budget || '0'),
      budgetThreshold: parseFloat(dbEmployee.direction_budget_threshold || '0'),
      color: dbEmployee.direction_color,
      isActive: dbEmployee.direction_is_active,
      createdAt: dbEmployee.direction_created_at,
      updatedAt: dbEmployee.direction_updated_at
    } : undefined,
    defaultHourlyRate: parseFloat(dbEmployee.default_hourly_rate || '0'),
    isActive: dbEmployee.is_active,
    createdAt: dbEmployee.created_at,
    updatedAt: dbEmployee.updated_at
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
