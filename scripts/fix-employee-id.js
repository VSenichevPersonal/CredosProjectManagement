#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function fixEmployeeId() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Подключено к PostgreSQL');

    // Найти несовпадающие ID
    const mismatchResult = await client.query(`
      SELECT 
        u.id as auth_id,
        u.email,
        e.id as employee_id
      FROM auth."user" u
      INNER JOIN employees e ON u.email = e.email
      WHERE u.id != e.id
    `);

    if (mismatchResult.rowCount === 0) {
      console.log('✅ Все ID совпадают!');
      return;
    }

    console.log(`\n⚠️  Найдено несовпадений: ${mismatchResult.rowCount}`);
    
    for (const row of mismatchResult.rows) {
      console.log(`\n📧 ${row.email}:`);
      console.log(`  auth.user ID:  ${row.auth_id}`);
      console.log(`  employee ID:   ${row.employee_id}`);
      console.log(`  🔧 Обновляем employee.id...`);

      // Сохраняем старый ID
      const oldEmployeeId = row.employee_id;
      const newEmployeeId = row.auth_id;

      // Обновляем все зависимые таблицы
      await client.query('BEGIN');

      try {
        // Временно отключаем FK constraints
        await client.query('SET CONSTRAINTS ALL DEFERRED');
        console.log(`  ⚙️  FK constraints отложены`);

        // 1. Обновляем user_roles
        await client.query(
          'UPDATE user_roles SET employee_id = $1 WHERE employee_id = $2',
          [newEmployeeId, oldEmployeeId]
        );
        console.log(`  ✓ Обновлено user_roles`);

        // 2. Обновляем projects (manager_id)
        await client.query(
          'UPDATE projects SET manager_id = $1 WHERE manager_id = $2',
          [newEmployeeId, oldEmployeeId]
        );
        console.log(`  ✓ Обновлено projects.manager_id`);

        // 3. Обновляем tasks (assignee_id)
        await client.query(
          'UPDATE tasks SET assignee_id = $1 WHERE assignee_id = $2',
          [newEmployeeId, oldEmployeeId]
        );
        console.log(`  ✓ Обновлено tasks.assignee_id`);

        // 4. Обновляем time_entries (employee_id)
        await client.query(
          'UPDATE time_entries SET employee_id = $1 WHERE employee_id = $2',
          [newEmployeeId, oldEmployeeId]
        );
        console.log(`  ✓ Обновлено time_entries.employee_id`);

        // 5. Обновляем salary_register (employee_id)
        await client.query(
          'UPDATE salary_register SET employee_id = $1 WHERE employee_id = $2',
          [newEmployeeId, oldEmployeeId]
        );
        console.log(`  ✓ Обновлено salary_register.employee_id`);

        // 6. Наконец обновляем сам employees.id
        await client.query(
          'UPDATE employees SET id = $1 WHERE id = $2',
          [newEmployeeId, oldEmployeeId]
        );
        console.log(`  ✓ Обновлено employees.id`);

        await client.query('COMMIT');
        console.log(`  ✅ ID успешно синхронизирован!`);

      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ❌ Ошибка: ${err.message}`);
        throw err;
      }
    }

    console.log('\n🎉 Все ID синхронизированы!');

  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixEmployeeId();

