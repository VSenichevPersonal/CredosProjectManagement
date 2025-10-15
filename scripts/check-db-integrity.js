require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

/**
 * Скрипт проверки целостности базы данных
 * Проверяет:
 * - Существование всех необходимых таблиц
 * - Foreign key constraints
 * - Индексы
 * - Orphaned records (записи без parent)
 * - Статистику по каждой таблице
 */

async function checkIntegrity() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Подключено к PostgreSQL\n');

    const report = {
      tables: {},
      constraints: [],
      orphans: [],
      warnings: [],
      errors: []
    };

    // 1. Проверка существования таблиц
    console.log('📋 Проверка таблиц...');
    const requiredTables = [
      'directions',
      'employees',
      'projects',
      'tasks',
      'time_entries',
      'user_roles',
      'revenue_manual',
      'salary_register'
    ];

    for (const table of requiredTables) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      
      if (result.rows[0].exists) {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        report.tables[table] = {
          exists: true,
          count: parseInt(countResult.rows[0].count)
        };
        console.log(`  ✓ ${table.padEnd(20)} - ${countResult.rows[0].count} записей`);
      } else {
        report.tables[table] = { exists: false, count: 0 };
        report.errors.push(`Таблица ${table} не существует`);
        console.log(`  ✗ ${table.padEnd(20)} - НЕ НАЙДЕНА`);
      }
    }

    // 2. Проверка Foreign Keys
    console.log('\n🔗 Проверка Foreign Key constraints...');
    
    // Проверка orphaned employees (без направления)
    const orphanedEmployees = await client.query(`
      SELECT e.id, e.full_name, e.direction_id
      FROM employees e
      LEFT JOIN directions d ON d.id = e.direction_id
      WHERE e.direction_id IS NOT NULL AND d.id IS NULL
    `);
    
    if (orphanedEmployees.rows.length > 0) {
      report.orphans.push({
        table: 'employees',
        count: orphanedEmployees.rows.length,
        records: orphanedEmployees.rows
      });
      console.log(`  ⚠️  Сотрудники без направления: ${orphanedEmployees.rows.length}`);
    } else {
      console.log('  ✓ Сотрудники: все связи корректны');
    }

    // Проверка orphaned projects
    const orphanedProjects = await client.query(`
      SELECT p.id, p.name, p.direction_id, p.manager_id
      FROM projects p
      LEFT JOIN directions d ON d.id = p.direction_id
      WHERE p.direction_id IS NOT NULL AND d.id IS NULL
    `);
    
    if (orphanedProjects.rows.length > 0) {
      report.orphans.push({
        table: 'projects',
        field: 'direction_id',
        count: orphanedProjects.rows.length
      });
      console.log(`  ⚠️  Проекты без направления: ${orphanedProjects.rows.length}`);
    } else {
      console.log('  ✓ Проекты: все связи с направлениями корректны');
    }

    // Проверка orphaned tasks
    const orphanedTasks = await client.query(`
      SELECT t.id, t.name, t.project_id
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE t.project_id IS NOT NULL AND p.id IS NULL
    `);
    
    if (orphanedTasks.rows.length > 0) {
      report.orphans.push({
        table: 'tasks',
        count: orphanedTasks.rows.length
      });
      console.log(`  ⚠️  Задачи без проекта: ${orphanedTasks.rows.length}`);
    } else {
      console.log('  ✓ Задачи: все связи корректны');
    }

    // Проверка orphaned time_entries
    const orphanedTimeEntries = await client.query(`
      SELECT te.id, te.employee_id, te.project_id
      FROM time_entries te
      LEFT JOIN employees e ON e.id = te.employee_id
      LEFT JOIN projects p ON p.id = te.project_id
      WHERE (te.employee_id IS NOT NULL AND e.id IS NULL)
         OR (te.project_id IS NOT NULL AND p.id IS NULL)
    `);
    
    if (orphanedTimeEntries.rows.length > 0) {
      report.orphans.push({
        table: 'time_entries',
        count: orphanedTimeEntries.rows.length
      });
      console.log(`  ⚠️  Записи времени с некорректными ссылками: ${orphanedTimeEntries.rows.length}`);
    } else {
      console.log('  ✓ Записи времени: все связи корректны');
    }

    // 3. Проверка бизнес-логики
    console.log('\n📊 Проверка бизнес-логики...');

    // Проверка: есть ли активные сотрудники
    const activeEmployees = await client.query('SELECT COUNT(*) FROM employees WHERE is_active = true');
    const activeCount = parseInt(activeEmployees.rows[0].count);
    if (activeCount === 0) {
      report.warnings.push('Нет активных сотрудников');
      console.log('  ⚠️  Нет активных сотрудников');
    } else {
      console.log(`  ✓ Активных сотрудников: ${activeCount}`);
    }

    // Проверка: есть ли активные направления
    const activeDirections = await client.query('SELECT COUNT(*) FROM directions WHERE is_active = true');
    const activeDirCount = parseInt(activeDirections.rows[0].count);
    if (activeDirCount === 0) {
      report.warnings.push('Нет активных направлений');
      console.log('  ⚠️  Нет активных направлений');
    } else {
      console.log(`  ✓ Активных направлений: ${activeDirCount}`);
    }

    // Проверка: есть ли проекты в статусе active
    const activeProjects = await client.query("SELECT COUNT(*) FROM projects WHERE status = 'active'");
    const activeProjCount = parseInt(activeProjects.rows[0].count);
    console.log(`  ℹ️  Активных проектов: ${activeProjCount}`);

    // Проверка: есть ли записи времени за последние 30 дней
    const recentTimeEntries = await client.query(`
      SELECT COUNT(*) FROM time_entries 
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    `);
    const recentCount = parseInt(recentTimeEntries.rows[0].count);
    if (recentCount === 0) {
      report.warnings.push('Нет записей времени за последние 30 дней');
      console.log('  ⚠️  Нет записей времени за последние 30 дней');
    } else {
      console.log(`  ✓ Записей времени за последние 30 дней: ${recentCount}`);
    }

    // 4. Проверка индексов
    console.log('\n🔍 Проверка индексов...');
    const indexes = await client.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    const indexCount = indexes.rows.length;
    console.log(`  ℹ️  Найдено индексов: ${indexCount}`);

    // 5. Итоговый отчёт
    console.log('\n' + '='.repeat(60));
    console.log('📊 ИТОГОВЫЙ ОТЧЁТ');
    console.log('='.repeat(60));
    
    const totalRecords = Object.values(report.tables)
      .reduce((sum, table) => sum + table.count, 0);
    
    console.log(`\n✅ Всего записей в БД: ${totalRecords}`);
    console.log(`✅ Таблиц проверено: ${requiredTables.length}`);
    console.log(`✅ Индексов найдено: ${indexCount}`);
    
    if (report.errors.length > 0) {
      console.log(`\n❌ Критических ошибок: ${report.errors.length}`);
      report.errors.forEach(err => console.log(`   - ${err}`));
    }
    
    if (report.orphans.length > 0) {
      console.log(`\n⚠️  Orphaned записей: ${report.orphans.length} типов`);
      report.orphans.forEach(orphan => {
        console.log(`   - ${orphan.table}: ${orphan.count} записей`);
      });
    }
    
    if (report.warnings.length > 0) {
      console.log(`\n⚠️  Предупреждений: ${report.warnings.length}`);
      report.warnings.forEach(warn => console.log(`   - ${warn}`));
    }
    
    if (report.errors.length === 0 && report.orphans.length === 0) {
      console.log('\n🎉 База данных в отличном состоянии!');
    } else if (report.errors.length === 0) {
      console.log('\n✅ База данных в хорошем состоянии (есть минорные замечания)');
    } else {
      console.log('\n❌ Обнаружены проблемы! Требуется внимание.');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    return report;

  } catch (error) {
    console.error('\n❌ Ошибка при проверке целостности:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Запуск проверки
checkIntegrity()
  .then(() => {
    console.log('✅ Проверка завершена');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  });

