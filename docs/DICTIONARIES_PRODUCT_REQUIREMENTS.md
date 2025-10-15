# 📚 Справочники системы - Product Requirements

## 🎯 Vision

Создать гибкую систему справочников для учёта времени, вдохновлённую лучшими практиками Timetta, Kimai, Toggl и Harvest.

---

## 📊 Анализ существующих систем

### Kimai (Open Source)
**Основные справочники**:
- Customers (Клиенты)
- Projects (Проекты)
- Activities (Виды деятельности)
- Tags (Теги)
- Teams (Команды)
- Custom Fields (Кастомные поля)

### Timetta (Russian Market Leader)
**Основные справочники**:
- Клиенты
- Проекты
- Виды работ
- Сотрудники
- Отделы
- Роли
- Тарифы

### Best Practices
**Must Have** для профессионального timesheet:
1. ✅ Иерархия: Клиент → Проект → Задача/Activity
2. ✅ Гибкая тарификация (по проекту, по сотруднику, по виду работ)
3. ✅ Теги для аналитики
4. ✅ Календари (рабочие дни, праздники)
5. ✅ Шаблоны для повторяющихся задач

---

## 📋 Текущее состояние (Что есть)

### ✅ Реализовано

1. **Directions** (Направления) - `/admin/dictionaries/directions`
   - Основные направления компании
   - Бюджет направления
   - Менеджер направления

2. **Employees** (Сотрудники) - `/admin/dictionaries/employees`
   - ФИО, email, должность
   - Направление
   - Базовая ставка

3. **Projects** (Проекты) - `/admin/dictionaries/projects`
   - Название, описание
   - Направление
   - Менеджер проекта
   - Бюджет

4. **User Roles** (Роли) - `/admin/users`
   - admin, manager, employee, viewer
   - Назначение/отзыв ролей

5. **Permissions Matrix** (Матрица прав) - `/admin/permissions`
   - Визуализация прав по ролям

### ⚠️ Частично реализовано

6. **Tasks** (Задачи)
   - Есть в БД (table `tasks`)
   - Есть API (`/api/tasks`)
   - ❌ НЕТ UI в админке

### ❌ Отсутствует

7. **Customers** (Клиенты)
8. **Activities** (Виды деятельности)
9. **Tags** (Теги)
10. **Work Types** (Типы работ)
11. **Rates** (Тарифные планы)
12. **Calendars** (Календари)
13. **Holidays** (Праздники)
14. **Templates** (Шаблоны)

---

## 🎯 Priority Matrix

### P0 (Must Have) - Неделя 1

#### 1. **Customers** (Клиенты) 🔥
**Зачем**: Кто заказчик проекта? Критично для B2B компаний.

**Структура**:
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(300), -- ООО "Рога и копыта"
  inn VARCHAR(12), -- ИНН для РФ
  contact_person VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Связь с проектами**:
```sql
ALTER TABLE projects ADD COLUMN customer_id UUID REFERENCES customers(id);
```

**UI**: CRUD интерфейс в `/admin/dictionaries/customers`

---

#### 2. **Activities** (Виды деятельности) 🔥
**Зачем**: Что именно делал сотрудник? (Разработка, Дизайн, Встреча, Документирование)

**Структура**:
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  color VARCHAR(20), -- Для визуализации
  default_hourly_rate DECIMAL(10,2), -- Базовая ставка для этого вида работ
  is_billable BOOLEAN DEFAULT true, -- Оплачиваемый ли
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Примеры**:
- Разработка (billable, 3000₽/час)
- Код-ревью (billable, 2500₽/час)
- Встречи (billable, 2000₽/час)
- Обучение (non-billable, 0₽/час)
- Админ задачи (non-billable, 0₽/час)

**Связь с time_entries**:
```sql
ALTER TABLE time_entries ADD COLUMN activity_id UUID REFERENCES activities(id);
```

**UI**: CRUD интерфейс в `/admin/dictionaries/activities`

---

### P1 (Should Have) - Неделя 2

#### 3. **Tags** (Теги) 🏷️
**Зачем**: Гибкая категоризация и аналитика.

**Структура**:
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(20),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE time_entry_tags (
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (time_entry_id, tag_id)
);
```

**Примеры тегов**:
- `urgent` (срочно)
- `research` (исследование)
- `bugfix` (исправление багов)
- `feature` (новая фича)
- `refactoring` (рефакторинг)

**UI**: 
- CRUD в `/admin/dictionaries/tags`
- Multi-select при создании time entry

---

#### 4. **Project Rate Plans** (Тарифные планы проектов) 💰
**Зачем**: Разные ставки для разных проектов/клиентов.

**Структура**:
```sql
CREATE TABLE project_rates (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id), -- Опционально: ставка за конкретный вид работ
  employee_id UUID REFERENCES employees(id), -- Опционально: ставка для конкретного сотрудника
  hourly_rate DECIMAL(10,2) NOT NULL,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_to DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, activity_id, employee_id, valid_from)
);
```

**Логика**:
1. Специфичная ставка (проект + activity + employee) - наивысший приоритет
2. Ставка за activity на проекте (проект + activity)
3. Ставка сотрудника на проекте (проект + employee)
4. Базовая ставка activity
5. Базовая ставка employee

**UI**: Вкладка "Тарифы" в проекте

---

#### 5. **Work Calendars** (Рабочие календари) 📅
**Зачем**: Учёт рабочих/нерабочих дней, расчёт capacity.

**Структура**:
```sql
CREATE TABLE work_calendars (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  country VARCHAR(2) DEFAULT 'RU',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE holidays (
  id UUID PRIMARY KEY,
  calendar_id UUID REFERENCES work_calendars(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name VARCHAR(200) NOT NULL,
  is_working_day BOOLEAN DEFAULT false, -- Рабочий день (как в РФ перенесённые дни)
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(calendar_id, date)
);

CREATE TABLE work_schedules (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  calendar_id UUID REFERENCES work_calendars(id),
  hours_per_week DECIMAL(5,2) DEFAULT 40,
  monday_hours DECIMAL(4,2) DEFAULT 8,
  tuesday_hours DECIMAL(4,2) DEFAULT 8,
  wednesday_hours DECIMAL(4,2) DEFAULT 8,
  thursday_hours DECIMAL(4,2) DEFAULT 8,
  friday_hours DECIMAL(4,2) DEFAULT 8,
  saturday_hours DECIMAL(4,2) DEFAULT 0,
  sunday_hours DECIMAL(4,2) DEFAULT 0,
  valid_from DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Преднастроенные календари**:
- Россия (РФ)
- Казахстан (KZ)
- Беларусь (BY)
- Кастомные

**UI**: 
- `/admin/dictionaries/calendars` - список календарей
- `/admin/dictionaries/calendars/[id]` - праздники конкретного календаря

---

### P2 (Nice to Have) - Неделя 3

#### 6. **Task Templates** (Шаблоны задач) 📝
**Зачем**: Быстрое создание повторяющихся задач.

**Структура**:
```sql
CREATE TABLE task_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  activity_id UUID REFERENCES activities(id),
  estimated_hours DECIMAL(6,2),
  tags JSONB, -- Массив тегов
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Use case**: 
- "Еженедельный отчёт" (2 часа, тег: reporting)
- "Code review" (1 час, тег: review)
- "Standup meeting" (0.5 часа, тег: meeting)

---

#### 7. **Custom Fields** (Кастомные поля) 🔧
**Зачем**: Гибкость под специфику компании.

**Структура**:
```sql
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- 'project', 'customer', 'time_entry'
  field_name VARCHAR(100) NOT NULL,
  field_type VARCHAR(20) NOT NULL, -- 'text', 'number', 'date', 'select'
  field_options JSONB, -- Для select: ['option1', 'option2']
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(entity_type, field_name)
);

CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY,
  custom_field_id UUID REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(custom_field_id, entity_id)
);
```

---

## 🏗️ Архитектура справочников

### Единый паттерн для всех справочников

```typescript
// Generic Dictionary Interface
interface Dictionary {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Generic CRUD Operations
interface DictionaryService<T extends Dictionary> {
  getAll(ctx: ExecutionContext, filters?: DictionaryFilters): Promise<T[]>;
  getById(ctx: ExecutionContext, id: string): Promise<T | null>;
  create(ctx: ExecutionContext, data: CreateDTO<T>): Promise<T>;
  update(ctx: ExecutionContext, id: string, data: UpdateDTO<T>): Promise<T>;
  delete(ctx: ExecutionContext, id: string): Promise<void>;
}
```

### UI Component Pattern

```typescript
// Generic Dictionary Management Component
<DictionaryManagementPanel<Customer>
  title="Клиенты"
  apiEndpoint="/api/dictionaries/customers"
  columns={[
    { key: 'name', label: 'Название' },
    { key: 'inn', label: 'ИНН' },
    { key: 'contactPerson', label: 'Контакт' }
  ]}
  formFields={[
    { name: 'name', type: 'text', required: true },
    { name: 'inn', type: 'text', required: false },
    { name: 'contactPerson', type: 'text', required: false }
  ]}
/>
```

---

## 📊 Roadmap

### Неделя 1 (P0)
- [x] Проверить существующие справочники
- [ ] Создать миграции для Customers
- [ ] Создать миграции для Activities
- [ ] API endpoints для Customers
- [ ] API endpoints для Activities
- [ ] UI для Customers
- [ ] UI для Activities
- [ ] Обновить time_entries для связи с activity_id
- [ ] Обновить projects для связи с customer_id

### Неделя 2 (P1)
- [ ] Tags (миграции, API, UI)
- [ ] Project Rates (миграции, API, UI)
- [ ] Work Calendars (миграции, API, UI)
- [ ] Интеграция тегов в time entries UI

### Неделя 3 (P2)
- [ ] Task Templates
- [ ] Custom Fields
- [ ] Import/Export справочников

---

## 🎨 UI/UX Requirements

### Общие требования для всех справочников

1. **Поиск**:
   - Real-time search по всем текстовым полям
   - Фильтры (активные/неактивные, по категориям)

2. **CRUD Operations**:
   - Создать (модальное окно)
   - Редактировать (модальное окно)
   - Удалить (с подтверждением)
   - Bulk operations (массовая активация/деактивация)

3. **Валидация**:
   - Client-side (Zod schemas)
   - Server-side (двойная проверка)
   - Понятные сообщения об ошибках

4. **Сортировка**:
   - По имени (A-Z, Z-A)
   - По дате создания
   - По статусу

5. **Пагинация**:
   - 50 записей на странице по умолчанию
   - Настраиваемый размер страницы

6. **Export**:
   - CSV для всех справочников
   - Excel для отчётов

---

## 🔒 Permissions для справочников

```typescript
// New permissions to add to permissions.ts
export type Permission =
  // ... existing permissions
  
  // Customers
  | 'customers:read'
  | 'customers:create'
  | 'customers:update'
  | 'customers:delete'
  
  // Activities
  | 'activities:read'
  | 'activities:create'
  | 'activities:update'
  | 'activities:delete'
  
  // Tags
  | 'tags:read'
  | 'tags:create'
  | 'tags:update'
  | 'tags:delete'
  
  // Calendars
  | 'calendars:read'
  | 'calendars:manage'
```

### Role Mapping

- **admin**: все права на все справочники
- **manager**: read/create/update на все справочники (кроме delete)
- **employee**: только read на справочники
- **viewer**: только read на справочники

---

## 📈 Success Metrics

### KPIs

1. **Adoption Rate**: 
   - 80%+ проектов должны иметь привязанного клиента
   - 90%+ time entries должны иметь activity

2. **Data Quality**:
   - <5% записей без обязательных полей
   - <1% дублей клиентов

3. **User Satisfaction**:
   - <2 клика для создания записи из справочника
   - <30 секунд на создание нового справочника

4. **Performance**:
   - <500ms загрузка списка справочников
   - <100ms поиск по справочникам

---

## 🛠️ Technical Debt

### Что нужно рефакторить

1. **Унифицировать API endpoints**:
   ```
   /api/dictionaries/customers
   /api/dictionaries/activities
   /api/dictionaries/tags
   /api/dictionaries/calendars
   ```

2. **Создать generic компоненты**:
   - `<DictionaryTable />`
   - `<DictionaryForm />`
   - `<DictionaryFilters />`

3. **Централизовать валидацию**:
   ```typescript
   // schemas/dictionaries.ts
   export const customerSchema = z.object({...})
   export const activitySchema = z.object({...})
   ```

---

**Дата**: 2025-10-15  
**Product Owner**: AI Product Manager  
**Status**: ✅ Ready for Development

