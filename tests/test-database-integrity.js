#!/usr/bin/env node

/**
 * Database Integrity Tests
 * Tests RESTRICT and CHECK constraints
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const tests = {
  passed: 0,
  failed: 0,
  total: 0
};

async function runTest(name, testFn) {
  tests.total++;
  process.stdout.write(`\n🧪 Test ${tests.total}: ${name}... `);
  
  try {
    await testFn();
    tests.passed++;
    console.log('✅ PASSED');
    return true;
  } catch (error) {
    tests.failed++;
    console.log(`❌ FAILED: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  DATABASE INTEGRITY TESTS             ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Test 2.1: Проверка таблиц
  await runTest('All tables exist', async () => {
    const tables = [
      'employees', 'projects', 'tasks', 'time_entries',
      'customers', 'activities', 'tags',
      'project_tags', 'task_tags',
      'directions', 'user_roles'
    ];
    
    for (const table of tables) {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )`,
        [table]
      );
      
      if (!result.rows[0].exists) {
        throw new Error(`Table ${table} does not exist`);
      }
    }
  });

  // Test 2.2: RESTRICT для employee
  await runTest('RESTRICT: Cannot delete employee with time_entries', async () => {
    // Найти employee с time entries
    const result = await pool.query(
      'SELECT DISTINCT employee_id FROM time_entries LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      throw new Error('No employees with time_entries found - cannot test RESTRICT');
    }
    
    const employeeId = result.rows[0].employee_id;
    
    // Попытаться удалить (должна провалиться)
    try {
      await pool.query('DELETE FROM employees WHERE id = $1', [employeeId]);
      throw new Error('RESTRICT constraint did not work - employee was deleted!');
    } catch (error) {
      if (error.code === '23503') {
        // Правильно! Foreign key violation
        return;
      }
      throw error;
    }
  });

  // Test 2.3: RESTRICT для project
  await runTest('RESTRICT: Cannot delete project with time_entries', async () => {
    const result = await pool.query(
      'SELECT DISTINCT project_id FROM time_entries LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      throw new Error('No projects with time_entries found - cannot test RESTRICT');
    }
    
    const projectId = result.rows[0].project_id;
    
    try {
      await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
      throw new Error('RESTRICT constraint did not work - project was deleted!');
    } catch (error) {
      if (error.code === '23503') {
        return;
      }
      throw error;
    }
  });

  // Test 2.4: CHECK constraint для hours
  await runTest('CHECK: Hours must be 0-24', async () => {
    const employee = await pool.query('SELECT id FROM employees LIMIT 1');
    const project = await pool.query('SELECT id FROM projects LIMIT 1');
    
    if (employee.rows.length === 0 || project.rows.length === 0) {
      throw new Error('No employees or projects found');
    }
    
    // Попытка создать с 25 часами
    try {
      await pool.query(
        `INSERT INTO time_entries (employee_id, project_id, date, hours, description)
         VALUES ($1, $2, CURRENT_DATE, 25, 'Invalid hours test')`,
        [employee.rows[0].id, project.rows[0].id]
      );
      throw new Error('CHECK constraint did not work - created entry with 25 hours!');
    } catch (error) {
      if (error.code === '23514') {
        // Check violation - правильно!
        return;
      }
      throw error;
    }
  });

  // Test 2.5: CHECK constraint для date
  await runTest('CHECK: Date cannot be >7 days in future', async () => {
    const employee = await pool.query('SELECT id FROM employees LIMIT 1');
    const project = await pool.query('SELECT id FROM projects LIMIT 1');
    
    if (employee.rows.length === 0 || project.rows.length === 0) {
      throw new Error('No employees or projects found');
    }
    
    // Попытка создать на 30 дней вперёд
    try {
      await pool.query(
        `INSERT INTO time_entries (employee_id, project_id, date, hours, description)
         VALUES ($1, $2, CURRENT_DATE + INTERVAL '30 days', 8, 'Future date test')`,
        [employee.rows[0].id, project.rows[0].id]
      );
      throw new Error('CHECK constraint did not work - created entry 30 days in future!');
    } catch (error) {
      if (error.code === '23514') {
        return;
      }
      throw error;
    }
  });

  // Test 2.6: SET NULL для task_id работает
  await runTest('SET NULL: Time entries preserved when task deleted', async () => {
    // Создать task
    const project = await pool.query('SELECT id FROM projects LIMIT 1');
    if (project.rows.length === 0) {
      throw new Error('No projects found');
    }
    
    const task = await pool.query(
      `INSERT INTO tasks (project_id, name, status, priority, estimated_hours, actual_hours)
       VALUES ($1, 'Test Task for Deletion', 'todo', 'medium', 1, 0)
       RETURNING id`,
      [project.rows[0].id]
    );
    
    const taskId = task.rows[0].id;
    
    // Создать time entry для этой задачи
    const employee = await pool.query('SELECT id FROM employees LIMIT 1');
    const timeEntry = await pool.query(
      `INSERT INTO time_entries (employee_id, project_id, task_id, date, hours, description)
       VALUES ($1, $2, $3, CURRENT_DATE, 2, 'Test entry for SET NULL')
       RETURNING id`,
      [employee.rows[0].id, project.rows[0].id, taskId]
    );
    
    const timeEntryId = timeEntry.rows[0].id;
    
    // Удалить задачу
    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    
    // Проверить, что time entry существует с task_id = NULL
    const check = await pool.query(
      'SELECT task_id FROM time_entries WHERE id = $1',
      [timeEntryId]
    );
    
    if (check.rows.length === 0) {
      throw new Error('Time entry was deleted - SET NULL did not work!');
    }
    
    if (check.rows[0].task_id !== null) {
      throw new Error('task_id was not set to NULL!');
    }
    
    // Cleanup
    await pool.query('DELETE FROM time_entries WHERE id = $1', [timeEntryId]);
  });

  // Test 2.7: Проверка справочников
  await runTest('Dictionaries: customers, activities, tags exist', async () => {
    const customers = await pool.query('SELECT COUNT(*) FROM customers');
    const activities = await pool.query('SELECT COUNT(*) FROM activities');
    const tags = await pool.query('SELECT COUNT(*) FROM tags');
    
    console.log(`\n     Customers: ${customers.rows[0].count}`);
    console.log(`     Activities: ${activities.rows[0].count}`);
    console.log(`     Tags: ${tags.rows[0].count}`);
    
    if (parseInt(activities.rows[0].count) < 5) {
      throw new Error('Expected at least 5 preloaded activities');
    }
    
    if (parseInt(tags.rows[0].count) < 5) {
      throw new Error('Expected at least 5 preloaded tags');
    }
  });

  // Итоги
  console.log('\n\n╔════════════════════════════════════════╗');
  console.log('║  TEST RESULTS                          ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log(`Total Tests:  ${tests.total}`);
  console.log(`Passed:       ${tests.passed} ✅`);
  console.log(`Failed:       ${tests.failed} ❌`);
  console.log(`Success Rate: ${Math.round((tests.passed / tests.total) * 100)}%\n`);

  await pool.end();
  
  if (tests.failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  pool.end();
  process.exit(1);
});

