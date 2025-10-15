#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkAuthTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Подключено к PostgreSQL');

    // Проверяем схему auth
    const schemaCheck = await client.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth'`
    );

    if (schemaCheck.rowCount === 0) {
      console.log('⚠️  Схема auth не существует. Создаём...');
      await client.query('CREATE SCHEMA IF NOT EXISTS auth');
      console.log('✓ Схема auth создана');
    } else {
      console.log('✓ Схема auth существует');
    }

    // Проверяем таблицу auth.user
    const userTableCheck = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'user'`
    );

    if (userTableCheck.rowCount === 0) {
      console.log('⚠️  Таблица auth.user не существует. Создаём...');
      await client.query(`
        CREATE TABLE auth."user" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          encrypted_password TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('✓ Таблица auth.user создана');
    } else {
      console.log('✓ Таблица auth.user существует');
      const userCount = await client.query('SELECT COUNT(*) FROM auth."user"');
      console.log(`  └─ Пользователей: ${userCount.rows[0].count}`);
    }

    // Проверяем таблицу auth.session
    const sessionTableCheck = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'session'`
    );

    if (sessionTableCheck.rowCount === 0) {
      console.log('⚠️  Таблица auth.session не существует. Создаём...');
      await client.query(`
        CREATE TABLE auth.session (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth."user"(id) ON DELETE CASCADE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('✓ Таблица auth.session создана');
    } else {
      console.log('✓ Таблица auth.session существует');
      const sessionCount = await client.query('SELECT COUNT(*) FROM auth.session');
      console.log(`  └─ Активных сессий: ${sessionCount.rows[0].count}`);
    }

    // Проверяем что таблица employees существует и связана с auth.user
    const employeesCheck = await client.query(
      `SELECT COUNT(*) FROM employees WHERE id IN (SELECT id FROM auth."user" LIMIT 1)`
    );
    console.log(`\n✓ Таблица employees существует`);
    console.log(`  └─ Сотрудников: ${employeesCheck.rowCount}`);

    console.log('\n🎉 Все таблицы авторизации готовы!');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkAuthTables();

