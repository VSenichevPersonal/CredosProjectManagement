require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Подключено к PostgreSQL');

    // 1. Создать суперадмина в auth.user
    console.log('\n→ Создаём суперадмина admin@mail.ru...');
    const hashedPassword = bcrypt.hashSync('admin@mail.ru', 10);
    
    const userResult = await client.query(
      `INSERT INTO auth."user" (email, encrypted_password) 
       VALUES ($1, $2) 
       ON CONFLICT (email) DO UPDATE SET encrypted_password = $2
       RETURNING id`,
      ['admin@mail.ru', hashedPassword]
    );
    const adminUserId = userResult.rows[0].id;
    console.log(`✓ Суперадмин создан: ${adminUserId}`);

    // 2. Создать направления
    console.log('\n→ Создаём направления...');
    const directions = [
      { name: 'Информационная безопасность', code: 'IB', description: 'Комплексные решения по ИБ', color: 'blue', budget: 15000000 },
      { name: 'Промышленная ИБ', code: 'PIB', description: 'ИБ для АСУ ТП', color: 'cyan', budget: 12000000 },
      { name: 'Технический консалтинг', code: 'CONS', description: 'Консультационные услуги', color: 'emerald', budget: 8000000 },
      { name: 'Аудит', code: 'AUDIT', description: 'Аудит и оценка защищённости', color: 'orange', budget: 6000000 },
      { name: 'Разработка', code: 'DEV', description: 'Разработка специализированного ПО', color: 'purple', budget: 10000000 },
    ];

    const directionIds = [];
    for (const dir of directions) {
      const res = await client.query(
        `INSERT INTO directions (name, code, description, color, budget, budget_threshold, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [dir.name, dir.code, dir.description, dir.color, dir.budget, dir.budget * 1.1]
      );
      if (res.rows[0]) {
        directionIds.push(res.rows[0].id);
        console.log(`✓ Направление: ${dir.name}`);
      }
    }

    // 3. Создать сотрудников (15 человек для pilot)
    console.log('\n→ Создаём сотрудников...');
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
      { email: 'morozov.ip@credos.ru', fullName: 'Морозов Игорь Павлович', position: 'DevOps инженер', directionId: directionIds[4], rate: 3500 },
      { email: 'popova.mn@credos.ru', fullName: 'Попова Марина Николаевна', position: 'Консультант', directionId: directionIds[2], rate: 2800 },
      { email: 'lebedev.as@credos.ru', fullName: 'Лебедев Антон Сергеевич', position: 'Специалист по SIEM', directionId: directionIds[0], rate: 3600 },
      { email: 'kozlova.ei@credos.ru', fullName: 'Козлова Екатерина Игоревна', position: 'Тестировщик', directionId: directionIds[4], rate: 2700 },
      { email: 'vasiliev.nd@credos.ru', fullName: 'Васильев Николай Дмитриевич', position: 'Инженер ИБ', directionId: directionIds[0], rate: 3100 },
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
      console.log(`✓ Сотрудник: ${emp.fullName}`);
    }

    // 4. Создать проекты (8 проектов)
    console.log('\n→ Создаём проекты...');
    const projects = [
      { name: 'Внедрение СЭД', code: 'SED-2024', description: 'Система электронного документооборота для банка', directionId: directionIds[0], managerId: employeeIds[1], budget: 800000, status: 'active' },
      { name: 'Аудит ИБ Банка', code: 'AUDIT-BANK', description: 'Комплексный аудит информационной безопасности', directionId: directionIds[3], managerId: employeeIds[4], budget: 450000, status: 'active' },
      { name: 'Настройка SIEM', code: 'SIEM-2024', description: 'Внедрение и настройка системы мониторинга', directionId: directionIds[0], managerId: employeeIds[1], budget: 600000, status: 'active' },
      { name: 'Защита АСУ ТП', code: 'PIB-SCADA', description: 'Комплексная защита промышленной сети', directionId: directionIds[1], managerId: employeeIds[3], budget: 950000, status: 'active' },
      { name: 'Пентест веб-приложений', code: 'PENTEST-WEB', description: 'Тестирование на проникновение 10 приложений', directionId: directionIds[0], managerId: employeeIds[8], budget: 350000, status: 'in_progress' },
      { name: 'Разработка DLP системы', code: 'DEV-DLP', description: 'Собственная система предотвращения утечек', directionId: directionIds[4], managerId: employeeIds[6], budget: 1200000, status: 'planning' },
      { name: 'Консалтинг по 187-ФЗ', code: 'CONS-187', description: 'Консультации по защите КИИ', directionId: directionIds[2], managerId: employeeIds[5], budget: 280000, status: 'active' },
      { name: 'Внедрение IAM', code: 'IAM-2024', description: 'Система управления идентификацией', directionId: directionIds[0], managerId: employeeIds[1], budget: 700000, status: 'planning' },
    ];

    const projectIds = [];
    for (const proj of projects) {
      const res = await client.query(
        `INSERT INTO projects (name, code, description, direction_id, manager_id, total_budget, current_spent, status, start_date)
         VALUES ($1, $2, $3, $4, $5, $6, 0, $7, CURRENT_DATE)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [proj.name, proj.code, proj.description, proj.directionId, proj.managerId, proj.budget, proj.status]
      );
      if (res.rows[0]) {
        projectIds.push(res.rows[0].id);
        console.log(`✓ Проект: ${proj.name}`);
      }
    }

    // 5. Создать задачи (30 задач)
    console.log('\n→ Создаём задачи...');
    const tasks = [
      // Проект 1: СЭД
      { title: 'Анализ требований к СЭД', projectId: projectIds[0], assigneeId: employeeIds[2], status: 'completed', priority: 'high', estimatedHours: 24 },
      { title: 'Подготовка технического задания', projectId: projectIds[0], assigneeId: employeeIds[2], status: 'completed', priority: 'high', estimatedHours: 40 },
      { title: 'Настройка сервера', projectId: projectIds[0], assigneeId: employeeIds[14], status: 'in_progress', priority: 'high', estimatedHours: 16 },
      { title: 'Интеграция с AD', projectId: projectIds[0], assigneeId: employeeIds[10], status: 'pending', priority: 'medium', estimatedHours: 20 },
      
      // Проект 2: Аудит
      { title: 'Сбор исходных данных', projectId: projectIds[1], assigneeId: employeeIds[4], status: 'completed', priority: 'high', estimatedHours: 8 },
      { title: 'Анализ политик безопасности', projectId: projectIds[1], assigneeId: employeeIds[9], status: 'in_progress', priority: 'high', estimatedHours: 32 },
      { title: 'Тестирование периметра', projectId: projectIds[1], assigneeId: employeeIds[8], status: 'in_progress', priority: 'critical', estimatedHours: 40 },
      { title: 'Подготовка отчёта', projectId: projectIds[1], assigneeId: employeeIds[4], status: 'pending', priority: 'high', estimatedHours: 24 },
      
      // Проект 3: SIEM
      { title: 'Проектирование архитектуры', projectId: projectIds[2], assigneeId: employeeIds[12], status: 'completed', priority: 'high', estimatedHours: 32 },
      { title: 'Установка коллекторов', projectId: projectIds[2], assigneeId: employeeIds[12], status: 'in_progress', priority: 'high', estimatedHours: 24 },
      { title: 'Настройка корреляций', projectId: projectIds[2], assigneeId: employeeIds[12], status: 'in_progress', priority: 'critical', estimatedHours: 48 },
      { title: 'Создание дашбордов', projectId: projectIds[2], assigneeId: employeeIds[2], status: 'pending', priority: 'medium', estimatedHours: 16 },
      { title: 'Обучение персонала', projectId: projectIds[2], assigneeId: employeeIds[1], status: 'pending', priority: 'low', estimatedHours: 8 },
      
      // Проект 4: ПИБ
      { title: 'Обследование АСУ ТП', projectId: projectIds[3], assigneeId: employeeIds[3], status: 'completed', priority: 'critical', estimatedHours: 40 },
      { title: 'Моделирование угроз', projectId: projectIds[3], assigneeId: employeeIds[7], status: 'in_progress', priority: 'high', estimatedHours: 32 },
      { title: 'Настройка межсетевых экранов', projectId: projectIds[3], assigneeId: employeeIds[3], status: 'in_progress', priority: 'high', estimatedHours: 24 },
      { title: 'Внедрение IDS/IPS', projectId: projectIds[3], assigneeId: employeeIds[7], status: 'pending', priority: 'high', estimatedHours: 32 },
      { title: 'Аттестация системы', projectId: projectIds[3], assigneeId: employeeIds[3], status: 'pending', priority: 'medium', estimatedHours: 16 },
      
      // Проект 5: Пентест
      { title: 'Разведка и сканирование', projectId: projectIds[4], assigneeId: employeeIds[8], status: 'completed', priority: 'high', estimatedHours: 16 },
      { title: 'Поиск уязвимостей', projectId: projectIds[4], assigneeId: employeeIds[8], status: 'in_progress', priority: 'critical', estimatedHours: 40 },
      { title: 'Эксплуатация уязвимостей', projectId: projectIds[4], assigneeId: employeeIds[8], status: 'pending', priority: 'high', estimatedHours: 32 },
      { title: 'Написание отчёта', projectId: projectIds[4], assigneeId: employeeIds[8], status: 'pending', priority: 'medium', estimatedHours: 16 },
      
      // Проект 6: DLP
      { title: 'Проектирование архитектуры', projectId: projectIds[5], assigneeId: employeeIds[6], status: 'in_progress', priority: 'high', estimatedHours: 32 },
      { title: 'Разработка модуля перехвата', projectId: projectIds[5], assigneeId: employeeIds[6], status: 'pending', priority: 'critical', estimatedHours: 80 },
      { title: 'Разработка модуля анализа', projectId: projectIds[5], assigneeId: employeeIds[10], status: 'pending', priority: 'high', estimatedHours: 80 },
      { title: 'Тестирование', projectId: projectIds[5], assigneeId: employeeIds[13], status: 'pending', priority: 'medium', estimatedHours: 40 },
      
      // Проект 7: Консалтинг
      { title: 'Анализ инфраструктуры заказчика', projectId: projectIds[6], assigneeId: employeeIds[5], status: 'completed', priority: 'high', estimatedHours: 16 },
      { title: 'Подготовка рекомендаций', projectId: projectIds[6], assigneeId: employeeIds[11], status: 'in_progress', priority: 'high', estimatedHours: 24 },
      { title: 'Презентация для руководства', projectId: projectIds[6], assigneeId: employeeIds[5], status: 'pending', priority: 'medium', estimatedHours: 8 },
      
      // Проект 8: IAM
      { title: 'Анализ текущих систем', projectId: projectIds[7], assigneeId: employeeIds[14], status: 'in_progress', priority: 'high', estimatedHours: 24 },
    ];

    const taskIds = [];
    for (const task of tasks) {
      const res = await client.query(
        `INSERT INTO tasks (title, description, project_id, assignee_id, status, priority, estimated_hours, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE + INTERVAL '14 days')
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [task.title, '', task.projectId, task.assigneeId, task.status, task.priority, task.estimatedHours]
      );
      if (res.rows[0]) {
        taskIds.push(res.rows[0].id);
        console.log(`✓ Задача: ${task.title}`);
      }
    }

    // 6. Создать time entries (последние 2 недели, ~100 записей)
    console.log('\n→ Создаём записи времени...');
    let entriesCount = 0;
    for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
      // Пропускаем выходные
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Случайно выбираем 5-8 сотрудников которые работали в этот день
      const workingEmployees = employeeIds
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 4) + 5);

      for (const empId of workingEmployees) {
        // Случайный проект
        const projId = projectIds[Math.floor(Math.random() * projectIds.length)];
        // 6-9 часов работы
        const hours = Math.floor(Math.random() * 4) + 6;
        
        await client.query(
          `INSERT INTO time_entries (employee_id, project_id, date, hours, description)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [empId, projId, date.toISOString().split('T')[0], hours, 'Работа по проекту']
        );
        entriesCount++;
      }
    }
    console.log(`✓ Создано ${entriesCount} записей времени`);

    // 7. Создать роли
    console.log('\n→ Создаём роли...');
    await client.query(
      `CREATE TABLE IF NOT EXISTS user_roles (
        id uuid primary key default gen_random_uuid(),
        employee_id uuid references employees(id) on delete cascade,
        role varchar(50) not null,
        granted_by uuid references employees(id),
        granted_at timestamptz default now(),
        is_active boolean default true,
        unique(employee_id, role)
      )`
    );

    // Админ
    await client.query(
      `INSERT INTO user_roles (employee_id, role, is_active)
       VALUES ($1, 'admin', true)
       ON CONFLICT (employee_id, role) DO NOTHING`,
      [employeeIds[0]]
    );
    // Менеджеры
    for (let i = 1; i <= 3; i++) {
      await client.query(
        `INSERT INTO user_roles (employee_id, role, is_active)
         VALUES ($1, 'manager', true)
         ON CONFLICT (employee_id, role) DO NOTHING`,
        [employeeIds[i]]
      );
    }
    console.log('✓ Роли назначены');

    console.log('\n✅ Seed данные для pilot успешно созданы!');
    console.log('\n📊 Статистика:');
    console.log(`   Направлений: 5`);
    console.log(`   Сотрудников: 15`);
    console.log(`   Проектов: 8`);
    console.log(`   Задач: 30`);
    console.log(`   Записей времени: ${entriesCount}`);
    console.log('\n📋 Данные для входа:');
    console.log('   Email: admin@credos.ru');
    console.log('   Пароль: admin@credos.ru');
    
  } catch (error) {
    console.error('❌ Ошибка seed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
