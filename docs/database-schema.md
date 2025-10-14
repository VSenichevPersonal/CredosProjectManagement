# 🗄️ Database Schema

## 📋 Обзор

**База данных**: PostgreSQL  
**Хостинг**: Railway  
**Архитектура**: Реляционная с оптимизированными индексами

---

## 🎯 Принципы проектирования

### 1. Нормализация
- **3NF** - третья нормальная форма
- **Устранение дублирования** данных
- **Целостность** связей

### 2. Производительность
- **Индексы** для частых запросов
- **Ограничения** для валидации
- **Партиционирование** больших таблиц (планируется)

### 3. Масштабируемость
- **UUID** вместо auto-increment
- **Timestamp** для аудита
- **Soft delete** для истории

---

## 📊 Схема таблиц

### 1. Направления (directions)

**Назначение**: Бизнес-направления компании (ИБ, ПИБ, ТК, Аудит)

```sql
CREATE TABLE directions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  manager_id UUID,
  budget DECIMAL(15,2),
  color VARCHAR(20) DEFAULT 'blue',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_directions_manager_id ON directions(manager_id);
CREATE INDEX idx_directions_is_active ON directions(is_active);

-- Ограничения
ALTER TABLE directions ADD CONSTRAINT chk_directions_budget 
  CHECK (budget IS NULL OR budget >= 0);
```

**Поля**:
- `id` - уникальный идентификатор
- `name` - название направления (ИБ, ПИБ, ТК, Аудит)
- `description` - описание направления
- `manager_id` - ID руководителя направления
- `budget` - бюджет направления (руб.)
- `color` - цвет для UI (blue, cyan, emerald, orange)
- `is_active` - активность направления
- `created_at` - время создания
- `updated_at` - время обновления

### 2. Сотрудники (employees)

**Назначение**: Сотрудники компании с ролями и подчинением

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  position VARCHAR(200) NOT NULL,
  direction_id UUID REFERENCES directions(id),
  manager_id UUID REFERENCES employees(id),
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_employees_direction_id ON employees(direction_id);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_is_active ON employees(is_active);
CREATE INDEX idx_employees_email ON employees(email);

-- Ограничения
ALTER TABLE employees ADD CONSTRAINT chk_employees_hourly_rate 
  CHECK (hourly_rate >= 0);
```

**Поля**:
- `id` - уникальный идентификатор
- `email` - email сотрудника (уникальный)
- `full_name` - полное имя
- `position` - должность
- `direction_id` - ID направления
- `manager_id` - ID непосредственного руководителя
- `hourly_rate` - почасовая ставка (руб./час)
- `is_active` - активность сотрудника
- `created_at` - время создания
- `updated_at` - время обновления

### 3. Проекты (projects)

**Назначение**: Проекты компании с бюджетом и сроками

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  direction_id UUID REFERENCES directions(id),
  manager_id UUID REFERENCES employees(id),
  status VARCHAR(20) DEFAULT 'active',
  priority VARCHAR(20) DEFAULT 'medium',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_projects_direction_id ON projects(direction_id);
CREATE INDEX idx_projects_manager_id ON projects(manager_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_start_date ON projects(start_date);

-- Ограничения
ALTER TABLE projects ADD CONSTRAINT chk_projects_budget 
  CHECK (budget IS NULL OR budget >= 0);
ALTER TABLE projects ADD CONSTRAINT chk_projects_dates 
  CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date);
ALTER TABLE projects ADD CONSTRAINT chk_projects_status 
  CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled'));
ALTER TABLE projects ADD CONSTRAINT chk_projects_priority 
  CHECK (priority IN ('low', 'medium', 'high', 'critical'));
```

**Поля**:
- `id` - уникальный идентификатор
- `name` - название проекта
- `description` - описание проекта
- `direction_id` - ID направления
- `manager_id` - ID менеджера проекта
- `status` - статус проекта
- `priority` - приоритет проекта
- `start_date` - дата начала
- `end_date` - дата окончания
- `budget` - бюджет проекта (руб.)
- `created_at` - время создания
- `updated_at` - время обновления

### 4. Задачи (tasks)

**Назначение**: Задачи в рамках проектов

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES employees(id),
  status VARCHAR(20) DEFAULT 'todo',
  priority VARCHAR(20) DEFAULT 'medium',
  estimated_hours DECIMAL(8,2),
  actual_hours DECIMAL(8,2) DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Ограничения
ALTER TABLE tasks ADD CONSTRAINT chk_tasks_hours 
  CHECK (estimated_hours IS NULL OR estimated_hours > 0);
ALTER TABLE tasks ADD CONSTRAINT chk_tasks_actual_hours 
  CHECK (actual_hours >= 0);
ALTER TABLE tasks ADD CONSTRAINT chk_tasks_status 
  CHECK (status IN ('todo', 'in_progress', 'review', 'done'));
ALTER TABLE tasks ADD CONSTRAINT chk_tasks_priority 
  CHECK (priority IN ('low', 'medium', 'high', 'critical'));
```

**Поля**:
- `id` - уникальный идентификатор
- `project_id` - ID проекта
- `name` - название задачи
- `description` - описание задачи
- `assignee_id` - ID исполнителя
- `status` - статус задачи
- `priority` - приоритет задачи
- `estimated_hours` - оценка времени (часы)
- `actual_hours` - фактическое время (часы)
- `due_date` - срок выполнения
- `created_at` - время создания
- `updated_at` - время обновления

### 5. Трудозатраты (time_entries)

**Назначение**: Учет времени сотрудников по проектам и задачам

```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  project_id UUID REFERENCES projects(id),
  task_id UUID REFERENCES tasks(id),
  date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'submitted',
  billable BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_time_entries_employee_id ON time_entries(employee_id);
CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_status ON time_entries(status);
CREATE INDEX idx_time_entries_approved_by ON time_entries(approved_by);
CREATE INDEX idx_time_entries_employee_date ON time_entries(employee_id, date);

-- Ограничения
ALTER TABLE time_entries ADD CONSTRAINT chk_time_entries_hours 
  CHECK (hours > 0 AND hours <= 24);
ALTER TABLE time_entries ADD CONSTRAINT chk_time_entries_date 
  CHECK (date <= CURRENT_DATE);
ALTER TABLE time_entries ADD CONSTRAINT chk_time_entries_status 
  CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));
```

**Поля**:
- `id` - уникальный идентификатор
- `employee_id` - ID сотрудника
- `project_id` - ID проекта
- `task_id` - ID задачи (опционально)
- `date` - дата работы
- `hours` - количество часов (0.25 - 24)
- `description` - описание работы
- `status` - статус записи
- `billable` - биллябельная ли запись
- `approved_by` - ID утвердившего
- `approved_at` - время утверждения
- `rejection_reason` - причина отклонения
- `created_at` - время создания
- `updated_at` - время обновления

---

## 🔗 Связи между таблицами

### 1. Иерархия направлений
```
directions (manager_id) → employees (id)
```

### 2. Структура сотрудников
```
employees (direction_id) → directions (id)
employees (manager_id) → employees (id)
```

### 3. Управление проектами
```
projects (direction_id) → directions (id)
projects (manager_id) → employees (id)
```

### 4. Выполнение задач
```
tasks (project_id) → projects (id)
tasks (assignee_id) → employees (id)
```

### 5. Учет времени
```
time_entries (employee_id) → employees (id)
time_entries (project_id) → projects (id)
time_entries (task_id) → tasks (id)
time_entries (approved_by) → employees (id)
```

---

## 📈 Индексы для производительности

### 1. Составные индексы
```sql
-- Для запросов по сотруднику и дате
CREATE INDEX idx_time_entries_employee_date_status 
  ON time_entries(employee_id, date, status);

-- Для запросов по проекту и периоду
CREATE INDEX idx_time_entries_project_date 
  ON time_entries(project_id, date);

-- Для аналитики по направлениям
CREATE INDEX idx_projects_direction_status 
  ON projects(direction_id, status);
```

### 2. Частичные индексы
```sql
-- Только активные сотрудники
CREATE INDEX idx_employees_active 
  ON employees(id) WHERE is_active = true;

-- Только активные проекты
CREATE INDEX idx_projects_active 
  ON projects(id) WHERE status = 'active';

-- Только утвержденные записи времени
CREATE INDEX idx_time_entries_approved 
  ON time_entries(id) WHERE status = 'approved';
```

### 3. Индексы для полнотекстового поиска
```sql
-- Поиск по названиям проектов
CREATE INDEX idx_projects_name_gin 
  ON projects USING gin(to_tsvector('russian', name));

-- Поиск по описаниям задач
CREATE INDEX idx_tasks_description_gin 
  ON tasks USING gin(to_tsvector('russian', description));
```

---

## 🔒 Ограничения и валидация

### 1. Бизнес-правила
```sql
-- Нельзя указать время на будущую дату
ALTER TABLE time_entries ADD CONSTRAINT chk_time_entries_future_date 
  CHECK (date <= CURRENT_DATE);

-- Нельзя указать больше 24 часов в день
ALTER TABLE time_entries ADD CONSTRAINT chk_time_entries_max_hours 
  CHECK (hours <= 24);

-- Дата окончания проекта не может быть раньше даты начала
ALTER TABLE projects ADD CONSTRAINT chk_projects_date_order 
  CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date);
```

### 2. Уникальные ограничения
```sql
-- Уникальность email сотрудника
ALTER TABLE employees ADD CONSTRAINT uk_employees_email 
  UNIQUE (email);

-- Уникальность названия направления
ALTER TABLE directions ADD CONSTRAINT uk_directions_name 
  UNIQUE (name);
```

### 3. Каскадные операции
```sql
-- При удалении направления деактивировать сотрудников
ALTER TABLE employees ADD CONSTRAINT fk_employees_direction 
  FOREIGN KEY (direction_id) REFERENCES directions(id) 
  ON DELETE SET NULL;

-- При удалении проекта удалить задачи
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_project 
  FOREIGN KEY (project_id) REFERENCES projects(id) 
  ON DELETE CASCADE;
```

---

## 📊 Представления (Views)

### 1. Аналитические представления
```sql
-- Сводка по проектам
CREATE VIEW project_summary AS
SELECT 
  p.id,
  p.name,
  p.status,
  p.budget,
  d.name as direction_name,
  e.full_name as manager_name,
  COUNT(t.id) as task_count,
  SUM(t.estimated_hours) as estimated_hours,
  SUM(t.actual_hours) as actual_hours,
  COALESCE(SUM(te.hours), 0) as logged_hours
FROM projects p
LEFT JOIN directions d ON p.direction_id = d.id
LEFT JOIN employees e ON p.manager_id = e.id
LEFT JOIN tasks t ON p.id = t.project_id
LEFT JOIN time_entries te ON p.id = te.project_id
GROUP BY p.id, p.name, p.status, p.budget, d.name, e.full_name;

-- Сводка по сотрудникам
CREATE VIEW employee_summary AS
SELECT 
  e.id,
  e.full_name,
  e.position,
  d.name as direction_name,
  e.hourly_rate,
  COUNT(DISTINCT te.project_id) as active_projects,
  COALESCE(SUM(te.hours), 0) as total_hours,
  COALESCE(SUM(CASE WHEN te.billable THEN te.hours ELSE 0 END), 0) as billable_hours
FROM employees e
LEFT JOIN directions d ON e.direction_id = d.id
LEFT JOIN time_entries te ON e.id = te.employee_id
WHERE e.is_active = true
GROUP BY e.id, e.full_name, e.position, d.name, e.hourly_rate;
```

### 2. Представления для отчетов
```sql
-- Рентабельность проектов
CREATE VIEW project_profitability AS
SELECT 
  p.id,
  p.name,
  p.budget,
  d.name as direction_name,
  COALESCE(SUM(te.hours * e.hourly_rate), 0) as total_cost,
  p.budget - COALESCE(SUM(te.hours * e.hourly_rate), 0) as profit,
  CASE 
    WHEN p.budget > 0 THEN 
      (p.budget - COALESCE(SUM(te.hours * e.hourly_rate), 0)) / p.budget * 100
    ELSE 0 
  END as profit_margin
FROM projects p
LEFT JOIN directions d ON p.direction_id = d.id
LEFT JOIN time_entries te ON p.id = te.project_id
LEFT JOIN employees e ON te.employee_id = e.id
WHERE te.status = 'approved'
GROUP BY p.id, p.name, p.budget, d.name;
```

---

## 🔄 Миграции

### 1. Структура миграций
```
prisma/migrations/
├── 001_initial_schema.sql      # Основные таблицы
├── 002_seed_data.sql          # Тестовые данные
├── 003_add_indexes.sql        # Оптимизация индексов
└── 004_add_views.sql          # Аналитические представления
```

### 2. Версионирование схемы
```sql
-- Таблица версий миграций
CREATE TABLE schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📈 Планы развития

### 1. Партиционирование
```sql
-- Партиционирование по месяцам для time_entries
CREATE TABLE time_entries_2024_01 PARTITION OF time_entries
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 2. Архивирование
```sql
-- Таблица для архивных данных
CREATE TABLE time_entries_archive (
  LIKE time_entries INCLUDING ALL
);
```

### 3. Аудит изменений
```sql
-- Таблица для аудита
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  operation VARCHAR(20) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES employees(id),
  changed_at TIMESTAMP DEFAULT NOW()
);
```

---

*Схема базы данных эволюционирует вместе с требованиями проекта*
