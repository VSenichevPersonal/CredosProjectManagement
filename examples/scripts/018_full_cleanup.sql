-- Полная очистка всех данных для свежего старта
-- ВНИМАНИЕ: Этот скрипт удалит ВСЕ данные из всех таблиц!

BEGIN;

-- Отключаем триггеры для ускорения
SET session_replication_role = 'replica';

-- Удаляем данные в правильном порядке (от зависимых к независимым)

-- 1. Удаляем audit_logs (зависит от users)
DELETE FROM audit_logs;

-- 2. Удаляем compliance_records (зависит от requirements, users, organizations)
DELETE FROM compliance_records;

-- 3. Удаляем requirements (зависит от users, organizations)
DELETE FROM requirements;

-- 4. Удаляем users (зависит от organizations)
DELETE FROM users;

-- 5. Удаляем organizations (независимая таблица)
DELETE FROM organizations;

-- Включаем триггеры обратно
SET session_replication_role = 'default';

-- Проверяем результат
SELECT 
  'organizations' as table_name, 
  COUNT(*) as remaining_count 
FROM organizations
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'requirements', COUNT(*) FROM requirements
UNION ALL
SELECT 'compliance_records', COUNT(*) FROM compliance_records
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs;

COMMIT;

-- Сообщение об успехе
SELECT 'База данных полностью очищена. Теперь создайте пользователей через Supabase Dashboard и запустите скрипт синхронизации.' as message;
