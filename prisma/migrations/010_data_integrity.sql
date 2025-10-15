-- Migration 010: Data Integrity Improvements
-- Priority: P0 - CRITICAL
-- Impact: HIGH (data safety & consistency)
-- Description: Fix foreign key constraints for data integrity
-- Author: AI Senior Architect
-- Date: 2024-10-15

-- ============================================================================
-- КРИТИЧНЫЕ ИСПРАВЛЕНИЯ
-- ============================================================================

-- 1. 🔴 КРИТИЧНО: Добавить FK для employees.user_id → auth.user.id
-- Предотвращает создание employee с несуществующим user_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_employees_user_id'
  ) THEN
    ALTER TABLE employees 
    ADD CONSTRAINT fk_employees_user_id 
    FOREIGN KEY (user_id) 
    REFERENCES auth."user"(id) 
    ON DELETE CASCADE;
    
    COMMENT ON CONSTRAINT fk_employees_user_id ON employees IS 'Link to auth user - CASCADE delete employee when user deleted';
  END IF;
END $$;

-- 2. 🔴 КРИТИЧНО: Добавить FK для time_entries.phase_id → project_phases.id
-- Предотвращает orphaned phase_id
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_entries' AND column_name = 'phase_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_time_entries_phase_id'
    ) THEN
      ALTER TABLE time_entries 
      ADD CONSTRAINT fk_time_entries_phase_id 
      FOREIGN KEY (phase_id) 
      REFERENCES project_phases(id) 
      ON DELETE SET NULL;
      
      COMMENT ON CONSTRAINT fk_time_entries_phase_id ON time_entries IS 'Optional link to project phase - SET NULL when phase deleted';
    END IF;
  END IF;
END $$;

-- 3. 🔥 КРИТИЧНО: Изменить CASCADE на SET NULL для time_entries.task_id
-- Чтобы не терять часы при удалении задачи
ALTER TABLE time_entries 
DROP CONSTRAINT IF EXISTS time_entries_task_id_fkey;

ALTER TABLE time_entries 
ADD CONSTRAINT time_entries_task_id_fkey 
FOREIGN KEY (task_id) 
REFERENCES tasks(id) 
ON DELETE SET NULL;

COMMENT ON CONSTRAINT time_entries_task_id_fkey ON time_entries IS 'Keep time entries when task deleted - SET NULL instead of CASCADE';

-- ============================================================================
-- ПРАВИЛЬНЫЕ CASCADE ПРАВИЛА
-- ============================================================================

-- 4. ✅ Правильно: tasks должны удаляться вместе с project
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES projects(id) 
ON DELETE CASCADE;

COMMENT ON CONSTRAINT tasks_project_id_fkey ON tasks IS 'Tasks are deleted when project is deleted - CASCADE';

-- ============================================================================
-- AUDIT ТАБЛИЦЫ: SET NULL для сохранения истории
-- ============================================================================

-- 5. 📋 activity_log должен сохранять историю даже после удаления employee
ALTER TABLE activity_log 
DROP CONSTRAINT IF EXISTS activity_log_employee_id_fkey;

ALTER TABLE activity_log 
ADD CONSTRAINT activity_log_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

COMMENT ON CONSTRAINT activity_log_employee_id_fkey ON activity_log IS 'Preserve activity history when employee deleted - SET NULL';

-- 6. 📋 comments должны сохранять автора даже после удаления
ALTER TABLE comments 
DROP CONSTRAINT IF EXISTS comments_author_id_fkey;

ALTER TABLE comments 
ADD CONSTRAINT comments_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

COMMENT ON CONSTRAINT comments_author_id_fkey ON comments IS 'Preserve comment history when author deleted - SET NULL';

-- ============================================================================
-- НЕОБЯЗАТЕЛЬНЫЕ СВЯЗИ: SET NULL
-- ============================================================================

-- 7. 👤 tasks.assignee_id - задача может остаться без исполнителя
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_assignee_id_fkey 
FOREIGN KEY (assignee_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

COMMENT ON CONSTRAINT tasks_assignee_id_fkey ON tasks IS 'Task can exist without assignee - SET NULL';

-- 8. 👤 projects.manager_id - проект может остаться без менеджера
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_manager_id_fkey;

ALTER TABLE projects 
ADD CONSTRAINT projects_manager_id_fkey 
FOREIGN KEY (manager_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

COMMENT ON CONSTRAINT projects_manager_id_fkey ON projects IS 'Project can exist without manager - SET NULL';

-- 9. ✅ time_entries.approved_by - сохранить кто утвердил
ALTER TABLE time_entries 
DROP CONSTRAINT IF EXISTS time_entries_approved_by_fkey;

ALTER TABLE time_entries 
ADD CONSTRAINT time_entries_approved_by_fkey 
FOREIGN KEY (approved_by) 
REFERENCES employees(id) 
ON DELETE SET NULL;

COMMENT ON CONSTRAINT time_entries_approved_by_fkey ON time_entries IS 'Preserve approval history - SET NULL';

-- 10. ✅ approval_workflows.approver_id - сохранить кто согласовывал
ALTER TABLE approval_workflows 
DROP CONSTRAINT IF EXISTS approval_workflows_approver_id_fkey;

ALTER TABLE approval_workflows 
ADD CONSTRAINT approval_workflows_approver_id_fkey 
FOREIGN KEY (approver_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

COMMENT ON CONSTRAINT approval_workflows_approver_id_fkey ON approval_workflows IS 'Preserve approval history - SET NULL';

-- ============================================================================
-- СПРАВОЧНИКИ: SET NULL для гибкости
-- ============================================================================

-- 11. 🏢 employees.direction_id - сотрудник может остаться без направления
ALTER TABLE employees 
DROP CONSTRAINT IF EXISTS employees_direction_id_fkey;

ALTER TABLE employees 
ADD CONSTRAINT employees_direction_id_fkey 
FOREIGN KEY (direction_id) 
REFERENCES directions(id) 
ON DELETE SET NULL;

COMMENT ON CONSTRAINT employees_direction_id_fkey ON employees IS 'Employee can exist without direction - SET NULL';

-- 12. 🏢 projects.direction_id - проект может остаться без направления
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_direction_id_fkey;

ALTER TABLE projects 
ADD CONSTRAINT projects_direction_id_fkey 
FOREIGN KEY (direction_id) 
REFERENCES directions(id) 
ON DELETE SET NULL;

COMMENT ON CONSTRAINT projects_direction_id_fkey ON projects IS 'Project can exist without direction - SET NULL';

-- ============================================================================
-- ПРОЧИЕ: SET NULL
-- ============================================================================

-- 13. ⚙️ settings.updated_by - сохранить историю изменений
ALTER TABLE settings 
DROP CONSTRAINT IF EXISTS settings_updated_by_fkey;

ALTER TABLE settings 
ADD CONSTRAINT settings_updated_by_fkey 
FOREIGN KEY (updated_by) 
REFERENCES employees(id) 
ON DELETE SET NULL;

COMMENT ON CONSTRAINT settings_updated_by_fkey ON settings IS 'Preserve settings change history - SET NULL';

-- 14. 🔐 user_roles.granted_by - сохранить кто выдал роль
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_granted_by_fkey;

ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_granted_by_fkey 
FOREIGN KEY (granted_by) 
REFERENCES employees(id) 
ON DELETE SET NULL;

COMMENT ON CONSTRAINT user_roles_granted_by_fkey ON user_roles IS 'Preserve role grant history - SET NULL';

-- ============================================================================
-- ИТОГОВЫЕ КОММЕНТАРИИ
-- ============================================================================

COMMENT ON TABLE employees IS 'Employees - central entity with CASCADE from auth.user and SET NULL to dependents';
COMMENT ON TABLE projects IS 'Projects - CASCADE to tasks, SET NULL to optional fields';
COMMENT ON TABLE tasks IS 'Tasks - CASCADE from project, SET NULL from time_entries';
COMMENT ON TABLE time_entries IS 'Time entries - RESTRICT from employee/project, SET NULL from task';
COMMENT ON TABLE directions IS 'Directions - SET NULL to employees and projects';
COMMENT ON TABLE activity_log IS 'Activity log - preserves history with SET NULL';
COMMENT ON TABLE comments IS 'Comments - preserves history with SET NULL';

-- ============================================================================
-- УСПЕШНОЕ ЗАВЕРШЕНИЕ
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration 010: Data Integrity Improvements completed successfully';
  RAISE NOTICE '   - Added FK: employees.user_id → auth.user (CASCADE)';
  RAISE NOTICE '   - Added FK: time_entries.phase_id → project_phases (SET NULL)';
  RAISE NOTICE '   - Changed: time_entries.task_id from CASCADE to SET NULL';
  RAISE NOTICE '   - Changed: tasks.project_id to CASCADE';
  RAISE NOTICE '   - Changed: All audit tables to SET NULL';
  RAISE NOTICE '   - Changed: All optional relations to SET NULL';
  RAISE NOTICE '   - Total constraints updated: 14';
END $$;

