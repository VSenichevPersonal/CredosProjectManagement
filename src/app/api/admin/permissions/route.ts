import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';
import { ROLES, ROLE_PERMISSIONS, type UserRole } from '@/lib/access-control/permissions';

// Отключаем статическую генерацию
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/permissions
 * Получить матрицу прав (какие роли имеют какие права)
 */
export async function GET(request: NextRequest) {
  const ctx = await createExecutionContext(request);
  
  try {
    await ctx.access.require('user_roles:read');
    ctx.logger.info('GET /api/admin/permissions - Fetching permissions matrix');
    
    // Формируем матрицу: роль -> права
    const matrix: Record<UserRole, {
      info: typeof ROLES[UserRole],
      permissions: string[]
    }> = {} as any;
    
    for (const role of Object.keys(ROLES) as UserRole[]) {
      matrix[role] = {
        info: ROLES[role],
        permissions: ROLE_PERMISSIONS[role] || []
      };
    }
    
    // Получаем все уникальные права
    const allPermissions = Array.from(
      new Set(
        Object.values(ROLE_PERMISSIONS).flat()
      )
    ).sort();
    
    return NextResponse.json({
      roles: ROLES,
      matrix,
      allPermissions
    });
  } catch (error: any) {
    ctx.logger.error('Failed to fetch permissions matrix', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to fetch permissions matrix', details: error.message },
      { status: 500 }
    );
  }
}

