#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function syncAuthEmployees() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Подключено к PostgreSQL');

    // Проверяем auth.user
    const usersResult = await client.query('SELECT id, email, created_at FROM auth."user"');
    console.log(`\n📧 Пользователи в auth.user: ${usersResult.rowCount}`);
    usersResult.rows.forEach(u => {
      console.log(`  - ${u.email} (${u.id})`);
    });

    // Проверяем employees
    const employeesResult = await client.query('SELECT id, email, full_name, is_active FROM employees');
    console.log(`\n👥 Сотрудники в employees: ${employeesResult.rowCount}`);
    employeesResult.rows.forEach(e => {
      console.log(`  - ${e.email} (${e.full_name}) - ${e.is_active ? 'active' : 'inactive'}`);
    });

    // Находим пользователей без employee
    const orphanedUsers = await client.query(`
      SELECT u.id, u.email 
      FROM auth."user" u 
      LEFT JOIN employees e ON u.id = e.id 
      WHERE e.id IS NULL
    `);

    if (orphanedUsers.rowCount > 0) {
      console.log(`\n⚠️  Найдено пользователей без employee: ${orphanedUsers.rowCount}`);
      orphanedUsers.rows.forEach(u => {
        console.log(`  - ${u.email} (${u.id})`);
      });

      // Предлагаем создать employee
      console.log('\n🔧 Создаём employee для этих пользователей...');
      
      for (const user of orphanedUsers.rows) {
        // Получаем первое направление
        const directionResult = await client.query('SELECT id FROM directions LIMIT 1');
        const directionId = directionResult.rows[0]?.id;

        if (!directionId) {
          console.log('❌ Нет направлений в БД. Сначала создайте направление.');
          continue;
        }

        await client.query(`
          INSERT INTO employees (id, email, full_name, position, direction_id, default_hourly_rate, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, true)
          ON CONFLICT (id) DO NOTHING
        `, [
          user.id,
          user.email,
          user.email.split('@')[0], // Используем имя из email
          'Сотрудник',
          directionId,
          1000
        ]);

        console.log(`  ✓ Создан employee для ${user.email}`);
      }
    } else {
      console.log('\n✅ Все пользователи имеют соответствующие employee записи');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

syncAuthEmployees();

