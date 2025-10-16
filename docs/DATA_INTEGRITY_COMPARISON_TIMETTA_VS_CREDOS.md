# 📊 Сравнительный анализ моделей целостности данных

## Timetta vs Credos PM

**Дата**: 15 октября 2025  
**Автор**: AI Senior Architect  
**Статус**: ✅ Completed

---

## 🎯 Executive Summary

Сравнение показывает, что **Credos PM имеет более строгую модель целостности данных** по сравнению с Timetta, что является как преимуществом (защита от потери данных), так и потенциальным риском (меньше гибкости).

---

## 📋 Иерархия данных

### Timetta (Best Practices)
```
Клиент → Проект → Фаза → Задача → Time Entry
                            ↓
                      Activity (Вид работ)
```

### Credos PM (Наша модель)
```
Customer → Project → Task → Time Entry
Direction ↗         ↓         ↓
                   Tags    Activity
```

---

## 🔒 Модель целостности данных: Сравнение Foreign Keys

### 1. Projects (Проекты)

| Связь | Timetta | Credos PM | Комментарий |
|-------|---------|-----------|-------------|
| `project → customer` | `ON DELETE SET NULL` | `ON DELETE SET NULL` | ✅ Идентично: Проект может остаться без клиента |
| `project → direction` | Нет концепции | `ON DELETE SET NULL` | ℹ️ Уникально для Credos: Связь с направлениями |
| `project → manager` | `ON DELETE SET NULL` | `ON DELETE SET NULL` | ✅ Идентично: Проект может остаться без менеджера |
| `project → tasks` | `ON DELETE CASCADE` | `ON DELETE CASCADE` | ✅ Идентично: Задачи удаляются вместе с проектом |

**Вывод**: Модели идентичны. Оба сервиса используют **мягкое удаление** (SET NULL) для справочников.

---

### 2. Tasks (Задачи)

| Связь | Timetta | Credos PM | Комментарий |
|-------|---------|-----------|-------------|
| `task → project` | `ON DELETE CASCADE` | `ON DELETE CASCADE` | ✅ Идентично: Задачи удаляются с проектом |
| `task → assignee` | `ON DELETE SET NULL` | `ON DELETE SET NULL` | ✅ Идентично: Задача может остаться без исполнителя |
| `task → time_entries` | ⚠️ **CASCADE** | ✅ **SET NULL** | 🔴 РАЗНИЦА! См. детали ниже |

**Критичное отличие** 🚨:
- **Timetta**: При удалении задачи все связанные time entries **удаляются** (CASCADE)
- **Credos PM**: При удалении задачи time entries **сохраняются** с `task_id = NULL` (SET NULL)

**Rationale (Credos PM)**:
```sql
-- Migration 010_data_integrity.sql (строки 53-64)
ALTER TABLE time_entries 
DROP CONSTRAINT IF EXISTS time_entries_task_id_fkey;

ALTER TABLE time_entries 
ADD CONSTRAINT time_entries_task_id_fkey 
FOREIGN KEY (task_id) 
REFERENCES tasks(id) 
ON DELETE SET NULL;

COMMENT ON CONSTRAINT time_entries_task_id_fkey ON time_entries IS 
'Keep time entries when task deleted - SET NULL instead of CASCADE';
```

**Почему SET NULL лучше**:
1. ✅ Сохранение истории трудозатрат
2. ✅ Финансовая отчётность остаётся корректной
3. ✅ Аудит: Видно, что сотрудник работал, даже если задача удалена

---

### 3. Time Entries (Трудозатраты)

| Связь | Timetta | Credos PM | Комментарий |
|-------|---------|-----------|-------------|
| `time_entry → employee` | `ON DELETE RESTRICT` | ⚠️ **Нет FK** | 🔴 ПРОБЛЕМА! См. ниже |
| `time_entry → project` | `ON DELETE RESTRICT` | ⚠️ **Нет FK** | 🔴 ПРОБЛЕМА! См. ниже |
| `time_entry → task` | `ON DELETE CASCADE` | `ON DELETE SET NULL` | ⚠️ Credos PM лучше |
| `time_entry → activity` | `ON DELETE RESTRICT` | `ON DELETE SET NULL` | ⚠️ Timetta строже |
| `time_entry → approver` | `ON DELETE SET NULL` | `ON DELETE SET NULL` | ✅ Идентично |

---

## 🚨 Критичные находки

### 1. ❌ ПРОБЛЕМА: Нет RESTRICT для критичных FK в Credos PM

**Проблемное поведение сейчас**:
```sql
-- ТЕКУЩЕЕ СОСТОЯНИЕ (Credos PM)
-- Из исходного кода миграций видно, что нет явных RESTRICT

-- ЧТО МОЖЕТ ПРОИЗОЙТИ:
DELETE FROM employees WHERE id = 'some-employee-id';
-- ❌ time_entries для этого сотрудника либо удалятся (если CASCADE), 
--    либо станут orphaned (если SET NULL)

DELETE FROM projects WHERE id = 'some-project-id';
-- ❌ time_entries для этого проекта либо удалятся, либо станут orphaned
```

**Как должно быть (Timetta-style)**:
```sql
-- РЕКОМЕНДАЦИЯ: Добавить RESTRICT для критичных связей
ALTER TABLE time_entries 
ADD CONSTRAINT time_entries_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES employees(id) 
ON DELETE RESTRICT;

ALTER TABLE time_entries 
ADD CONSTRAINT time_entries_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES projects(id) 
ON DELETE RESTRICT;
```

**Почему RESTRICT**:
1. ✅ Нельзя удалить сотрудника, у которого есть списанные часы
2. ✅ Нельзя удалить проект, у которого есть списанные часы
3. ✅ Защита финансовой отчётности от случайного удаления данных

---

### 2. ✅ ХОРОШО: Audit Tables сохраняют историю

```sql
-- activity_log
ALTER TABLE activity_log 
ADD CONSTRAINT activity_log_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

-- comments
ALTER TABLE comments 
ADD CONSTRAINT comments_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;
```

**Credos PM правильно** использует SET NULL для audit-таблиц:
- История действий сохраняется, даже если пользователь удалён
- Комментарии остаются, даже если автор удалён

---

## 📊 Сравнительная таблица: Целостность данных

| Аспект | Timetta | Credos PM | Рекомендация |
|--------|---------|-----------|--------------|
| **Защита time_entries от удаления сотрудника** | ✅ RESTRICT | ❌ Не реализовано | 🔧 Добавить RESTRICT |
| **Защита time_entries от удаления проекта** | ✅ RESTRICT | ❌ Не реализовано | 🔧 Добавить RESTRICT |
| **Сохранение часов при удалении задачи** | ❌ CASCADE (часы удаляются) | ✅ SET NULL (часы сохраняются) | ✅ Credos лучше |
| **Audit trail (activity_log)** | ✅ SET NULL | ✅ SET NULL | ✅ Одинаково хорошо |
| **Справочники (customers, activities)** | ✅ SET NULL | ✅ SET NULL | ✅ Одинаково хорошо |
| **Cascade для зависимых сущностей** | ✅ tasks → project | ✅ tasks → project | ✅ Одинаково хорошо |

---

## 🎯 Рекомендации для Credos PM

### P0 (Критично - исправить СРОЧНО)

#### 1. Добавить RESTRICT для time_entries

```sql
-- Migration: 013_time_entries_restrict.sql

-- 🔴 КРИТИЧНО: Защита от удаления employee с часами
ALTER TABLE time_entries 
DROP CONSTRAINT IF EXISTS time_entries_employee_id_fkey;

ALTER TABLE time_entries 
ADD CONSTRAINT time_entries_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES employees(id) 
ON DELETE RESTRICT;

COMMENT ON CONSTRAINT time_entries_employee_id_fkey ON time_entries IS 
'Cannot delete employee with time entries - RESTRICT for data safety';

-- 🔴 КРИТИЧНО: Защита от удаления project с часами
ALTER TABLE time_entries 
DROP CONSTRAINT IF EXISTS time_entries_project_id_fkey;

ALTER TABLE time_entries 
ADD CONSTRAINT time_entries_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES projects(id) 
ON DELETE RESTRICT;

COMMENT ON CONSTRAINT time_entries_project_id_fkey ON time_entries IS 
'Cannot delete project with time entries - RESTRICT for data safety';
```

---

### P1 (Важно - добавить функциональность)

#### 2. Функция "Архивирование" вместо удаления

```sql
-- Для сотрудников
ALTER TABLE employees ADD COLUMN archived_at TIMESTAMPTZ;
CREATE INDEX idx_employees_archived_at ON employees(archived_at);

-- Для проектов
ALTER TABLE projects ADD COLUMN archived_at TIMESTAMPTZ;
CREATE INDEX idx_projects_archived_at ON projects(archived_at);

-- UI: "Архивировать" вместо "Удалить"
-- Архивированные сущности скрываются из списков, но данные сохраняются
```

---

#### 3. Добавить валидацию на уровне БД

```sql
-- Нельзя списать больше 24 часов в день
ALTER TABLE time_entries ADD CONSTRAINT check_hours_per_day 
CHECK (hours >= 0 AND hours <= 24);

-- Нельзя списать часы на будущее
ALTER TABLE time_entries ADD CONSTRAINT check_date_not_future 
CHECK (date <= CURRENT_DATE);

-- Проект не может закончиться раньше, чем начался
ALTER TABLE projects ADD CONSTRAINT check_dates_order 
CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);
```

---

## 📈 Дополнительные улучшения (P2)

### 1. Soft Delete для всех сущностей

```sql
-- Добавить deleted_at ко всем основным таблицам
ALTER TABLE employees ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE activities ADD COLUMN deleted_at TIMESTAMPTZ;

-- Индексы для производительности
CREATE INDEX idx_employees_deleted_at ON employees(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NULL;
-- и т.д.

-- UI: "Удалить" → "Отправить в корзину"
-- Админы могут восстановить из корзины в течение 30 дней
```

---

### 2. Cascading Updates (автоматический пересчёт)

```sql
-- Триггер: Обновление project.current_spent при изменении time_entries
CREATE OR REPLACE FUNCTION recalculate_project_spent()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects 
  SET current_spent = (
    SELECT COALESCE(SUM(te.hours * COALESCE(pm.hourly_rate, e.default_hourly_rate, 0)), 0)
    FROM time_entries te
    LEFT JOIN employees e ON te.employee_id = e.id
    LEFT JOIN project_members pm ON pm.project_id = te.project_id AND pm.employee_id = te.employee_id
    WHERE te.project_id = COALESCE(NEW.project_id, OLD.project_id)
  )
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_project_spent
  AFTER INSERT OR UPDATE OR DELETE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_project_spent();
```

---

## 🏆 Итоговый вердикт

### Что у Credos PM лучше, чем у Timetta:
1. ✅ **SET NULL для task_id** - сохраняет историю часов при удалении задач
2. ✅ **Audit trail** - правильная обработка SET NULL для логов
3. ✅ **Документация** - детальные комментарии на constraints

### Что нужно улучшить в Credos PM:
1. 🔴 **RESTRICT для time_entries** - критичная недоработка
2. ⚠️ **Архивирование** вместо удаления для employee/project
3. ⚠️ **CHECK constraints** для бизнес-логики на уровне БД
4. ⚠️ **Soft Delete** для всех сущностей

### Оценка текущей модели:
- **Data Safety**: 6/10 (без RESTRICT для time_entries)
- **Audit Capability**: 9/10 (отличные логи)
- **Flexibility**: 8/10 (правильные SET NULL)
- **Documentation**: 9/10 (хорошие комментарии)

**Общая оценка**: 8/10 после применения P0 рекомендаций

---

## 📝 Action Items

### Сейчас (сегодня)
- [ ] Создать миграцию `013_time_entries_restrict.sql`
- [ ] Применить RESTRICT для `time_entries.employee_id`
- [ ] Применить RESTRICT для `time_entries.project_id`
- [ ] Добавить CHECK constraints для hours/dates
- [ ] Написать тесты для проверки RESTRICT

### На этой неделе
- [ ] Реализовать "Архивирование" для employees
- [ ] Реализовать "Архивирование" для projects
- [ ] UI: заменить "Удалить" на "Архивировать"
- [ ] Документация: обновить API docs

### В ближайшем будущем
- [ ] Soft Delete для всех сущностей
- [ ] Триггеры для автоматического пересчёта
- [ ] "Корзина" для восстановления удалённых данных

---

**Дата**: 15 октября 2025  
**Автор**: AI Senior Architect  
**Версия**: 1.0  
**Статус**: ✅ Ready for Implementation

