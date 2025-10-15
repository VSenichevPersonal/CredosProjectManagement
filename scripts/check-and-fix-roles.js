#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkAndFixRoles() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Подключено к PostgreSQL');

    // Проверяем все employees
    const employeesResult = await client.query(`
      SELECT id, email, full_name, position, is_active 
      FROM employees 
      ORDER BY created_at
    `);

    console.log(`\n👥 Сотрудники в базе: ${employeesResult.rowCount}`);
    
    for (const emp of employeesResult.rows) {
      console.log(`\n📧 ${emp.email} (${emp.full_name})`);
      console.log(`   ID: ${emp.id}`);
      console.log(`   Должность: ${emp.position}`);
      console.log(`   Активен: ${emp.is_active ? 'да' : 'нет'}`);

      // Проверяем роли
      const rolesResult = await client.query(
        'SELECT role, is_active FROM user_roles WHERE employee_id = $1',
        [emp.id]
      );

      if (rolesResult.rowCount === 0) {
        console.log(`   ⚠️  Ролей НЕТ! Добавляем...`);
        
        // Определяем роль по email или должности
        let role = 'employee'; // по умолчанию
        
        if (emp.email.includes('admin') || emp.position?.toLowerCase().includes('администратор')) {
          role = 'admin';
        } else if (emp.position?.toLowerCase().includes('менеджер') || emp.position?.toLowerCase().includes('руководител')) {
          role = 'manager';
        }

        // Добавляем роль
        await client.query(
          `INSERT INTO user_roles (employee_id, role, is_active)
           VALUES ($1, $2, true)
           ON CONFLICT (employee_id, role) DO NOTHING`,
          [emp.id, role]
        );

        console.log(`   ✅ Добавлена роль: ${role}`);
      } else {
        console.log(`   ✓ Роли:`);
        rolesResult.rows.forEach(r => {
          console.log(`      - ${r.role} (${r.is_active ? 'активна' : 'неактивна'})`);
        });
      }

      // Проверяем есть ли связь auth.user
      const authCheck = await client.query(
        'SELECT id FROM auth."user" WHERE id = $1',
        [emp.id]
      );

      if (authCheck.rowCount > 0) {
        console.log(`   ✓ Связан с auth.user`);
      } else {
        console.log(`   ⚠️  НЕ связан с auth.user (логин невозможен)`);
      }
    }

    console.log('\n🎉 Проверка завершена!');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkAndFixRoles();

