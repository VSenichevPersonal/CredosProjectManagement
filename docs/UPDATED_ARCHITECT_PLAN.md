# 🏗️ Обновлённый план архитектора (с учётом модели целостности)

**Дата обновления:** 2024-10-15  
**Основа:** SENIOR_ARCHITECT_TASKS.md + DATA_INTEGRITY_MODEL.md  
**Статус:** 🎯 Готов к исполнению

---

## 📊 ИЗМЕНЕНИЯ В ПРИОРИТЕТАХ

### **Было (старый план):**
1. P0: Edit operations ✅ DONE
2. P0: Auth-employee linking ✅ DONE
3. P0: Batch operations 🔄 DEFERRED
4. P1: React Query ✅ DONE
5. P1: Server-side search
6. P1: Client-side validation
7. P1: Error handling

### **Стало (новый план с учётом целостности данных):**
1. P0: Edit operations ✅ DONE
2. P0: Auth-employee linking ✅ DONE
3. **P0: Data Integrity (НОВОЕ!) 🔴 КРИТИЧНО**
4. P1: React Query ✅ DONE
5. P1: Soft Delete (ПОДНЯТО с P2)
6. P1: Server-side search
7. P1: Client-side validation
8. P1: Error handling

---

## 🔴 P0 - КРИТИЧНЫЕ ЗАДАЧИ (ДОБАВЛЕНО)

### ⚠️ **НОВОЕ: Data Integrity Improvements**
**Priority:** P0 - CRITICAL  
**Effort:** 1-2 дня  
**Impact:** VERY HIGH (data safety)  
**Почему P0:** Риск потери данных и orphaned records

#### **Проблемы найдены:**
1. ❌ Нет FK: `employees.user_id` → `auth.user.id` → можно создать employee с фейковым user_id
2. ❌ Нет FK: `time_entries.phase_id` → `project_phases.id` → orphaned data
3. 🔥 Неправильный CASCADE: `time_entries.task_id` CASCADE → теряем часы при удалении задачи
4. 🚫 NO ACTION блокирует удаление: employees, projects, directions
5. ⚠️ Audit таблицы с NO ACTION → невозможно удалить пользователей

#### **Что сделать:**

**1. Создать миграцию 010_data_integrity.sql:**

```sql
-- 🔴 КРИТИЧНО: Добавить FK для employees.user_id
ALTER TABLE employees 
ADD CONSTRAINT fk_employees_user_id 
FOREIGN KEY (user_id) 
REFERENCES auth."user"(id) 
ON DELETE CASCADE;

-- 🔴 КРИТИЧНО: Добавить FK для time_entries.phase_id
ALTER TABLE time_entries 
ADD CONSTRAINT fk_time_entries_phase_id 
FOREIGN KEY (phase_id) 
REFERENCES project_phases(id) 
ON DELETE SET NULL;

-- 🔥 КРИТИЧНО: Изменить CASCADE на SET NULL для time_entries.task_id
-- (Чтобы не терять часы при удалении задачи)
ALTER TABLE time_entries 
DROP CONSTRAINT time_entries_task_id_fkey,
ADD CONSTRAINT time_entries_task_id_fkey 
FOREIGN KEY (task_id) 
REFERENCES tasks(id) 
ON DELETE SET NULL;

-- ✅ Правильно: tasks удаляются вместе с project
ALTER TABLE tasks 
DROP CONSTRAINT tasks_project_id_fkey,
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) 
REFERENCES projects(id) 
ON DELETE CASCADE;

-- 📋 Audit таблицы: SET NULL для сохранения истории
ALTER TABLE activity_log 
DROP CONSTRAINT activity_log_employee_id_fkey,
ADD CONSTRAINT activity_log_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

ALTER TABLE comments 
DROP CONSTRAINT comments_author_id_fkey,
ADD CONSTRAINT comments_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

-- 👤 Необязательные связи: SET NULL
ALTER TABLE tasks 
DROP CONSTRAINT tasks_assignee_id_fkey,
ADD CONSTRAINT tasks_assignee_id_fkey 
FOREIGN KEY (assignee_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

ALTER TABLE projects 
DROP CONSTRAINT projects_manager_id_fkey,
ADD CONSTRAINT projects_manager_id_fkey 
FOREIGN KEY (manager_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

ALTER TABLE time_entries 
DROP CONSTRAINT time_entries_approved_by_fkey,
ADD CONSTRAINT time_entries_approved_by_fkey 
FOREIGN KEY (approved_by) 
REFERENCES employees(id) 
ON DELETE SET NULL;

ALTER TABLE approval_workflows 
DROP CONSTRAINT approval_workflows_approver_id_fkey,
ADD CONSTRAINT approval_workflows_approver_id_fkey 
FOREIGN KEY (approver_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

-- 🏢 Directions: SET NULL (справочники)
ALTER TABLE employees 
DROP CONSTRAINT employees_direction_id_fkey,
ADD CONSTRAINT employees_direction_id_fkey 
FOREIGN KEY (direction_id) 
REFERENCES directions(id) 
ON DELETE SET NULL;

ALTER TABLE projects 
DROP CONSTRAINT projects_direction_id_fkey,
ADD CONSTRAINT projects_direction_id_fkey 
FOREIGN KEY (direction_id) 
REFERENCES directions(id) 
ON DELETE SET NULL;

-- ⚙️ Settings: SET NULL
ALTER TABLE settings 
DROP CONSTRAINT settings_updated_by_fkey,
ADD CONSTRAINT settings_updated_by_fkey 
FOREIGN KEY (updated_by) 
REFERENCES employees(id) 
ON DELETE SET NULL;

ALTER TABLE user_roles 
DROP CONSTRAINT user_roles_granted_by_fkey,
ADD CONSTRAINT user_roles_granted_by_fkey 
FOREIGN KEY (granted_by) 
REFERENCES employees(id) 
ON DELETE SET NULL;
```

**2. Проверить orphaned records ПЕРЕД применением FK:**

```sql
-- Проверка employees без user
SELECT id, full_name, user_id 
FROM employees 
WHERE user_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM auth."user" WHERE id = employees.user_id);

-- Проверка time_entries с несуществующим phase_id
SELECT id, date, hours, phase_id 
FROM time_entries 
WHERE phase_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM project_phases WHERE id = time_entries.phase_id);
```

**3. Очистить orphaned records (если найдутся):**
```sql
-- Либо исправить user_id, либо установить NULL
UPDATE employees 
SET user_id = NULL 
WHERE user_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM auth."user" WHERE id = employees.user_id);

-- Либо исправить phase_id, либо установить NULL
UPDATE time_entries 
SET phase_id = NULL 
WHERE phase_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM project_phases WHERE id = time_entries.phase_id);
```

**Acceptance Criteria:**
- [x] Миграция 010 создана
- [ ] Проверены orphaned records
- [ ] Очищены orphaned records (если есть)
- [ ] Миграция применена на DEV
- [ ] Протестировано удаление entities
- [ ] Миграция применена на PROD
- [ ] Обновлена документация

---

## 🟡 P1 - ВАЖНЫЕ ЗАДАЧИ (ОБНОВЛЕНО)

### **1. Soft Delete для критичных таблиц** 🆕 (ПОДНЯТО с P2)
**Priority:** P1 - HIGH  
**Effort:** 1 день  
**Impact:** HIGH (UX + data safety)  
**Почему P1:** После исправления FK станет понятно, что удалять напрямую рискованно

**Что сделать:**

**Миграция 011_soft_delete.sql:**
```sql
-- Добавить deleted_at для soft delete
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE directions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Индексы для фильтрации активных записей
CREATE INDEX IF NOT EXISTS idx_employees_deleted_at ON employees(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_directions_deleted_at ON directions(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at) WHERE deleted_at IS NULL;

-- Комментарии
COMMENT ON COLUMN employees.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN projects.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN directions.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN tasks.deleted_at IS 'Soft delete timestamp - NULL means active';
```

**Обновить API (все DELETE endpoints):**
```typescript
// Вместо DELETE FROM ... WHERE id = $1
// Использовать:
UPDATE projects 
SET deleted_at = NOW() 
WHERE id = $1 AND deleted_at IS NULL;

// Во всех SELECT запросах добавить:
WHERE deleted_at IS NULL
```

**Обновить React Query hooks:**
```typescript
// use-projects.ts
export function useDeleteProject() {
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete вместо hard delete
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE', // API обрабатывает как soft delete
      });
      if (!response.ok) throw new Error();
    },
    // ... optimistic updates
  });
}
```

**Добавить "Restore" функционал:**
```typescript
// Для админов - возможность восстановить удалённые
export function useRestoreProject() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/projects/${id}/restore`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error();
    },
  });
}
```

**Acceptance Criteria:**
- [ ] Миграция 011 создана и применена
- [ ] Все DELETE API endpoints обновлены на soft delete
- [ ] Все SELECT запросы фильтруют deleted_at IS NULL
- [ ] React Query hooks обновлены
- [ ] UI показывает только активные записи
- [ ] (Опционально) Админская страница для восстановления

---

### **2. Server-side search и filtering** (без изменений)
**Priority:** P1 - HIGH  
**Effort:** 2-3 дня  
**Impact:** MEDIUM

**Зависимость:** После soft delete нужно учитывать `deleted_at`

```typescript
GET /api/projects?search=audit&status=active&directionId=123&page=1&limit=20&includeDeleted=false
```

```sql
WHERE name ILIKE '%search%' 
  AND status = 'active'
  AND direction_id = '...'
  AND deleted_at IS NULL  -- ← НОВОЕ!
```

**Acceptance Criteria:**
- [ ] Поиск работает на backend
- [ ] Учитывается deleted_at
- [ ] Pagination работает
- [ ] Total count корректен

---

### **3. Client-side validation (Zod)** (без изменений)
**Priority:** P1 - HIGH  
**Effort:** 1-2 дня  
**Impact:** MEDIUM

**Что сделать:**
```typescript
// src/lib/validators/project.ts
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(3, 'Минимум 3 символа').max(200),
  code: z.string().max(50).optional(),
  description: z.string().optional(),
  directionId: z.string().uuid('Некорректный UUID'),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalBudget: z.number().min(0, 'Бюджет не может быть отрицательным').optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// В компоненте:
const handleSubmit = () => {
  const result = createProjectSchema.safeParse(formData);
  if (!result.success) {
    const errors = result.error.flatten();
    setFieldErrors(errors.fieldErrors);
    return;
  }
  // Отправка данных
  createProject.mutate(result.data);
};
```

**Acceptance Criteria:**
- [ ] Zod schemas для всех entities
- [ ] Real-time валидация в формах
- [ ] Ошибки под полями
- [ ] Shared schemas между frontend/backend

---

### **4. Улучшить обработку ошибок** (без изменений)
**Priority:** P1 - HIGH  
**Effort:** 1 день  
**Impact:** MEDIUM

**Что сделать:**
```typescript
// src/lib/errors/app-errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} не найден`, 404, 'NOT_FOUND');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Доступ запрещён') {
    super(message, 403, 'FORBIDDEN');
  }
}

// В API:
import { ValidationError, NotFoundError } from '@/lib/errors/app-errors';

if (!project) {
  throw new NotFoundError('Проект');
}

// Error handler middleware
export function errorHandler(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  // Логирование неожиданных ошибок
  logger.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Внутренняя ошибка сервера' },
    { status: 500 }
  );
}
```

**Acceptance Criteria:**
- [ ] Custom error classes созданы
- [ ] API использует custom errors
- [ ] Frontend обрабатывает разные типы ошибок
- [ ] Error boundary в React
- [ ] Логирование ошибок

---

## 🟢 P2 - СРЕДНИЕ ЗАДАЧИ (без изменений приоритета)

### **5. Unit & Integration тесты**
**Priority:** P2 - MEDIUM  
**Effort:** 3-5 дней  
**Impact:** HIGH (quality)

**Новое:** Добавить тесты для FK constraints

```typescript
// tests/api/projects.test.ts
describe('Projects API - Data Integrity', () => {
  it('should not allow creating project with invalid direction_id', async () => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Project',
        directionId: 'fake-uuid',
      }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining('direction'),
    });
  });

  it('should CASCADE delete tasks when project deleted', async () => {
    const project = await createProject();
    const task = await createTask({ projectId: project.id });
    
    await deleteProject(project.id);
    
    const taskExists = await taskExists(task.id);
    expect(taskExists).toBe(false);
  });

  it('should SET NULL on task_id when task deleted', async () => {
    const task = await createTask();
    const timeEntry = await createTimeEntry({ taskId: task.id });
    
    await deleteTask(task.id);
    
    const updatedEntry = await getTimeEntry(timeEntry.id);
    expect(updatedEntry.task_id).toBeNull();
  });
});
```

---

### **6-13. Остальные P2 задачи** (без изменений)
- Activity log
- Notifications
- Database transactions
- Connection pooling
- Batch operations
- Access control (RBAC)
- Performance optimization
- Documentation

---

## 📋 ОБНОВЛЁННЫЙ ROADMAP

### **Неделя 1 (СРОЧНО):**
- [x] ~~P0: Edit operations~~ ✅ DONE
- [x] ~~P0: Auth-employee linking~~ ✅ DONE
- [x] ~~P1: React Query~~ ✅ DONE
- [ ] **P0: Data Integrity (миграция 010)** 🔴
- [ ] **P1: Soft Delete (миграция 011)**

### **Неделя 2:**
- [ ] P1: Server-side search
- [ ] P1: Client validation (Zod)
- [ ] P1: Error handling

### **Неделя 3:**
- [ ] P2: Unit tests (особенно FK constraints)
- [ ] P2: Activity log
- [ ] P2: Notifications

### **Неделя 4:**
- [ ] P2: Database transactions
- [ ] P2: Connection pooling
- [ ] P2: Performance optimization

---

## 🎯 КЛЮЧЕВЫЕ ИЗМЕНЕНИЯ

| Задача | Было | Стало | Причина |
|--------|------|-------|---------|
| Data Integrity | P2 или не было | **P0** 🔴 | Риск потери данных |
| Soft Delete | P2 | **P1** | Необходимо после FK fixes |
| Server search | P1 | P1 | Нужно учесть deleted_at |
| Tests | P2 | P2 | Но добавить FK tests |

---

## 📊 МЕТРИКИ УСПЕХА

**После Data Integrity (P0):**
- ✅ 0 orphaned records
- ✅ Все FK установлены правильно
- ✅ CASCADE правила логичны
- ✅ Невозможно удалить employee с time_entries (RESTRICT)
- ✅ Audit таблицы сохраняют историю (SET NULL)

**После Soft Delete (P1):**
- ✅ Пользователи не видят удалённые записи
- ✅ Админы могут восстановить удалённое
- ✅ Нет потери данных при случайном удалении
- ✅ Compliance: хранение данных для аудита

**После всех P1 задач:**
- ✅ Быстрый поиск (< 500ms)
- ✅ 0 валидационных ошибок на backend
- ✅ User-friendly error messages
- ✅ 100% uptime

---

## 🚀 СЛЕДУЮЩИЕ ШАГИ

1. **СЕЙЧАС:** Создать и применить миграцию 010 (Data Integrity)
2. **СЕГОДНЯ:** Проверить все orphaned records
3. **ЗАВТРА:** Создать и применить миграцию 011 (Soft Delete)
4. **ЭТА НЕДЕЛЯ:** Обновить все API endpoints для soft delete
5. **СЛЕДУЮЩАЯ НЕДЕЛЯ:** Server-side search + validation

---

**Оценка после всех P0+P1:** 9.5/10  
**Timeline:** 2-3 недели  
**Risk Level:** LOW (с правильным тестированием)

---

**Автор:** AI Senior Architect  
**Дата:** 2024-10-15  
**Версия:** 2.0 (updated with data integrity model)

