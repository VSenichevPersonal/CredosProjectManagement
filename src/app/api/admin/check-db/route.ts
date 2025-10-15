import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';

// Отключаем статическую генерацию
export const dynamic = 'force-dynamic';

/**
 * API для проверки целостности базы данных
 * Доступно только для администраторов
 * 
 * GET /api/admin/check-db
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request);
    ctx.logger.info('[Admin] Check DB integrity request');

    // Проверка прав администратора
    if (!ctx.access.hasRole('admin')) {
      return NextResponse.json(
        { error: 'Доступ запрещён. Только для администраторов.' },
        { status: 403 }
      );
    }

    // Импортируем pg для прямого доступа к БД
    const { Client } = await import('pg');

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    ctx.logger.info('[Admin] Connected to database for integrity check');

    try {
      const report = {
        tables: {} as Record<string, { exists: boolean; count: number }>,
        orphans: [] as any[],
        warnings: [] as string[],
        errors: [] as string[],
        summary: {
          totalRecords: 0,
          tablesChecked: 0,
          activeEmployees: 0,
          activeDirections: 0,
          activeProjects: 0,
          recentTimeEntries: 0
        }
      };

      // 1. Проверка существования таблиц
      ctx.logger.info('[Admin] Checking tables...');
      const requiredTables = [
        'directions',
        'employees',
        'projects',
        'tasks',
        'time_entries',
        'user_roles'
      ];

      for (const table of requiredTables) {
        const result = await client.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
          [table]
        );
        
        if (result.rows[0].exists) {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
          const count = parseInt(countResult.rows[0].count);
          report.tables[table] = {
            exists: true,
            count
          };
          report.summary.totalRecords += count;
        } else {
          report.tables[table] = { exists: false, count: 0 };
          report.errors.push(`Таблица ${table} не существует`);
        }
      }
      report.summary.tablesChecked = requiredTables.length;

      // 2. Проверка orphaned records
      ctx.logger.info('[Admin] Checking orphaned records...');
      
      // Orphaned employees
      const orphanedEmployees = await client.query(`
        SELECT COUNT(*) as count
        FROM employees e
        LEFT JOIN directions d ON d.id = e.direction_id
        WHERE e.direction_id IS NOT NULL AND d.id IS NULL
      `);
      
      if (parseInt(orphanedEmployees.rows[0].count) > 0) {
        report.orphans.push({
          table: 'employees',
          field: 'direction_id',
          count: parseInt(orphanedEmployees.rows[0].count)
        });
      }

      // Orphaned projects
      const orphanedProjects = await client.query(`
        SELECT COUNT(*) as count
        FROM projects p
        LEFT JOIN directions d ON d.id = p.direction_id
        WHERE p.direction_id IS NOT NULL AND d.id IS NULL
      `);
      
      if (parseInt(orphanedProjects.rows[0].count) > 0) {
        report.orphans.push({
          table: 'projects',
          field: 'direction_id',
          count: parseInt(orphanedProjects.rows[0].count)
        });
      }

      // Orphaned tasks
      const orphanedTasks = await client.query(`
        SELECT COUNT(*) as count
        FROM tasks t
        LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.project_id IS NOT NULL AND p.id IS NULL
      `);
      
      if (parseInt(orphanedTasks.rows[0].count) > 0) {
        report.orphans.push({
          table: 'tasks',
          field: 'project_id',
          count: parseInt(orphanedTasks.rows[0].count)
        });
      }

      // Orphaned time_entries
      const orphanedTimeEntries = await client.query(`
        SELECT COUNT(*) as count
        FROM time_entries te
        LEFT JOIN employees e ON e.id = te.employee_id
        LEFT JOIN projects p ON p.id = te.project_id
        WHERE (te.employee_id IS NOT NULL AND e.id IS NULL)
           OR (te.project_id IS NOT NULL AND p.id IS NULL)
      `);
      
      if (parseInt(orphanedTimeEntries.rows[0].count) > 0) {
        report.orphans.push({
          table: 'time_entries',
          field: 'employee_id/project_id',
          count: parseInt(orphanedTimeEntries.rows[0].count)
        });
      }

      // 3. Бизнес-логика
      ctx.logger.info('[Admin] Checking business logic...');
      
      const activeEmployees = await client.query('SELECT COUNT(*) FROM employees WHERE is_active = true');
      report.summary.activeEmployees = parseInt(activeEmployees.rows[0].count);
      if (report.summary.activeEmployees === 0) {
        report.warnings.push('Нет активных сотрудников');
      }

      const activeDirections = await client.query('SELECT COUNT(*) FROM directions WHERE is_active = true');
      report.summary.activeDirections = parseInt(activeDirections.rows[0].count);
      if (report.summary.activeDirections === 0) {
        report.warnings.push('Нет активных направлений');
      }

      const activeProjects = await client.query("SELECT COUNT(*) FROM projects WHERE status = 'active'");
      report.summary.activeProjects = parseInt(activeProjects.rows[0].count);

      const recentTimeEntries = await client.query(`
        SELECT COUNT(*) FROM time_entries 
        WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      `);
      report.summary.recentTimeEntries = parseInt(recentTimeEntries.rows[0].count);
      if (report.summary.recentTimeEntries === 0) {
        report.warnings.push('Нет записей времени за последние 30 дней');
      }

      await client.end();

      ctx.logger.info('[Admin] DB integrity check completed', { 
        errors: report.errors.length,
        orphans: report.orphans.length,
        warnings: report.warnings.length
      });

      // Определяем статус
      let status: 'excellent' | 'good' | 'warning' | 'critical';
      if (report.errors.length > 0) {
        status = 'critical';
      } else if (report.orphans.length > 0) {
        status = 'warning';
      } else if (report.warnings.length > 0) {
        status = 'good';
      } else {
        status = 'excellent';
      }

      return NextResponse.json({
        success: true,
        status,
        message: status === 'excellent' 
          ? 'База данных в отличном состоянии!' 
          : status === 'good'
          ? 'База данных в хорошем состоянии'
          : status === 'warning'
          ? 'Обнаружены минорные проблемы'
          : 'Обнаружены критические проблемы!',
        report
      });

    } catch (error: any) {
      ctx.logger.error('[Admin] Integrity check failed', { error: error.message });
      await client.end();
      throw error;
    }

  } catch (error: any) {
    console.error('[Admin] Check DB error:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка при проверке БД', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

