import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';

// Отключаем статическую генерацию - эндпоинт требует runtime данные
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * Получить информацию о текущем пользователе
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request);

    // Возвращаем информацию о пользователе + employee + роли + права
    return NextResponse.json({
      user: {
        id: ctx.userId,
        email: ctx.user.email,
      },
      employee: {
        id: ctx.employeeId,
        fullName: ctx.user.fullName,
        position: ctx.user.position,
        email: ctx.user.email,
      },
      roles: ctx.access.getRoles(),
      permissions: ctx.access.getPermissions(),
    });
  } catch (error) {
    // Если пользователь не авторизован
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

