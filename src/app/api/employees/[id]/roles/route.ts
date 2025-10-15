import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { pool } from '@/lib/auth/lucia';
import type { UserRole } from '@/lib/access-control/permissions';
import { z } from 'zod';

const assignRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'employee', 'viewer']),
});

// Отключаем статическую генерацию
export const dynamic = 'force-dynamic';

/**
 * GET /api/employees/[id]/roles
 * Получить роли сотрудника
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('user_roles:read');
    ctx.logger.info(`GET /api/employees/${params.id}/roles`);
    
    const result = await pool.query(
      `SELECT id, role, granted_by, granted_at, is_active
       FROM user_roles
       WHERE employee_id = $1
       ORDER BY granted_at DESC`,
      [params.id]
    );
    
    return NextResponse.json({
      employeeId: params.id,
      roles: result.rows
    });
  } catch (error: any) {
    ctx.logger.error('Failed to fetch employee roles', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to fetch employee roles', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/employees/[id]/roles
 * Назначить роль сотруднику
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('user_roles:manage');
    
    const body = await request.json();
    ctx.logger.info(`POST /api/employees/${params.id}/roles`, body);
    
    const { role } = assignRoleSchema.parse(body);
    
    // Проверяем что сотрудник существует
    const employeeCheck = await pool.query(
      'SELECT id FROM employees WHERE id = $1',
      [params.id]
    );
    
    if (employeeCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Вставляем роль (ON CONFLICT - обновляем is_active = true если роль уже была)
    const result = await pool.query(
      `INSERT INTO user_roles (employee_id, role, granted_by, granted_at, is_active)
       VALUES ($1, $2, $3, NOW(), true)
       ON CONFLICT (employee_id, role)
       DO UPDATE SET is_active = true, granted_by = $3, granted_at = NOW()
       RETURNING *`,
      [params.id, role, ctx.employeeId]
    );
    
    ctx.logger.info('Role assigned', { 
      employeeId: params.id, 
      role,
      grantedBy: ctx.employeeId
    });
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      ctx.logger.warn('Validation error', error.errors);
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    ctx.logger.error('Failed to assign role', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to assign role', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/employees/[id]/roles/[role]
 * Отозвать роль у сотрудника (устанавливает is_active = false)
 * 
 * Примечание: роль передаётся через query параметр ?role=admin
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('user_roles:manage');
    
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role parameter is required' },
        { status: 400 }
      );
    }
    
    ctx.logger.info(`DELETE /api/employees/${params.id}/roles`, { role });
    
    // Проверяем что не пытаются забрать роль admin у самого себя
    if (ctx.employeeId === params.id && role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot revoke admin role from yourself' },
        { status: 400 }
      );
    }
    
    // Устанавливаем is_active = false (soft delete)
    const result = await pool.query(
      `UPDATE user_roles
       SET is_active = false
       WHERE employee_id = $1 AND role = $2
       RETURNING *`,
      [params.id, role]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Role not found for this employee' },
        { status: 404 }
      );
    }
    
    ctx.logger.info('Role revoked', { 
      employeeId: params.id, 
      role,
      revokedBy: ctx.employeeId
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    ctx.logger.error('Failed to revoke role', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to revoke role', details: error.message },
      { status: 500 }
    );
  }
}

