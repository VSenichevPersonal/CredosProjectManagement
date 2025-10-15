# 🔐 Модель целостности данных (Data Integrity Model)

**Система:** Credos Project Management  
**Дата:** 2024-10-15  
**Статус:** 🟡 Требует улучшений  
**Приоритет:** ВЫСОКИЙ

---

## 📊 EXECUTIVE SUMMARY

**Текущее состояние:** 6/10  
**Критичные проблемы:** 5  
**Предупреждения:** 8  
**Рекомендации:** 13

### Ключевые находки:
1. ❌ **Много NO ACTION** на критичных foreign keys → риск orphaned records
2. ❌ **Невозможно удалить employees** → блокируется множеством связей
3. ⚠️ **Нет FK от employees.user_id к auth.user** → риск несогласованности
4. ⚠️ **Невозможно удалить projects** → tasks блокирует удаление
5. ⚠️ **phase_id в time_entries** → но нет FK к project_phases

---

## 🗄️ ER DIAGRAM (ASCII)

```
┌─────────────────┐
│  auth.user      │
│  (Supabase)     │
└────────┬────────┘
         │ user_id (❌ NO FK!)
         ▼
┌─────────────────────────────────────────────────────────┐
│  employees                                               │
│  ┌──────────────────────────────────────────────┐      │
│  │ id (PK)                                       │      │
│  │ user_id → auth.user (❌ NO FK!)              │      │
│  │ direction_id → directions (NO ACTION)         │      │
│  │ full_name, email, position, hourly_rate      │      │
│  └──────────────────────────────────────────────┘      │
└────┬────────────────┬────────────────┬──────────────────┘
     │                │                │
     │ (NO ACTION)    │ (NO ACTION)    │ (CASCADE)
     ▼                ▼                ▼
┌──────────┐   ┌──────────┐   ┌──────────────┐
│ projects │   │  tasks   │   │ user_roles   │
└──────────┘   └──────────┘   └──────────────┘
     │                │
     │ (NO ACTION)    │ (CASCADE)
     ▼                ▼
┌──────────┐   ┌──────────────┐
│  tasks   │   │ time_entries │
└──────────┘   └──────────────┘
```

---

## 🔗 FOREIGN KEYS - Детальный анализ

### 1️⃣ **employees** (центральная таблица)

#### Исходящие FK (employees ссылается на):
| Колонка | Ссылка на | ON DELETE | Статус | Рекомендация |
|---------|-----------|-----------|--------|--------------|
| `direction_id` | `directions.id` | NO ACTION | ⚠️ | Изменить на SET NULL |
| `user_id` | `auth.user.id` | ❌ **НЕТ FK!** | 🔴 | **ДОБАВИТЬ FK** |

#### Входящие FK (кто ссылается на employees):
| Таблица | Колонка | ON DELETE | Проблема | Рекомендация |
|---------|---------|-----------|----------|--------------|
| `activity_log` | `employee_id` | NO ACTION | 🔴 Блокирует удаление | SET NULL + keep history |
| `approval_workflows` | `approver_id` | NO ACTION | 🔴 Блокирует удаление | SET NULL |
| `comments` | `author_id` | NO ACTION | 🔴 Блокирует удаление | SET NULL + keep author name |
| `settings` | `updated_by` | NO ACTION | 🔴 Блокирует удаление | SET NULL |
| `tasks` | `assignee_id` | NO ACTION | ⚠️ Может блокировать | SET NULL |
| `time_entries` | `employee_id` | NO ACTION | 🔴 Блокирует удаление | RESTRICT (правильно) |
| `time_entries` | `approved_by` | NO ACTION | ⚠️ | SET NULL |
| `projects` | `manager_id` | NO ACTION | ⚠️ | SET NULL |
| `notifications` | `employee_id` | CASCADE | ✅ Правильно | - |
| `project_members` | `employee_id` | CASCADE | ✅ Правильно | - |
| `user_roles` | `employee_id` | CASCADE | ✅ Правильно | - |
| `user_roles` | `granted_by` | NO ACTION | ⚠️ | SET NULL |

**🔴 КРИТИЧНАЯ ПРОБЛЕМА:** 
Невозможно удалить employee если у него есть:
- Activity log записи
- Комментарии
- Approval workflows
- Settings изменения
- Tasks назначенные
- Time entries

**Решение:** Soft delete для employees или изменить FK на SET NULL для audit таблиц.

---

### 2️⃣ **projects**

#### Исходящие FK:
| Колонка | Ссылка на | ON DELETE | Статус | Рекомендация |
|---------|-----------|-----------|--------|--------------|
| `direction_id` | `directions.id` | NO ACTION | ⚠️ | SET NULL |
| `manager_id` | `employees.id` | NO ACTION | ⚠️ | SET NULL |

#### Входящие FK:
| Таблица | Колонка | ON DELETE | Проблема | Рекомендация |
|---------|---------|-----------|----------|--------------|
| `tasks` | `project_id` | NO ACTION | 🔴 Блокирует удаление | CASCADE (удалять задачи) |
| `time_entries` | `project_id` | NO ACTION | 🔴 Блокирует удаление | RESTRICT (правильно) |
| `project_phases` | `project_id` | CASCADE | ✅ Правильно | - |
| `project_members` | `project_id` | CASCADE | ✅ Правильно | - |

**🔴 КРИТИЧНАЯ ПРОБЛЕМА:**
Невозможно удалить project если у него есть tasks.

**Решение:** 
- Либо CASCADE (удалять tasks вместе с project)
- Либо Soft delete для projects

---

### 3️⃣ **tasks**

#### Исходящие FK:
| Колонка | Ссылка на | ON DELETE | Статус | Рекомендация |
|---------|-----------|-----------|--------|--------------|
| `project_id` | `projects.id` | NO ACTION | 🔴 | CASCADE или RESTRICT |
| `assignee_id` | `employees.id` | NO ACTION | ⚠️ | SET NULL |

#### Входящие FK:
| Таблица | Колонка | ON DELETE | Проблема | Рекомендация |
|---------|---------|-----------|----------|--------------|
| `time_entries` | `task_id` | CASCADE | ✅ Правильно | - |

**✅ Хорошо настроено** - time_entries удаляются вместе с task.

---

### 4️⃣ **time_entries**

#### Исходящие FK:
| Колонка | Ссылка на | ON DELETE | Статус | Рекомендация |
|---------|-----------|-----------|--------|--------------|
| `employee_id` | `employees.id` | NO ACTION | ✅ | RESTRICT (правильно) |
| `project_id` | `projects.id` | NO ACTION | ✅ | RESTRICT (правильно) |
| `task_id` | `tasks.id` | CASCADE | ⚠️ | SET NULL лучше |
| `approved_by` | `employees.id` | NO ACTION | ⚠️ | SET NULL |
| `phase_id` | ❌ **НИЧЕГО!** | - | 🔴 | **ДОБАВИТЬ FK** |

#### Входящие FK:
| Таблица | Колонка | ON DELETE | Проблема | Рекомендация |
|---------|---------|-----------|----------|--------------|
| `approval_workflows` | `time_entry_id` | CASCADE | ✅ Правильно | - |

**🔴 КРИТИЧНАЯ ПРОБЛЕМА:**
- Есть колонка `phase_id`, но нет FK к `project_phases`
- При удалении task удаляются time_entries → потеря данных!

---

### 5️⃣ **directions**

#### Входящие FK:
| Таблица | Колонка | ON DELETE | Проблема | Рекомендация |
|---------|-----------|-----------|----------|--------------|
| `employees` | `direction_id` | NO ACTION | 🔴 Блокирует удаление | SET NULL |
| `projects` | `direction_id` | NO ACTION | 🔴 Блокирует удаление | SET NULL |

**🔴 ПРОБЛЕМА:**
Невозможно удалить direction если есть сотрудники или проекты.

**Решение:** Либо SET NULL, либо Soft delete.

---

## 🚨 КРИТИЧНЫЕ ПРОБЛЕМЫ (требуют немедленного исправления)

### 1. **Отсутствует FK: employees.user_id → auth.user.id**
**Риск:** HIGH  
**Проблема:** Можно создать employee с несуществующим user_id  
**Решение:**
```sql
ALTER TABLE employees 
ADD CONSTRAINT fk_employees_user_id 
FOREIGN KEY (user_id) 
REFERENCES auth."user"(id) 
ON DELETE CASCADE;
```

### 2. **Отсутствует FK: time_entries.phase_id → project_phases.id**
**Риск:** HIGH  
**Проблема:** Колонка существует, но не связана с таблицей  
**Решение:**
```sql
ALTER TABLE time_entries 
ADD CONSTRAINT fk_time_entries_phase_id 
FOREIGN KEY (phase_id) 
REFERENCES project_phases(id) 
ON DELETE SET NULL;
```

### 3. **Невозможно удалить employees из-за множества NO ACTION**
**Риск:** MEDIUM  
**Проблема:** Блокируется удаление сотрудников  
**Решение:** Реализовать soft delete (колонка `deleted_at`)

### 4. **Невозможно удалить projects из-за tasks (NO ACTION)**
**Риск:** MEDIUM  
**Проблема:** Блокируется удаление проектов  
**Решение:** Либо CASCADE, либо soft delete

### 5. **time_entries.task_id → CASCADE удаление**
**Риск:** HIGH (потеря данных)  
**Проблема:** При удалении задачи удаляются все часы  
**Решение:** 
```sql
ALTER TABLE time_entries 
DROP CONSTRAINT time_entries_task_id_fkey,
ADD CONSTRAINT time_entries_task_id_fkey 
FOREIGN KEY (task_id) 
REFERENCES tasks(id) 
ON DELETE SET NULL;
```

---

## ⚠️ ПРЕДУПРЕЖДЕНИЯ (рекомендуется исправить)

1. **directions → employees/projects (NO ACTION)**  
   Рекомендация: SET NULL

2. **employees → tasks.assignee_id (NO ACTION)**  
   Рекомендация: SET NULL

3. **employees → projects.manager_id (NO ACTION)**  
   Рекомендация: SET NULL

4. **employees → time_entries.approved_by (NO ACTION)**  
   Рекомендация: SET NULL

5. **employees → approval_workflows.approver_id (NO ACTION)**  
   Рекомендация: SET NULL

6. **employees → comments.author_id (NO ACTION)**  
   Рекомендация: SET NULL + сохранять имя автора

7. **employees → activity_log.employee_id (NO ACTION)**  
   Рекомендация: SET NULL + сохранять для аудита

8. **employees → settings.updated_by (NO ACTION)**  
   Рекомендация: SET NULL

---

## 📋 РЕКОМЕНДУЕМЫЕ ИЗМЕНЕНИЯ

### **Миграция 010: Улучшение целостности данных**

```sql
-- Migration 010: Data Integrity Improvements
-- Priority: P0 - CRITICAL
-- Impact: HIGH (data safety)

-- 1. Добавить FK для employees.user_id
ALTER TABLE employees 
DROP CONSTRAINT IF EXISTS fk_employees_user_id;

ALTER TABLE employees 
ADD CONSTRAINT fk_employees_user_id 
FOREIGN KEY (user_id) 
REFERENCES auth."user"(id) 
ON DELETE CASCADE;

-- 2. Добавить FK для time_entries.phase_id (если используется)
ALTER TABLE time_entries 
DROP CONSTRAINT IF EXISTS fk_time_entries_phase_id;

ALTER TABLE time_entries 
ADD CONSTRAINT fk_time_entries_phase_id 
FOREIGN KEY (phase_id) 
REFERENCES project_phases(id) 
ON DELETE SET NULL;

-- 3. Изменить time_entries.task_id: CASCADE → SET NULL
ALTER TABLE time_entries 
DROP CONSTRAINT IF EXISTS time_entries_task_id_fkey;

ALTER TABLE time_entries 
ADD CONSTRAINT time_entries_task_id_fkey 
FOREIGN KEY (task_id) 
REFERENCES tasks(id) 
ON DELETE SET NULL;

-- 4. Изменить tasks.project_id: NO ACTION → CASCADE
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES projects(id) 
ON DELETE CASCADE;

-- 5. Изменить audit таблицы на SET NULL для сохранения истории
ALTER TABLE activity_log 
DROP CONSTRAINT IF EXISTS activity_log_employee_id_fkey;

ALTER TABLE activity_log 
ADD CONSTRAINT activity_log_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

ALTER TABLE comments 
DROP CONSTRAINT IF EXISTS comments_author_id_fkey;

ALTER TABLE comments 
ADD CONSTRAINT comments_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

-- 6. Изменить approval_workflows.approver_id → SET NULL
ALTER TABLE approval_workflows 
DROP CONSTRAINT IF EXISTS approval_workflows_approver_id_fkey;

ALTER TABLE approval_workflows 
ADD CONSTRAINT approval_workflows_approver_id_fkey 
FOREIGN KEY (approver_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

-- 7. Изменить time_entries.approved_by → SET NULL
ALTER TABLE time_entries 
DROP CONSTRAINT IF EXISTS time_entries_approved_by_fkey;

ALTER TABLE time_entries 
ADD CONSTRAINT time_entries_approved_by_fkey 
FOREIGN KEY (approved_by) 
REFERENCES employees(id) 
ON DELETE SET NULL;

-- 8. Изменить projects.manager_id → SET NULL
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_manager_id_fkey;

ALTER TABLE projects 
ADD CONSTRAINT projects_manager_id_fkey 
FOREIGN KEY (manager_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

-- 9. Изменить tasks.assignee_id → SET NULL
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_assignee_id_fkey 
FOREIGN KEY (assignee_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

-- 10. Изменить directions связи → SET NULL
ALTER TABLE employees 
DROP CONSTRAINT IF EXISTS employees_direction_id_fkey;

ALTER TABLE employees 
ADD CONSTRAINT employees_direction_id_fkey 
FOREIGN KEY (direction_id) 
REFERENCES directions(id) 
ON DELETE SET NULL;

ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_direction_id_fkey;

ALTER TABLE projects 
ADD CONSTRAINT projects_direction_id_fkey 
FOREIGN KEY (direction_id) 
REFERENCES directions(id) 
ON DELETE SET NULL;

-- 11. Изменить settings.updated_by → SET NULL
ALTER TABLE settings 
DROP CONSTRAINT IF EXISTS settings_updated_by_fkey;

ALTER TABLE settings 
ADD CONSTRAINT settings_updated_by_fkey 
FOREIGN KEY (updated_by) 
REFERENCES employees(id) 
ON DELETE SET NULL;

-- 12. Изменить user_roles.granted_by → SET NULL
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_granted_by_fkey;

ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_granted_by_fkey 
FOREIGN KEY (granted_by) 
REFERENCES employees(id) 
ON DELETE SET NULL;

-- Добавить комментарии
COMMENT ON CONSTRAINT fk_employees_user_id ON employees IS 'Link to auth user - CASCADE delete';
COMMENT ON CONSTRAINT fk_time_entries_phase_id ON time_entries IS 'Optional link to project phase';
COMMENT ON CONSTRAINT time_entries_task_id_fkey ON time_entries IS 'Keep time entries when task deleted';
```

---

## 🎯 SOFT DELETE СТРАТЕГИЯ

### **Рекомендуется для:**
- `employees` (много связей)
- `projects` (важные данные)
- `directions` (базовые справочники)

### **Реализация:**

```sql
-- Добавить deleted_at для soft delete
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE directions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Индексы для фильтрации активных записей
CREATE INDEX IF NOT EXISTS idx_employees_deleted_at ON employees(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_directions_deleted_at ON directions(deleted_at) WHERE deleted_at IS NULL;

-- Комментарии
COMMENT ON COLUMN employees.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN projects.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN directions.deleted_at IS 'Soft delete timestamp - NULL means active';
```

---

## 📊 СТРАТЕГИЯ CASCADE ПРАВИЛ

### **CASCADE (удалять зависимые данные):**
✅ Правильно использовано:
- `project_phases` → CASCADE (фазы не нужны без проекта)
- `project_members` → CASCADE (команда не нужна без проекта)
- `notifications` → CASCADE (уведомления не нужны без пользователя)
- `user_roles` → CASCADE (роли не нужны без пользователя)

🆕 Рекомендуется добавить:
- `tasks` → CASCADE (задачи не нужны без проекта)
- `employees.user_id` → CASCADE (employee не нужен без user)

### **SET NULL (сохранять данные, очищать ссылку):**
🆕 Рекомендуется для audit/history таблиц:
- `activity_log.employee_id`
- `comments.author_id`
- `time_entries.approved_by`
- `time_entries.task_id` (ВАЖНО! Не терять часы)

🆕 Рекомендуется для необязательных связей:
- `tasks.assignee_id`
- `projects.manager_id`
- `employees.direction_id`
- `projects.direction_id`

### **RESTRICT/NO ACTION (запретить удаление):**
✅ Правильно использовано:
- `time_entries.employee_id` → NO ACTION (нельзя удалить сотрудника с часами)
- `time_entries.project_id` → NO ACTION (нельзя удалить проект с часами)

---

## 🔍 ПРОВЕРКА ДАННЫХ

### **Команды для проверки orphaned records:**

```sql
-- Employees без user (после добавления FK это станет невозможным)
SELECT id, full_name, user_id 
FROM employees 
WHERE user_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM auth."user" WHERE id = employees.user_id);

-- Time entries с несуществующим phase_id
SELECT id, date, hours, phase_id 
FROM time_entries 
WHERE phase_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM project_phases WHERE id = time_entries.phase_id);

-- Tasks с несуществующим project_id
SELECT id, name, project_id 
FROM tasks 
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE id = tasks.project_id);

-- Employees с несуществующим direction_id
SELECT id, full_name, direction_id 
FROM employees 
WHERE direction_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM directions WHERE id = employees.direction_id);
```

---

## 📈 METRICS & MONITORING

### **Рекомендуется отслеживать:**

1. **Количество orphaned records** (должно быть 0)
2. **Количество soft-deleted записей** (для очистки старых данных)
3. **Количество CASCADE удалений** (для аудита)
4. **Время выполнения CASCADE операций** (для оптимизации)

### **Dashboard metrics:**
```sql
-- Orphaned records check
SELECT 
  'employees' as table_name,
  COUNT(*) as orphaned_count
FROM employees 
WHERE user_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM auth."user" WHERE id = employees.user_id)
UNION ALL
-- добавить другие проверки
```

---

## 🎯 ПРИОРИТЕТЫ ИСПРАВЛЕНИЯ

### **P0 - Критично (делать СЕЙЧАС):**
1. ✅ Добавить FK: `employees.user_id` → `auth.user.id`
2. ✅ Добавить FK: `time_entries.phase_id` → `project_phases.id`
3. ✅ Изменить: `time_entries.task_id` CASCADE → SET NULL
4. ✅ Проверить orphaned records

### **P1 - Важно (на этой неделе):**
5. ✅ Изменить audit таблицы на SET NULL
6. ✅ Изменить необязательные связи на SET NULL
7. ✅ Добавить soft delete для employees, projects, directions
8. ✅ Обновить API для учета deleted_at

### **P2 - Желательно (в следующем спринте):**
9. Добавить unit tests для FK constraints
10. Создать monitoring dashboard для orphaned records
11. Документировать все CASCADE правила
12. Создать backup стратегию перед массовыми удалениями
13. Добавить confirmation dialogs для CASCADE удалений в UI

---

## 📝 ВЫВОДЫ И РЕКОМЕНДАЦИИ

### ✅ **Что работает хорошо:**
1. Базовая структура таблиц логична
2. CASCADE правила для "владеющих" связей настроены правильно
3. Уникальные ограничения на месте

### 🔴 **Что требует срочного исправления:**
1. Отсутствующие FK (employees.user_id, time_entries.phase_id)
2. Неправильные CASCADE правила (потеря данных)
3. NO ACTION на audit таблицах (блокировка удаления)

### 🎯 **Следующие шаги:**
1. Создать миграцию 010 с исправлениями FK
2. Применить миграцию на DEV
3. Протестировать удаление entities
4. Применить на PROD
5. Обновить документацию

---

**Оценка после исправлений:** 9/10  
**Timeline:** 2-3 дня  
**Risk Level:** MEDIUM (нужно тестирование)

---

**Автор:** AI Architect  
**Дата:** 2024-10-15  
**Версия:** 1.0

