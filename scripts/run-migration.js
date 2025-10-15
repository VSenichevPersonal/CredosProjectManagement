#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Подключено к PostgreSQL');

    // Читаем SQL файл
    const migrationPath = process.argv[2] || 'prisma/migrations/011_customers_activities.sql';
    const sql = fs.readFileSync(path.join(process.cwd(), migrationPath), 'utf8');

    console.log(`📄 Запуск миграции: ${migrationPath}`);

    // Выполняем миграцию
    await client.query(sql);

    console.log('✅ Миграция выполнена успешно!');

  } catch (error) {
    console.error('❌ Ошибка при выполнении миграции:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

