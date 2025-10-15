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
        e.*
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
      console.log(`  employee ID:   ${row.id}`);

      const oldEmployeeId = row.id;
      const newEmployeeId = row.auth_id;

      await client.query('BEGIN');

      try {
        // 1. Создаём новый employee с правильным ID
        console.log(`  🔧 Создаём новый employee с ID ${newEmployeeId}...`);
        await client.query(`
          INSERT INTO employees (
            id, email, full_name, position, direction_id, 
            default_hourly_rate, is_active, created_at, updated_at
          )
          VALUES ($1, $2 || '.new', $3, $4, $5, $6, $7, $8, $9)
        `, [
          newEmployeeId,
          row.email, // временно добавим .new чтобы не было конфликта по email
          row.full_name,
          row.position,
          row.direction_id,
          row.default_hourly_rate,
          row.is_active,
          row.created_at,
          row.updated_at
        ]);
        console.log(`  ✓ Создан новый employee`);

        // 2. Обновляем все зависимые таблицы
        await client.query(
          'UPDATE user_roles SET employee_id = $1 WHERE employee_id = $2',
          [newEmployeeId, oldEmployeeId]
        );
        console.log(`  ✓ Обновлено user_roles`);

        await client.query(
          'UPDATE projects SET manager_id = $1 WHERE manager_id = $2',
          [newEmployeeId, oldEmployeeId]
        );
        console.log(`  ✓ Обновлено projects.manager_id`);

        await client.query(
          'UPDATE tasks SET assignee_id = $1 WHERE assignee_id = $2',
          [newEmployeeId, oldEmployeeId]
        );
        console.log(`  ✓ Обновлено tasks.assignee_id`);

        await client.query(
          'UPDATE time_entries SET employee_id = $1 WHERE employee_id = $2',
          [newEmployeeId, oldEmployeeId]
        );
        console.log(`  ✓ Обновлено time_entries.employee_id`);

        // Проверяем существование salary_register
        const salaryTableCheck = await client.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'salary_register')`
        );
        if (salaryTableCheck.rows[0].exists) {
          await client.query(
            'UPDATE salary_register SET employee_id = $1 WHERE employee_id = $2',
            [newEmployeeId, oldEmployeeId]
          );
          console.log(`  ✓ Обновлено salary_register.employee_id`);
        }

        // 3. Удаляем старый employee
        await client.query('DELETE FROM employees WHERE id = $1', [oldEmployeeId]);
        console.log(`  ✓ Удалён старый employee`);

        // 4. Исправляем email нового employee (убираем .new)
        await client.query(
          'UPDATE employees SET email = $1 WHERE id = $2',
          [row.email, newEmployeeId]
        );
        console.log(`  ✓ Исправлен email нового employee`);

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

