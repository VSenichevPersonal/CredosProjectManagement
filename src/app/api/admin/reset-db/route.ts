import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';

/**
 * API для полной очистки базы данных (кроме системных таблиц)
 * Доступно только для администраторов
 * ОПАСНАЯ ОПЕРАЦИЯ!
 * 
 * POST /api/admin/reset-db
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request);
    ctx.logger.warn('[Admin] Reset DB request - DANGEROUS OPERATION');

    // Проверка прав администратора
    if (!ctx.access.hasRole('admin')) {
      return NextResponse.json(
        { error: 'Доступ запрещён. Только для администраторов.' },
        { status: 403 }
      );
    }

    // Дополнительная проверка через body для подтверждения
    const body = await request.json();
    if (body.confirm !== 'УДАЛИТЬ ВСЕ ДАННЫЕ') {
      return NextResponse.json(
        { error: 'Требуется подтверждение операции. Отправьте { "confirm": "УДАЛИТЬ ВСЕ ДАННЫЕ" }' },
        { status: 400 }
      );
    }

    // Импортируем pg для прямого доступа к БД
    const { Client } = await import('pg');

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    ctx.logger.warn('[Admin] Connected to database for reset');

    try {
      // ОПАСНО: Удаляем все данные из таблиц
      // В правильном порядке с учётом foreign keys
      
      ctx.logger.warn('[Admin] Deleting time entries...');
      await client.query('DELETE FROM time_entries');
      
      ctx.logger.warn('[Admin] Deleting tasks...');
      await client.query('DELETE FROM tasks');
      
      ctx.logger.warn('[Admin] Deleting projects...');
      await client.query('DELETE FROM projects');
      
      ctx.logger.warn('[Admin] Deleting user roles...');
      await client.query('DELETE FROM user_roles WHERE TRUE');
      
      ctx.logger.warn('[Admin] Deleting employees...');
      await client.query('DELETE FROM employees');
      
      ctx.logger.warn('[Admin] Deleting directions...');
      await client.query('DELETE FROM directions');

      // Можно также очистить revenues и salary_register если нужно
      try {
        await client.query('DELETE FROM revenue_manual');
        await client.query('DELETE FROM salary_register');
      } catch (err) {
        // Таблицы могут не существовать
        ctx.logger.debug('[Admin] Finance tables not found or already empty');
      }

      // Сброс sequences (автоинкрементных счётчиков) - если используются
      // ctx.logger.warn('[Admin] Resetting sequences...');
      // await client.query('ALTER SEQUENCE IF EXISTS directions_id_seq RESTART WITH 1');
      // и т.д. для других таблиц если есть sequences

      await client.end();

      ctx.logger.warn('[Admin] Database reset successfully - ALL DATA DELETED');

      return NextResponse.json({
        success: true,
        message: 'База данных полностью очищена',
        warning: 'Все данные удалены! Для восстановления используйте seed.',
        deletedTables: [
          'time_entries',
          'tasks',
          'projects',
          'user_roles',
          'employees',
          'directions',
          'revenue_manual',
          'salary_register'
        ]
      });

    } catch (error: any) {
      ctx.logger.error('[Admin] Reset failed', { error: error.message });
      await client.end();
      throw error;
    }

  } catch (error: any) {
    console.error('[Admin] Reset DB error:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка при очистке БД', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

