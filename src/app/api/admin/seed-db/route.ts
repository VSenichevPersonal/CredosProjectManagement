import { NextRequest, NextResponse } from 'next/server';
import { createExecutionContext } from '@/lib/context/create-context';

/**
 * API для засева базы данных тестовыми данными
 * Доступно только для администраторов
 * 
 * POST /api/admin/seed-db
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await createExecutionContext(request);
    ctx.logger.info('[Admin] Seed DB request');

    // Проверка прав администратора
    if (!ctx.access.hasRole('admin')) {
      return NextResponse.json(
        { error: 'Доступ запрещён. Только для администраторов.' },
        { status: 403 }
      );
    }

    // Импортируем pg для прямого доступа к БД
    const { Client } = await import('pg');
    const bcrypt = await import('bcryptjs');

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    ctx.logger.info('[Admin] Connected to database for seeding');

    try {
      // 1. Создать направления
      ctx.logger.info('[Admin] Creating directions...');
      const directions = [
        { name: 'Информационная безопасность', code: 'IB', description: 'Комплексные решения по ИБ', color: '#3B82F6', budget: 15000000 },
        { name: 'Промышленная ИБ', code: 'PIB', description: 'ИБ для АСУ ТП', color: '#06B6D4', budget: 12000000 },
        { name: 'Технический консалтинг', code: 'CONS', description: 'Консультационные услуги', color: '#10B981', budget: 8000000 },
        { name: 'Аудит', code: 'AUDIT', description: 'Аудит и оценка защищённости', color: '#F59E0B', budget: 6000000 },
        { name: 'Разработка', code: 'DEV', description: 'Разработка специализированного ПО', color: '#8B5CF6', budget: 10000000 },
      ];

      const directionIds = [];
      for (const dir of directions) {
        const res = await client.query(
          `INSERT INTO directions (name, code, description, color, budget, budget_threshold, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, true)
           ON CONFLICT (code) DO UPDATE 
           SET name = $1, description = $3, color = $4, budget = $5
           RETURNING id`,
          [dir.name, dir.code, dir.description, dir.color, dir.budget, dir.budget * 1.1]
        );
        if (res.rows[0]) {
          directionIds.push(res.rows[0].id);
        }
      }
      ctx.logger.info(`[Admin] Created ${directionIds.length} directions`);

      // 2. Создать сотрудников
      ctx.logger.info('[Admin] Creating employees...');
      const employees = [
        { email: 'admin@credos.ru', fullName: 'Администратор Системы', position: 'Системный администратор', directionId: directionIds[0], rate: 5000 },
        { email: 'ivanov.ii@credos.ru', fullName: 'Иванов Иван Иванович', position: 'Руководитель направления ИБ', directionId: directionIds[0], rate: 4500 },
        { email: 'petrov.pp@credos.ru', fullName: 'Петров Пётр Петрович', position: 'Ведущий специалист по ИБ', directionId: directionIds[0], rate: 3500 },
        { email: 'sidorov.ss@credos.ru', fullName: 'Сидоров Сергей Сергеевич', position: 'Инженер ПИБ', directionId: directionIds[1], rate: 3200 },
        { email: 'kuznetsov.ak@credos.ru', fullName: 'Кузнецов Алексей Константинович', position: 'Специалист по аудиту', directionId: directionIds[3], rate: 3800 },
        { email: 'smirnova.ev@credos.ru', fullName: 'Смирнова Елена Викторовна', position: 'Консультант по ИБ', directionId: directionIds[2], rate: 3000 },
        { email: 'volkov.dm@credos.ru', fullName: 'Волков Дмитрий Михайлович', position: 'Разработчик', directionId: directionIds[4], rate: 3300 },
        { email: 'novikova.og@credos.ru', fullName: 'Новикова Ольга Геннадьевна', position: 'Младший специалист ПИБ', directionId: directionIds[1], rate: 2500 },
        { email: 'sokolov.va@credos.ru', fullName: 'Соколов Владимир Александрович', position: 'Пентестер', directionId: directionIds[0], rate: 4000 },
        { email: 'fedorova.ta@credos.ru', fullName: 'Фёдорова Татьяна Андреевна', position: 'Аудитор', directionId: directionIds[3], rate: 3200 },
      ];

      const employeeIds = [];
      for (const emp of employees) {
        const res = await client.query(
          `INSERT INTO employees (email, full_name, position, direction_id, default_hourly_rate, is_active)
           VALUES ($1, $2, $3, $4, $5, true)
           ON CONFLICT (email) DO UPDATE 
           SET full_name = $2, position = $3, direction_id = $4, default_hourly_rate = $5
           RETURNING id`,
          [emp.email, emp.fullName, emp.position, emp.directionId, emp.rate]
        );
        employeeIds.push(res.rows[0].id);
      }
      ctx.logger.info(`[Admin] Created ${employeeIds.length} employees`);

      // 3. Создать проекты
      ctx.logger.info('[Admin] Creating projects...');
      const projects = [
        { name: 'Внедрение СЭД', code: 'SED-2024', description: 'Система электронного документооборота для банка', directionId: directionIds[0], managerId: employeeIds[1], budget: 800000, status: 'active' },
        { name: 'Аудит ИБ Банка', code: 'AUDIT-BANK', description: 'Комплексный аудит информационной безопасности', directionId: directionIds[3], managerId: employeeIds[4], budget: 450000, status: 'active' },
        { name: 'Настройка SIEM', code: 'SIEM-2024', description: 'Внедрение и настройка системы мониторинга', directionId: directionIds[0], managerId: employeeIds[1], budget: 600000, status: 'active' },
        { name: 'Защита АСУ ТП', code: 'PIB-SCADA', description: 'Комплексная защита промышленной сети', directionId: directionIds[1], managerId: employeeIds[3], budget: 950000, status: 'active' },
        { name: 'Пентест веб-приложений', code: 'PENTEST-WEB', description: 'Тестирование на проникновение', directionId: directionIds[0], managerId: employeeIds[8], budget: 350000, status: 'active' },
      ];

      const projectIds = [];
      for (const proj of projects) {
        const res = await client.query(
          `INSERT INTO projects (name, code, description, direction_id, manager_id, total_budget, current_spent, status, start_date, priority)
           VALUES ($1, $2, $3, $4, $5, $6, 0, $7, CURRENT_DATE, 'medium')
           ON CONFLICT (code) DO UPDATE
           SET name = $1, description = $3, total_budget = $6, status = $7
           RETURNING id`,
          [proj.name, proj.code, proj.description, proj.directionId, proj.managerId, proj.budget, proj.status]
        );
        if (res.rows[0]) {
          projectIds.push(res.rows[0].id);
        }
      }
      ctx.logger.info(`[Admin] Created ${projectIds.length} projects`);

      // 4. Создать задачи
      ctx.logger.info('[Admin] Creating tasks...');
      const tasks = [
        { name: 'Анализ требований к СЭД', projectId: projectIds[0], assigneeId: employeeIds[2], status: 'completed', priority: 'high', estimatedHours: 24 },
        { name: 'Подготовка технического задания', projectId: projectIds[0], assigneeId: employeeIds[2], status: 'in_progress', priority: 'high', estimatedHours: 40 },
        { name: 'Настройка сервера', projectId: projectIds[0], assigneeId: employeeIds[1], status: 'todo', priority: 'medium', estimatedHours: 16 },
        { name: 'Сбор исходных данных', projectId: projectIds[1], assigneeId: employeeIds[4], status: 'completed', priority: 'high', estimatedHours: 8 },
        { name: 'Анализ политик безопасности', projectId: projectIds[1], assigneeId: employeeIds[4], status: 'in_progress', priority: 'high', estimatedHours: 32 },
        { name: 'Тестирование периметра', projectId: projectIds[1], assigneeId: employeeIds[8], status: 'in_progress', priority: 'critical', estimatedHours: 40 },
        { name: 'Проектирование архитектуры SIEM', projectId: projectIds[2], assigneeId: employeeIds[2], status: 'completed', priority: 'high', estimatedHours: 32 },
        { name: 'Установка коллекторов', projectId: projectIds[2], assigneeId: employeeIds[2], status: 'in_progress', priority: 'high', estimatedHours: 24 },
        { name: 'Обследование АСУ ТП', projectId: projectIds[3], assigneeId: employeeIds[3], status: 'completed', priority: 'critical', estimatedHours: 40 },
        { name: 'Моделирование угроз', projectId: projectIds[3], assigneeId: employeeIds[3], status: 'in_progress', priority: 'high', estimatedHours: 32 },
      ];

      let tasksCreated = 0;
      for (const task of tasks) {
        try {
          await client.query(
            `INSERT INTO tasks (name, description, project_id, assignee_id, status, priority, estimated_hours, due_date)
             VALUES ($1, '', $2, $3, $4, $5, $6, CURRENT_DATE + INTERVAL '14 days')
             ON CONFLICT DO NOTHING`,
            [task.name, task.projectId, task.assigneeId, task.status, task.priority, task.estimatedHours]
          );
          tasksCreated++;
        } catch (err) {
          // Skip if task already exists
        }
      }
      ctx.logger.info(`[Admin] Created ${tasksCreated} tasks`);

      // 5. Создать записи времени (август-октябрь 2025, ~3 месяца)
      ctx.logger.info('[Admin] Creating time entries for Aug-Oct 2025...');
      let entriesCount = 0;
      
      // Период: 1 августа - 15 октября 2025 (текущая дата)
      const startDate = new Date('2025-08-01');
      const endDate = new Date('2025-10-15');
      
      // Проходим по всем дням в периоде
      for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
        // Пропускаем выходные (0 = воскресенье, 6 = суббота)
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;
        
        // 7-9 сотрудников работают каждый день (реалистичнее для 3 месяцев)
        const workingEmployeesCount = Math.floor(Math.random() * 3) + 7; // 7-9
        const workingEmployees = employeeIds
          .sort(() => Math.random() - 0.5)
          .slice(0, workingEmployeesCount);

        for (const empId of workingEmployees) {
          // Каждый сотрудник работает в основном над 1-2 проектами
          const mainProject = projectIds[Math.floor(Math.random() * projectIds.length)];
          
          // 80% времени - основной проект, 20% - может быть другой
          const projId = Math.random() < 0.8 
            ? mainProject 
            : projectIds[Math.floor(Math.random() * projectIds.length)];
          
          // Реалистичное распределение часов: 6-9 часов в день
          const hours = Math.floor(Math.random() * 4) + 6; // 6-9 часов
          
          // Статус: большинство approved, некоторые submitted
          const status = Math.random() < 0.85 ? 'approved' : 'submitted';
          
          // Описание варьируется
          const descriptions = [
            'Разработка функционала',
            'Анализ требований',
            'Тестирование',
            'Документирование',
            'Code review',
            'Исправление багов',
            'Встречи с заказчиком',
            'Проектирование архитектуры',
            'Настройка окружения',
            'Работа по проекту'
          ];
          const description = descriptions[Math.floor(Math.random() * descriptions.length)];
          
          try {
            await client.query(
              `INSERT INTO time_entries (employee_id, project_id, date, hours, description, status)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (employee_id, project_id, date) DO UPDATE
               SET hours = EXCLUDED.hours, description = EXCLUDED.description, status = EXCLUDED.status`,
              [empId, projId, currentDate.toISOString().split('T')[0], hours, description, status]
            );
            entriesCount++;
          } catch (err) {
            // Skip if entry fails
            ctx.logger.debug('[Admin] Time entry skipped', { error: err });
          }
        }
      }
      ctx.logger.info(`[Admin] Created ${entriesCount} time entries (Aug-Oct 2025)`);

      await client.end();

      ctx.logger.info('[Admin] Database seeded successfully');

      return NextResponse.json({
        success: true,
        message: 'База данных успешно заполнена тестовыми данными',
        stats: {
          directions: directionIds.length,
          employees: employeeIds.length,
          projects: projectIds.length,
          tasks: tasksCreated,
          timeEntries: entriesCount
        }
      });

    } catch (error: any) {
      ctx.logger.error('[Admin] Seed failed', { error: error.message });
      await client.end();
      throw error;
    }

  } catch (error: any) {
    console.error('[Admin] Seed DB error:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка при заполнении БД', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

