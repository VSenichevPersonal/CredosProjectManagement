# 🗄️ Updated Database Schema (Based on Requirements)

## 📋 Обновленная схема на основе требований

**База данных**: PostgreSQL  
**Хостинг**: Railway  
**Архитектура**: Реляционная с поддержкой иерархий и групповых операций

---

## 🎯 Ключевые изменения

### 1. Иерархия сотрудников
- ✅ Отдельная таблица `employee_hierarchy` для подчинения
- ✅ Таблица `user_roles` для ролей сотрудников
- ✅ Гибкие ставки по проектам в `project_hourly_rates`

### 2. Структура проектов
- ✅ Таблица `project_phases` для этапов (опционально)
- ✅ Таблица `project_team` для команды проекта
- ✅ Бюджет общий + по этапам

### 3. Трудозатраты
- ✅ Убрано поле `billable` (не нужно)
- ✅ Утверждение руководителем проекта
- ✅ Поддержка групповых утверждений

### 4. Направления
- ✅ Несколько менеджеров проектов
- ✅ Бюджет как план с контролем превышения

---

## 📊 Обновленная схема таблиц

### 1. Направления (directions)
```sql
CREATE TABLE directions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  budget DECIMAL(15,2), -- План бюджета
  budget_threshold DECIMAL(15,2), -- Лимит превышения (например, 110% от плана)
  color VARCHAR(20) DEFAULT 'blue', -- Фиксированный набор цветов
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Сотрудники (employees)
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL, -- Для интеграции с 1С
  position VARCHAR(200) NOT NULL,
  direction_id UUID REFERENCES directions(id),
  default_hourly_rate DECIMAL(10,2) DEFAULT 0, -- Базовая ставка
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Иерархия сотрудников (employee_hierarchy)
```sql
CREATE TABLE employee_hierarchy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1, -- Уровень в иерархии (1, 2, 3...)
  is_direct BOOLEAN DEFAULT true, -- Прямое подчинение
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(employee_id, manager_id)
);
```

### 4. Роли пользователей (user_roles)
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- admin, manager, project_manager, employee, hr, finance
  granted_by UUID REFERENCES employees(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(employee_id, role)
);
```

### 5. Проекты (projects)
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  direction_id UUID REFERENCES directions(id),
  manager_id UUID REFERENCES employees(id), -- Руководитель проекта
  status VARCHAR(20) DEFAULT 'active',
  priority VARCHAR(20) DEFAULT 'medium',
  start_date DATE,
  end_date DATE,
  total_budget DECIMAL(15,2), -- Общий бюджет
  current_spent DECIMAL(15,2) DEFAULT 0, -- Текущие затраты
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_projects_status CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  CONSTRAINT chk_projects_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT chk_projects_dates CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);
```

### 6. Фазы проектов (project_phases) - ОПЦИОНАЛЬНО
```sql
CREATE TABLE project_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  phase_order INTEGER NOT NULL, -- Порядок фазы в проекте
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15,2), -- Бюджет фазы
  status VARCHAR(20) DEFAULT 'planned', -- planned, active, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_phases_status CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  CONSTRAINT chk_phases_order CHECK (phase_order > 0)
);
```

### 7. Команда проекта (project_team)
```sql
CREATE TABLE project_team (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- member, lead, consultant
  allocated_hours DECIMAL(8,2), -- Планируемые часы участия
  actual_hours DECIMAL(8,2) DEFAULT 0, -- Фактические часы
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP, -- Дата выхода из проекта
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(project_id, employee_id)
);
```

### 8. Ставки по проектам (project_hourly_rates)
```sql
CREATE TABLE project_hourly_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(10,2) NOT NULL, -- Ставка для этого проекта
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE, -- До какой даты действует ставка
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(project_id, employee_id, effective_from)
);
```

### 9. Трудозатраты (time_entries) - ОБНОВЛЕНО
```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  project_id UUID REFERENCES projects(id),
  phase_id UUID REFERENCES project_phases(id), -- Опционально
  date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL, -- До часов, точность 0.25
  description TEXT,
  status VARCHAR(20) DEFAULT 'submitted',
  approved_by UUID REFERENCES employees(id), -- Руководитель проекта
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_time_entries_hours CHECK (hours > 0 AND hours <= 24),
  CONSTRAINT chk_time_entries_date CHECK (date <= CURRENT_DATE),
  CONSTRAINT chk_time_entries_status CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'))
);
```

### 10. Групповые утверждения (batch_approvals)
```sql
CREATE TABLE batch_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  approver_id UUID REFERENCES employees(id),
  project_id UUID REFERENCES projects(id),
  approval_type VARCHAR(20) NOT NULL, -- time_entries, expenses, etc.
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  notes TEXT,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_batch_approvals_type CHECK (approval_type IN ('time_entries', 'expenses', 'other')),
  CONSTRAINT chk_batch_approvals_status CHECK (status IN ('pending', 'approved', 'rejected'))
);
```

### 11. Элементы группового утверждения (batch_approval_items)
```sql
CREATE TABLE batch_approval_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES batch_approvals(id) ON DELETE CASCADE,
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  
  UNIQUE(batch_id, time_entry_id)
);
```

### 12. История изменений (audit_log)
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  operation VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES employees(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);
```

---

## 🔗 Ключевые связи

### 1. Иерархия сотрудников
```
employee_hierarchy (employee_id) → employees (id)
employee_hierarchy (manager_id) → employees (id)
```

### 2. Роли и права
```
user_roles (employee_id) → employees (id)
user_roles (granted_by) → employees (id)
```

### 3. Структура проектов
```
projects (direction_id) → directions (id)
projects (manager_id) → employees (id)
project_phases (project_id) → projects (id)
project_team (project_id) → projects (id)
project_team (employee_id) → employees (id)
```

### 4. Учет времени
```
time_entries (employee_id) → employees (id)
time_entries (project_id) → projects (id)
time_entries (phase_id) → project_phases (id)
time_entries (approved_by) → employees (id)
```

### 5. Групповые утверждения
```
batch_approvals (approver_id) → employees (id)
batch_approvals (project_id) → projects (id)
batch_approval_items (batch_id) → batch_approvals (id)
batch_approval_items (time_entry_id) → time_entries (id)
```

---

## 📈 Оптимизированные индексы

### 1. Основные индексы
```sql
-- Иерархия сотрудников
CREATE INDEX idx_employee_hierarchy_employee ON employee_hierarchy(employee_id);
CREATE INDEX idx_employee_hierarchy_manager ON employee_hierarchy(manager_id);
CREATE INDEX idx_employee_hierarchy_level ON employee_hierarchy(level);

-- Роли пользователей
CREATE INDEX idx_user_roles_employee ON user_roles(employee_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Команды проектов
CREATE INDEX idx_project_team_project ON project_team(project_id);
CREATE INDEX idx_project_team_employee ON project_team(employee_id);

-- Ставки по проектам
CREATE INDEX idx_project_rates_project ON project_hourly_rates(project_id);
CREATE INDEX idx_project_rates_employee ON project_hourly_rates(employee_id);
CREATE INDEX idx_project_rates_effective ON project_hourly_rates(effective_from, effective_to);

-- Трудозатраты
CREATE INDEX idx_time_entries_employee_date ON time_entries(employee_id, date);
CREATE INDEX idx_time_entries_project_date ON time_entries(project_id, date);
CREATE INDEX idx_time_entries_status ON time_entries(status);
CREATE INDEX idx_time_entries_approved_by ON time_entries(approved_by);

-- Групповые утверждения
CREATE INDEX idx_batch_approvals_project ON batch_approvals(project_id);
CREATE INDEX idx_batch_approvals_approver ON batch_approvals(approver_id);
CREATE INDEX idx_batch_approvals_status ON batch_approvals(status);

-- Аудит
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_changed_by ON audit_log(changed_by);
CREATE INDEX idx_audit_log_changed_at ON audit_log(changed_at);
```

---

## 🔒 Бизнес-правила

### 1. Управление ставками
```sql
-- Функция получения ставки сотрудника для проекта
CREATE OR REPLACE FUNCTION get_employee_project_rate(
  p_project_id UUID,
  p_employee_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS DECIMAL(10,2) AS $$
DECLARE
  rate DECIMAL(10,2);
BEGIN
  -- Ищем ставку для конкретного проекта
  SELECT hourly_rate INTO rate
  FROM project_hourly_rates
  WHERE project_id = p_project_id
    AND employee_id = p_employee_id
    AND effective_from <= p_date
    AND (effective_to IS NULL OR effective_to >= p_date)
  ORDER BY effective_from DESC
  LIMIT 1;
  
  -- Если не найдена, берем базовую ставку
  IF rate IS NULL THEN
    SELECT default_hourly_rate INTO rate
    FROM employees
    WHERE id = p_employee_id;
  END IF;
  
  RETURN COALESCE(rate, 0);
END;
$$ LANGUAGE plpgsql;
```

### 2. Контроль бюджета направлений
```sql
-- Функция проверки превышения бюджета направления
CREATE OR REPLACE FUNCTION check_direction_budget_exceeded(
  p_direction_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  total_budget DECIMAL(15,2);
  total_spent DECIMAL(15,2);
  threshold DECIMAL(15,2);
BEGIN
  SELECT d.budget, d.budget_threshold INTO total_budget, threshold
  FROM directions d
  WHERE d.id = p_direction_id;
  
  SELECT COALESCE(SUM(p.current_spent), 0) INTO total_spent
  FROM projects p
  WHERE p.direction_id = p_direction_id;
  
  RETURN total_spent > COALESCE(threshold, total_budget);
END;
$$ LANGUAGE plpgsql;
```

### 3. Групповое утверждение
```sql
-- Процедура группового утверждения
CREATE OR REPLACE FUNCTION approve_time_entries_batch(
  p_batch_id UUID,
  p_approved BOOLEAN,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Обновляем статус батча
  UPDATE batch_approvals
  SET status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
      approved_at = CASE WHEN p_approved THEN NOW() ELSE NULL END,
      rejected_at = CASE WHEN p_approved THEN NULL ELSE NOW() END,
      notes = p_notes
  WHERE id = p_batch_id;
  
  -- Обновляем статус записей времени
  UPDATE time_entries
  SET status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
      approved_by = (SELECT approver_id FROM batch_approvals WHERE id = p_batch_id),
      approved_at = CASE WHEN p_approved THEN NOW() ELSE NULL END,
      rejection_reason = CASE WHEN p_approved THEN NULL ELSE p_notes END
  WHERE id IN (
    SELECT time_entry_id 
    FROM batch_approval_items 
    WHERE batch_id = p_batch_id
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Представления для отчетности

### 1. Сводка по проектам с затратами
```sql
CREATE VIEW project_summary_with_costs AS
SELECT 
  p.id,
  p.name,
  p.status,
  p.total_budget,
  p.current_spent,
  d.name as direction_name,
  e.full_name as manager_name,
  COUNT(DISTINCT pt.employee_id) as team_size,
  COUNT(DISTINCT pp.id) as phases_count,
  COALESCE(SUM(te.hours), 0) as total_logged_hours,
  COALESCE(SUM(te.hours * get_employee_project_rate(p.id, te.employee_id, te.date)), 0) as calculated_cost
FROM projects p
LEFT JOIN directions d ON p.direction_id = d.id
LEFT JOIN employees e ON p.manager_id = e.id
LEFT JOIN project_team pt ON p.id = pt.project_id AND pt.is_active = true
LEFT JOIN project_phases pp ON p.id = pp.project_id
LEFT JOIN time_entries te ON p.id = te.project_id AND te.status = 'approved'
GROUP BY p.id, p.name, p.status, p.total_budget, p.current_spent, d.name, e.full_name;
```

### 2. Иерархия сотрудников
```sql
CREATE VIEW employee_hierarchy_view AS
SELECT 
  e.id,
  e.full_name,
  e.position,
  m.full_name as manager_name,
  eh.level,
  eh.is_direct,
  d.name as direction_name
FROM employees e
LEFT JOIN employee_hierarchy eh ON e.id = eh.employee_id
LEFT JOIN employees m ON eh.manager_id = m.id
LEFT JOIN directions d ON e.direction_id = d.id
WHERE e.is_active = true
ORDER BY eh.level, e.full_name;
```

---

*Обновленная схема отражает реальные требования бизнеса Credos PM*
