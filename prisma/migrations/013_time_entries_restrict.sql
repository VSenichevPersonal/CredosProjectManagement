-- Migration 013: Time Entries RESTRICT Constraints
-- Priority: P0 - CRITICAL
-- Impact: VERY HIGH (financial data protection)
-- Description: Add RESTRICT constraints to protect time_entries from accidental data loss
-- Author: AI Senior Architect
-- Date: 2025-10-15
-- Inspired by: Timetta, Kimai best practices

-- ============================================================================
-- ПРОБЛЕМА:
-- ============================================================================
-- Сейчас можно удалить employee или project, у которых есть списанные часы.
-- Это приводит к потере финансовых данных и нарушению целостности отчётов.
--
-- РЕШЕНИЕ:
-- Добавить RESTRICT constraints, чтобы предотвратить удаление сущностей
-- с зависимыми time_entries.

-- ============================================================================
-- 🔴 КРИТИЧНО: Защита от удаления employee с часами
-- ============================================================================

-- Проверяем текущий constraint
DO $$ 
BEGIN
  RAISE NOTICE '🔍 Проверяем текущие constraints для time_entries...';
END $$;

-- Удаляем старый constraint (если есть)
ALTER TABLE time_entries 
DROP CONSTRAINT IF EXISTS time_entries_employee_id_fkey;

-- Добавляем новый constraint с RESTRICT
ALTER TABLE time_entries 
ADD CONSTRAINT time_entries_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES employees(id) 
ON DELETE RESTRICT;

COMMENT ON CONSTRAINT time_entries_employee_id_fkey ON time_entries IS 
'RESTRICT: Cannot delete employee with time entries. Use soft delete (is_active=false) or archive instead.';

-- ============================================================================
-- 🔴 КРИТИЧНО: Защита от удаления project с часами
-- ============================================================================

-- Удаляем старый constraint (если есть)
ALTER TABLE time_entries 
DROP CONSTRAINT IF EXISTS time_entries_project_id_fkey;

-- Добавляем новый constraint с RESTRICT
ALTER TABLE time_entries 
ADD CONSTRAINT time_entries_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES projects(id) 
ON DELETE RESTRICT;

COMMENT ON CONSTRAINT time_entries_project_id_fkey ON time_entries IS 
'RESTRICT: Cannot delete project with time entries. Use soft delete or archive instead.';

-- ============================================================================
-- 🛡️ ДОПОЛНИТЕЛЬНО: CHECK Constraints для бизнес-логики
-- ============================================================================

-- 1. Часы должны быть в диапазоне 0-24
ALTER TABLE time_entries 
DROP CONSTRAINT IF EXISTS check_hours_range;

ALTER TABLE time_entries 
ADD CONSTRAINT check_hours_range 
CHECK (hours >= 0 AND hours <= 24);

COMMENT ON CONSTRAINT check_hours_range ON time_entries IS 
'Business rule: Hours must be between 0 and 24';

-- 2. Нельзя списать часы на будущее (защита от ошибок)
ALTER TABLE time_entries 
DROP CONSTRAINT IF EXISTS check_date_not_future;

ALTER TABLE time_entries 
ADD CONSTRAINT check_date_not_future 
CHECK (date <= CURRENT_DATE + INTERVAL '7 days');

COMMENT ON CONSTRAINT check_date_not_future ON time_entries IS 
'Business rule: Cannot log time more than 7 days in the future';

-- 3. Описание не должно быть слишком длинным
ALTER TABLE time_entries 
DROP CONSTRAINT IF EXISTS check_description_length;

ALTER TABLE time_entries 
ADD CONSTRAINT check_description_length 
CHECK (description IS NULL OR LENGTH(description) <= 2000);

COMMENT ON CONSTRAINT check_description_length ON time_entries IS 
'Business rule: Description must be <= 2000 characters';

-- ============================================================================
-- 📊 CHECK Constraints для Projects
-- ============================================================================

-- Проект не может закончиться раньше, чем начался
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS check_project_dates_order;

ALTER TABLE projects 
ADD CONSTRAINT check_project_dates_order 
CHECK (
  end_date IS NULL OR 
  start_date IS NULL OR 
  end_date >= start_date
);

COMMENT ON CONSTRAINT check_project_dates_order ON projects IS 
'Business rule: Project end_date must be >= start_date';

-- Бюджет не может быть отрицательным
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS check_project_budget_positive;

ALTER TABLE projects 
ADD CONSTRAINT check_project_budget_positive 
CHECK (total_budget IS NULL OR total_budget >= 0);

COMMENT ON CONSTRAINT check_project_budget_positive ON projects IS 
'Business rule: Project budget must be >= 0';

-- ============================================================================
-- 📝 CHECK Constraints для Employees
-- ============================================================================

-- Ставка не может быть отрицательной
ALTER TABLE employees 
DROP CONSTRAINT IF EXISTS check_employee_hourly_rate_positive;

ALTER TABLE employees 
ADD CONSTRAINT check_employee_hourly_rate_positive 
CHECK (default_hourly_rate IS NULL OR default_hourly_rate >= 0);

COMMENT ON CONSTRAINT check_employee_hourly_rate_positive ON employees IS 
'Business rule: Hourly rate must be >= 0';

-- ============================================================================
-- 🧪 ТЕСТИРОВАНИЕ: Проверка constraints
-- ============================================================================

DO $$ 
DECLARE
  employee_with_entries UUID;
  project_with_entries UUID;
  test_passed BOOLEAN := true;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 === TESTING CONSTRAINTS ===';
  RAISE NOTICE '';
  
  -- Найти employee с time entries
  SELECT DISTINCT employee_id INTO employee_with_entries 
  FROM time_entries 
  LIMIT 1;
  
  -- Найти project с time entries
  SELECT DISTINCT project_id INTO project_with_entries 
  FROM time_entries 
  LIMIT 1;
  
  -- TEST 1: Попытка удалить employee с часами (должна провалиться)
  IF employee_with_entries IS NOT NULL THEN
    BEGIN
      DELETE FROM employees WHERE id = employee_with_entries;
      RAISE NOTICE '❌ TEST 1 FAILED: Employee was deleted despite having time entries!';
      test_passed := false;
    EXCEPTION WHEN foreign_key_violation THEN
      RAISE NOTICE '✅ TEST 1 PASSED: Cannot delete employee with time entries (RESTRICT works)';
    END;
  ELSE
    RAISE NOTICE '⚠️  TEST 1 SKIPPED: No employees with time entries found';
  END IF;
  
  -- TEST 2: Попытка удалить project с часами (должна провалиться)
  IF project_with_entries IS NOT NULL THEN
    BEGIN
      DELETE FROM projects WHERE id = project_with_entries;
      RAISE NOTICE '❌ TEST 2 FAILED: Project was deleted despite having time entries!';
      test_passed := false;
    EXCEPTION WHEN foreign_key_violation THEN
      RAISE NOTICE '✅ TEST 2 PASSED: Cannot delete project with time entries (RESTRICT works)';
    END;
  ELSE
    RAISE NOTICE '⚠️  TEST 2 SKIPPED: No projects with time entries found';
  END IF;
  
  -- TEST 3: Попытка создать запись с 25 часами (должна провалиться)
  BEGIN
    INSERT INTO time_entries (employee_id, project_id, date, hours, description)
    VALUES (
      (SELECT id FROM employees LIMIT 1),
      (SELECT id FROM projects LIMIT 1),
      CURRENT_DATE,
      25,
      'Test entry with invalid hours'
    );
    RAISE NOTICE '❌ TEST 3 FAILED: Created time entry with 25 hours!';
    test_passed := false;
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE '✅ TEST 3 PASSED: Cannot create time entry with hours > 24 (CHECK works)';
  END;
  
  -- TEST 4: Попытка создать запись на далёкое будущее (должна провалиться)
  BEGIN
    INSERT INTO time_entries (employee_id, project_id, date, hours, description)
    VALUES (
      (SELECT id FROM employees LIMIT 1),
      (SELECT id FROM projects LIMIT 1),
      CURRENT_DATE + INTERVAL '30 days',
      8,
      'Test entry with future date'
    );
    RAISE NOTICE '❌ TEST 4 FAILED: Created time entry 30 days in future!';
    test_passed := false;
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE '✅ TEST 4 PASSED: Cannot create time entry >7 days in future (CHECK works)';
  END;
  
  RAISE NOTICE '';
  IF test_passed THEN
    RAISE NOTICE '🎉 === ALL TESTS PASSED ===';
  ELSE
    RAISE NOTICE '⚠️  === SOME TESTS FAILED ===';
  END IF;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 📊 ИТОГОВАЯ СТАТИСТИКА
-- ============================================================================

DO $$ 
DECLARE
  total_employees INTEGER;
  total_projects INTEGER;
  total_time_entries INTEGER;
  employees_with_entries INTEGER;
  projects_with_entries INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_employees FROM employees WHERE is_active = true;
  SELECT COUNT(*) INTO total_projects FROM projects WHERE status NOT IN ('cancelled', 'completed');
  SELECT COUNT(*) INTO total_time_entries FROM time_entries;
  
  SELECT COUNT(DISTINCT employee_id) INTO employees_with_entries FROM time_entries;
  SELECT COUNT(DISTINCT project_id) INTO projects_with_entries FROM time_entries;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 === DATABASE STATISTICS ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Total Employees (active): %', total_employees;
  RAISE NOTICE 'Employees with Time Entries: % (%.1f%%)', 
    employees_with_entries, 
    CASE WHEN total_employees > 0 
      THEN (employees_with_entries::NUMERIC / total_employees * 100) 
      ELSE 0 
    END;
  RAISE NOTICE '';
  RAISE NOTICE 'Total Projects (active): %', total_projects;
  RAISE NOTICE 'Projects with Time Entries: % (%.1f%%)', 
    projects_with_entries,
    CASE WHEN total_projects > 0 
      THEN (projects_with_entries::NUMERIC / total_projects * 100) 
      ELSE 0 
    END;
  RAISE NOTICE '';
  RAISE NOTICE 'Total Time Entries: %', total_time_entries;
  RAISE NOTICE '';
  RAISE NOTICE '🛡️  These % employees and % projects are now PROTECTED from accidental deletion',
    employees_with_entries, projects_with_entries;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- ✅ УСПЕШНОЕ ЗАВЕРШЕНИЕ
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ ===================================';
  RAISE NOTICE '✅ Migration 013 completed successfully';
  RAISE NOTICE '✅ ===================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary of changes:';
  RAISE NOTICE '  1. ✅ Added RESTRICT: time_entries.employee_id';
  RAISE NOTICE '  2. ✅ Added RESTRICT: time_entries.project_id';
  RAISE NOTICE '  3. ✅ Added CHECK: hours range (0-24)';
  RAISE NOTICE '  4. ✅ Added CHECK: date not >7 days in future';
  RAISE NOTICE '  5. ✅ Added CHECK: description length <= 2000';
  RAISE NOTICE '  6. ✅ Added CHECK: project dates order';
  RAISE NOTICE '  7. ✅ Added CHECK: project budget >= 0';
  RAISE NOTICE '  8. ✅ Added CHECK: employee hourly rate >= 0';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  BREAKING CHANGE: Cannot delete employees/projects with time entries';
  RAISE NOTICE '   Use soft delete (is_active=false) or archiving instead.';
  RAISE NOTICE '';
  RAISE NOTICE '📖 Documentation: docs/DATA_INTEGRITY_COMPARISON_TIMETTA_VS_CREDOS.md';
  RAISE NOTICE '';
END $$;

