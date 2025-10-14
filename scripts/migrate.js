require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'установлен' : 'НЕ НАЙДЕН');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Подключено к PostgreSQL');

    const migrationsDir = path.join(__dirname, '../prisma/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Найдено миграций: ${files.length}`);

    for (const file of files) {
      console.log(`\n→ Выполняем: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      console.log(`✓ Миграция ${file} применена`);
    }

    console.log('\n✅ Все миграции успешно применены!');
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();

