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
      { name: 'Информационная безопасность', color: 'blue', budget: 10000000 },
      { name: 'Промышленная ИБ', color: 'cyan', budget: 8000000 },
      { name: 'Технический консалтинг', color: 'emerald', budget: 6000000 },
      { name: 'Аудит', color: 'orange', budget: 5000000 },
    ];

    const directionIds = [];
    for (const dir of directions) {
      const res = await client.query(
        `INSERT INTO directions (name, color, budget, budget_threshold, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [dir.name, dir.color, dir.budget, dir.budget * 1.1]
      );
      if (res.rows[0]) {
        directionIds.push(res.rows[0].id);
        console.log(`✓ Направление: ${dir.name}`);
      }
    }

    // 3. Создать сотрудников
    console.log('\n→ Создаём сотрудников...');
    const employees = [
      { email: 'admin@mail.ru', fullName: 'Администратор Системы', position: 'Системный администратор', directionId: directionIds[0], rate: 5000 },
      { email: 'ivanov@credos.ru', fullName: 'Иванов Иван Иванович', position: 'Руководитель направления ИБ', directionId: directionIds[0], rate: 4500 },
      { email: 'petrov@credos.ru', fullName: 'Петров Петр Петрович', position: 'Специалист по ИБ', directionId: directionIds[0], rate: 3000 },
      { email: 'sidorov@credos.ru', fullName: 'Сидоров Сергей Сергеевич', position: 'Инженер ПИБ', directionId: directionIds[1], rate: 3200 },
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

    // 4. Создать проекты
    console.log('\n→ Создаём проекты...');
    const projects = [
      { name: 'Внедрение СЭД', description: 'Система электронного документооборота', directionId: directionIds[0], managerId: employeeIds[1], budget: 500000, status: 'active' },
      { name: 'Аудит ИБ Банка', description: 'Комплексный аудит информационной безопасности', directionId: directionIds[3], managerId: employeeIds[1], budget: 300000, status: 'active' },
      { name: 'Настройка SIEM', description: 'Внедрение системы мониторинга событий безопасности', directionId: directionIds[1], managerId: employeeIds[3], budget: 400000, status: 'active' },
    ];

    for (const proj of projects) {
      await client.query(
        `INSERT INTO projects (name, description, direction_id, manager_id, total_budget, current_spent, status, start_date)
         VALUES ($1, $2, $3, $4, $5, 0, $6, CURRENT_DATE)
         ON CONFLICT DO NOTHING`,
        [proj.name, proj.description, proj.directionId, proj.managerId, proj.budget, proj.status]
      );
      console.log(`✓ Проект: ${proj.name}`);
    }

    // 5. Создать роль admin для суперадмина
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

    await client.query(
      `INSERT INTO user_roles (employee_id, role, is_active)
       VALUES ($1, 'admin', true)
       ON CONFLICT (employee_id, role) DO NOTHING`,
      [employeeIds[0]]
    );
    console.log('✓ Роль admin назначена суперадмину');

    console.log('\n✅ Seed данные успешно созданы!');
    console.log('\n📋 Данные для входа:');
    console.log('   Email: admin@mail.ru');
    console.log('   Пароль: admin@mail.ru');
    
  } catch (error) {
    console.error('❌ Ошибка seed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();

