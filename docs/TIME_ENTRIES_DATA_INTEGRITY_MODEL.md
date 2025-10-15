# 📊 Модель целостности данных таймшита (Time Entries)

## 🎯 Цель документа
Централизованное описание модели данных `time_entries`, foreign keys, constraints и бизнес-правил.

---

## 📋 Схема таблицы

```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES project_phases(id), -- Опционально
  date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'submitted',
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_time_entries_hours CHECK (hours > 0 AND hours <= 24),
  CONSTRAINT chk_time_entries_date CHECK (date <= CURRENT_DATE),
  CONSTRAINT chk_time_entries_status CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'))
);
```

---

## 🔗 Foreign Keys

### 1. `employee_id` → `employees(id)`
- **Обязательное поле** (NOT NULL)
- Определяет сотрудника, который выполнил работу
- **ON DELETE**: По умолчанию RESTRICT (нельзя удалить сотрудника с time entries)
- **Бизнес-правило**: Сотрудник должен быть активен (`is_active = true`) при создании записи

### 2. `project_id` → `projects(id)`
- **Обязательное поле** (NOT NULL)
- Определяет проект, на котором выполнялась работа
- **ON DELETE**: По умолчанию RESTRICT
- **Бизнес-правило**: Проект должен быть в статусе 'active' или 'planning' при создании записи

### 3. `task_id` → `tasks(id)`
- **Опциональное поле** (может быть NULL для общих работ по проекту)
- Определяет конкретную задачу
- **ON DELETE CASCADE**: При удалении задачи, связанные time entries тоже удаляются
- **Бизнес-правило**: Если указан task_id, то task.project_id должен совпадать с time_entry.project_id

### 4. `phase_id` → `project_phases(id)`
- **Опциональное поле** (может быть NULL)
- Определяет фазу проекта
- **ON DELETE**: По умолчанию RESTRICT
- **Бизнес-правило**: Если указан phase_id, то phase.project_id должен совпадать с time_entry.project_id

### 5. `approved_by` → `employees(id)`
- **Опциональное поле** (заполняется при утверждении)
- Определяет кто утвердил или отклонил запись
- **ON DELETE**: По умолчанию RESTRICT
- **Бизнес-правило**: approved_by должен быть руководителем проекта (project.manager_id) или иметь право `time_entries:approve`

---

## ✅ Constraints (проверки целостности)

### 1. `chk_time_entries_hours`
```sql
CHECK (hours > 0 AND hours <= 24)
```
- **Цель**: Предотвратить невалидные значения часов
- **Правило**: Часы должны быть положительными и не превышать 24 часа в день
- **Рекомендация**: В UI использовать шаг 0.25 (15 минут) для удобства

### 2. `chk_time_entries_date`
```sql
CHECK (date <= CURRENT_DATE)
```
- **Цель**: Запретить записи времени в будущем
- **Правило**: Дата не может быть больше текущей даты
- **Исключение**: Админы могут редактировать исторические данные

### 3. `chk_time_entries_status`
```sql
CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'))
```
- **Цель**: Обеспечить валидные статусы
- **Правило**: Статус может быть только одним из перечисленных
- **Workflow**: draft → submitted → [approved | rejected]

---

## 🔄 Workflow (жизненный цикл записи)

```
┌─────────────────┐
│ 1. draft        │ ← Сотрудник создаёт черновик
│ (необязательно) │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ 2. submitted    │ ← Сотрудник отправляет на утверждение
│                 │
└────────┬────────┘
         │
         v
    ┌────┴────┐
    │         │
    v         v
┌─────────┐ ┌──────────┐
│3.approved│ │4.rejected│ ← Руководитель утверждает или отклоняет
└─────────┘ └──────────┘
```

### Переходы между статусами:
1. **draft → submitted**: Сотрудник отправляет на проверку
2. **submitted → approved**: Руководитель утверждает (требует `time_entries:approve` permission)
3. **submitted → rejected**: Руководитель отклоняет с указанием причины (`rejection_reason`)
4. **rejected → submitted**: Сотрудник исправляет и отправляет повторно
5. **approved → rejected**: Может быть откат с указанием причины (требует admin)

---

## 🔐 Права доступа (Permissions)

### Чтение (`time_entries:read`)
- **admin**: Видит все записи
- **manager**: Видит все записи в своих проектах
- **employee**: Видит только свои записи

### Создание (`time_entries:create`)
- **admin**: Может создавать от имени любого сотрудника
- **manager**: Может создавать от имени любого сотрудника в своих проектах
- **employee**: Может создавать только свои записи

### Обновление (`time_entries:update`)
- **admin**: Может редактировать любые записи
- **manager**: Может редактировать записи в своих проектах (если не approved)
- **employee**: Может редактировать только свои записи в статусе 'draft' или 'rejected'

### Удаление (`time_entries:delete`)
- **admin**: Может удалять любые записи
- **manager**: Может удалять записи в своих проектах (если не approved)
- **employee**: Может удалять только свои записи в статусе 'draft'

### Утверждение (TODO: добавить `time_entries:approve` в permissions.ts)
- **admin**: Может утверждать любые записи
- **manager**: Может утверждать записи только в своих проектах

---

## 🔍 Индексы для производительности

```sql
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_employee_date ON time_entries(employee_id, date);
CREATE INDEX idx_time_entries_project_date ON time_entries(project_id, date);
CREATE INDEX idx_time_entries_status ON time_entries(status);
```

### Объяснение:
1. **idx_time_entries_task_id**: Быстрый поиск времени по задаче
2. **idx_time_entries_employee_date**: Быстрый поиск времени сотрудника за период (для таймшита)
3. **idx_time_entries_project_date**: Быстрый поиск времени по проекту за период (для отчётов)
4. **idx_time_entries_status**: Быстрый поиск записей по статусу (для утверждений)

---

## 📊 Бизнес-правила (Business Rules)

### 1. Уникальность записей (рекомендация)
**Правило**: Один сотрудник может иметь несколько записей на один день, но для одной задачи должна быть только одна запись.

```sql
-- Опциональный UNIQUE constraint:
UNIQUE(employee_id, task_id, date) WHERE task_id IS NOT NULL
```

### 2. Лимит часов в день
**Правило**: Сумма всех `hours` для одного `employee_id` за один `date` не должна превышать 24 часа.

**Реализация**: Проверка на уровне приложения (не constraint в БД):
```typescript
const totalHours = await db.query(`
  SELECT SUM(hours) as total
  FROM time_entries
  WHERE employee_id = $1 AND date = $2
`, [employeeId, date])

if (totalHours + newEntry.hours > 24) {
  throw new Error('Total hours exceed 24 hours per day')
}
```

### 3. Привязка к активным проектам
**Правило**: Нельзя создавать записи времени для проектов в статусе 'completed' или 'cancelled'.

**Реализация**: Проверка на уровне приложения:
```typescript
const project = await db.projects.getById(projectId)
if (project.status === 'completed' || project.status === 'cancelled') {
  throw new Error('Cannot log time to completed or cancelled project')
}
```

### 4. Валидация employee-project-task
**Правило**: Если указан `task_id`, то `task.project_id` должен совпадать с `time_entry.project_id`.

**Реализация**: Foreign key constraint + проверка на уровне приложения:
```typescript
const task = await db.tasks.getById(taskId)
if (task.projectId !== projectId) {
  throw new Error('Task does not belong to the specified project')
}
```

### 5. Групповые утверждения (Batch Approvals)
**Правило**: Руководитель проекта может утвердить/отклонить несколько записей одновременно.

**Реализация**: Через таблицу `batch_approvals` (см. схему в `updated-database-schema.md`):
```sql
CREATE TABLE batch_approvals (
  id UUID PRIMARY KEY,
  approver_id UUID REFERENCES employees(id),
  project_id UUID REFERENCES projects(id),
  approval_type VARCHAR(20) DEFAULT 'time_entries',
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Связь с time_entries через промежуточную таблицу
CREATE TABLE batch_approval_items (
  batch_id UUID REFERENCES batch_approvals(id) ON DELETE CASCADE,
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE,
  PRIMARY KEY (batch_id, time_entry_id)
);
```

---

## 🛠️ Триггеры (Triggers)

### 1. Авто-обновление `updated_at`
```sql
CREATE OR REPLACE FUNCTION update_time_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_time_entries_updated_at();
```

### 2. Валидация при утверждении (рекомендация)
```sql
CREATE OR REPLACE FUNCTION validate_time_entry_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- При утверждении должен быть указан approved_by
  IF NEW.status = 'approved' AND NEW.approved_by IS NULL THEN
    RAISE EXCEPTION 'approved_by is required when status is approved';
  END IF;
  
  -- При отклонении должна быть указана причина
  IF NEW.status = 'rejected' AND NEW.rejection_reason IS NULL THEN
    RAISE EXCEPTION 'rejection_reason is required when status is rejected';
  END IF;
  
  -- Установить approved_at при первом утверждении
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.approved_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_time_entry_approval_validation
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  WHEN (NEW.status != OLD.status)
  EXECUTE FUNCTION validate_time_entry_approval();
```

---

## 🔧 Рекомендации по улучшению

### 1. Добавить soft delete
```sql
ALTER TABLE time_entries ADD COLUMN deleted_at TIMESTAMP;
CREATE INDEX idx_time_entries_deleted_at ON time_entries(deleted_at);
```

### 2. Добавить audit trail (история изменений)
```sql
CREATE TABLE time_entries_audit (
  id UUID PRIMARY KEY,
  time_entry_id UUID,
  changed_by UUID REFERENCES employees(id),
  change_type VARCHAR(20), -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Добавить поддержку комментариев к записям
- Использовать таблицу `comments` из схемы (уже есть в миграции 007)

### 4. Добавить поддержку блокировки периодов
```sql
CREATE TABLE time_period_locks (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  locked_by UUID REFERENCES employees(id),
  locked_at TIMESTAMP DEFAULT NOW(),
  reason TEXT,
  
  CONSTRAINT chk_period_dates CHECK (start_date <= end_date)
);
```

---

## 📚 Связанные документы
- [Updated Database Schema](./updated-database-schema.md)
- [Access Control & Permissions](../src/lib/access-control/permissions.ts)
- [Data Integrity Model V3](./DATA_INTEGRITY_MODEL_V3.md)

---

**Дата создания**: 2025-10-15  
**Последнее обновление**: 2025-10-15  
**Автор**: AI Architect

