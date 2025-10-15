#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const crypto = require('crypto');

/**
 * Создаёт auth.user записи для сотрудников без авторизации
 * Генерирует временные пароли для новых пользователей
 */
async function createAuthForEmployees() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Подключено к PostgreSQL');

    // Находим сотрудников без auth.user
    const orphanedEmployees = await client.query(`
      SELECT e.id, e.email, e.full_name, e.position 
      FROM employees e 
      LEFT JOIN auth."user" u ON e.id = u.id 
      WHERE u.id IS NULL AND e.is_active = true
    `);

    if (orphanedEmployees.rowCount === 0) {
      console.log('\n✅ Все активные сотрудники имеют auth.user записи');
      return;
    }

    console.log(`\n⚠️  Найдено сотрудников без auth.user: ${orphanedEmployees.rowCount}`);
    orphanedEmployees.rows.forEach(e => {
      console.log(`  - ${e.email} (${e.full_name})`);
    });

    console.log('\n🔧 Создаём auth.user для этих сотрудников...');
    console.log('📝 Временный пароль для всех: "password123" (нужно изменить!)');

    // Хешируем временный пароль (используем bcrypt формат, но упрощённо)
    // В production нужно использовать правильный bcrypt!
    const tempPassword = 'password123';
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    for (const employee of orphanedEmployees.rows) {
      try {
        await client.query(`
          INSERT INTO auth."user" (id, email, encrypted_password, created_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (id) DO NOTHING
        `, [
          employee.id,
          employee.email,
          hashedPassword
        ]);

        console.log(`  ✓ Создан auth.user для ${employee.email}`);
      } catch (err) {
        console.log(`  ❌ Ошибка для ${employee.email}: ${err.message}`);
      }
    }

    console.log('\n🎉 Готово! Новые пользователи могут логиниться:');
    console.log(`   Email: <их email>`);
    console.log(`   Пароль: ${tempPassword}`);
    console.log('\n⚠️  ВАЖНО: Попросите пользователей сменить пароль после первого входа!');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAuthForEmployees();

