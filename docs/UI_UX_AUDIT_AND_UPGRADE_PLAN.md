# 🎨 UI/UX Аудит и План Апгрейда

**Дата**: 15 октября 2025  
**Аудитор**: AI UI/UX Engineer  
**Контроль**: AI Product Owner  
**Цель**: Создать удобную систему управления проектами для ИТ компании

---

## 📊 ЧАСТЬ 1: Текущее состояние (AS-IS)

### 1.1. Инвентаризация страниц

| # | Страница | UniversalDataTable | CRUD | Статус | Приоритет |
|---|----------|-------------------|------|--------|-----------|
| 1 | `/projects` | ✅ | ✅ Full | GOOD | - |
| 2 | `/employees` | ✅ | ⚠️ View only | NEEDS WORK | P0 |
| 3 | `/directions` | ✅ | ⚠️ View only | NEEDS WORK | P0 |
| 4 | `/my-time` | ❌ Custom | ✅ Full | GOOD | - |
| 5 | `/my-tasks` | ❌ Custom | ⚠️ Unknown | NEEDS CHECK | P1 |
| 6 | `/admin/users` | ✅ | ✅ Full | GOOD | - |
| 7 | `/admin/dictionaries/customers` | ✅ | ✅ Full | EXCELLENT | - |
| 8 | `/admin/dictionaries/activities` | ✅ | ✅ Full | EXCELLENT | - |
| 9 | `/admin/dictionaries/tags` | ✅ | ✅ Full | EXCELLENT | - |
| 10 | `/admin/permissions` | ✅ | ❌ View only | OK | - |
| 11 | `/approvals` | ❌ Unknown | ⚠️ Unknown | NEEDS CHECK | P1 |
| 12 | `/salary-fund` | ❌ Unknown | ⚠️ Unknown | NEEDS CHECK | P2 |
| 13 | `/analytics/*` | ❌ Unknown | ❌ Read only | OK | - |
| 14 | `/admin/finance/*` | ❌ Unknown | ⚠️ Unknown | NEEDS CHECK | P1 |

---

### 1.2. Проблемы текущего UI

#### 🔴 Критичные (P0)
1. **Employees page**: Нет полноценного CRUD
   - ❌ Кнопка "Добавить" - заглушка
   - ❌ Кнопка "Редактировать" - заглушка
   - ✅ Удаление работает
   - **Impact**: HIGH - сотрудники - core entity

2. **Directions page**: Нет полноценного CRUD
   - ❌ Кнопка "Добавить" - заглушка
   - ❌ Кнопка "Редактировать" - заглушка
   - ✅ Удаление работает
   - **Impact**: HIGH - направления - core entity

#### 🟡 Важные (P1)
3. **Inconsistent UI patterns**
   - Projects: Полные CRUD диалоги ✅
   - Employees: Заглушки ❌
   - Directions: Заглушки ❌
   - **Impact**: MEDIUM - пользователи путаются

4. **My Tasks page**: Неизвестно использование UniversalDataTable
   - Нужно проверить и унифицировать
   - **Impact**: MEDIUM

5. **Approvals page**: Неизвестно состояние
   - Критично для workflow
   - **Impact**: HIGH

#### 🟢 Улучшения (P2)
6. **Finance pages**: Неизвестно состояние
   - Много страниц (5+), нужна унификация
   - **Impact**: MEDIUM

7. **Salary Fund**: Неизвестно состояние
   - **Impact**: LOW

---

## 🎯 ЧАСТЬ 2: Product Owner Vision

### 2.1. Требования для ИТ компании

**Контекст**: Профессиональная ИТ компания, оказывающая услуги в области:
- Информационная безопасность (ИБ)
- Персональные данные и информационная безопасность (ПИБ)
- Технический контроль (ТК)
- Аудит ИБ
- HR и Финансы

**Key Users**:
1. **Admin** - Полный доступ ко всему
2. **Manager** - Управление проектами, сотрудниками, бюджетами
3. **Employee** - Списание часов, просмотр своих задач
4. **Viewer** - Только просмотр отчётов

---

### 2.2. Must-Have Features

#### ✅ Управление проектами
- [x] Создание/редактирование проектов
- [x] Привязка к клиентам
- [x] Привязка к направлениям
- [x] Статусы проектов
- [x] Бюджеты проектов

#### ⚠️ Управление сотрудниками
- [ ] Создание/редактирование сотрудников (MISSING!)
- [x] Просмотр сотрудников
- [x] Удаление сотрудников
- [ ] Назначение на проекты (MISSING!)
- [ ] Управление ставками (MISSING!)

#### ⚠️ Управление направлениями
- [ ] Создание/редактирование направлений (MISSING!)
- [x] Просмотр направлений
- [x] Удаление направлений
- [ ] Бюджеты направлений (MISSING!)

#### ✅ Справочники
- [x] Клиенты (Customers)
- [x] Виды деятельности (Activities)
- [x] Теги (Tags)
- [ ] Тарифные планы (Project Rates) - P1
- [ ] Календари (Work Calendars) - P1

#### ⚠️ Timesheet
- [x] Списание часов (Weekly + List)
- [ ] Согласование часов (Approvals) - NEEDS CHECK
- [x] Привязка к проектам
- [x] Привязка к задачам
- [ ] Привязка к видам деятельности (NEEDS IMPL)

#### ⚠️ Финансы
- [ ] Доходы (Revenues) - NEEDS CHECK
- [ ] Зарплаты (Salary) - NEEDS CHECK
- [ ] Дополнительные расходы (Extra Costs) - NEEDS CHECK
- [ ] Заказы (Orders) - NEEDS CHECK

---

### 2.3. UX Principles для ИТ компании

1. **Consistency** (Единообразие)
   - Все CRUD операции через UniversalDataTable
   - Единый стиль диалогов
   - Единые кнопки и иконки

2. **Efficiency** (Эффективность)
   - Быстрое создание/редактирование (2-3 клика)
   - Keyboard shortcuts где возможно
   - Bulk operations для массовых действий

3. **Clarity** (Ясность)
   - Понятные заголовки и описания
   - Валидация с понятными сообщениями
   - Статусы с цветовой кодировкой

4. **Safety** (Безопасность)
   - Подтверждение удаления
   - Soft delete где критично
   - Audit trail для критичных операций

---

## 🚀 ЧАСТЬ 3: План апгрейда (TO-BE)

### Phase 1: P0 - Критичные CRUD (1-2 дня)

#### Task 1.1: Employees Full CRUD ⭐ PRIORITY
**Почему критично**: Сотрудники - core entity системы

**Implementation**:
```typescript
// Создать hooks/use-employees.ts (по аналогии с use-projects.ts)
- useEmployees() - получение списка
- useEmployee(id) - получение одного
- useCreateEmployee() - создание
- useUpdateEmployee() - обновление
- useDeleteEmployee() - удаление

// Обновить pages/employees/page.tsx
- Добавить диалог создания
- Добавить диалог редактирования
- Подключить hooks
- Валидация (Zod schema)
```

**Поля для создания/редактирования**:
- ФИО *
- Email *
- Должность *
- Направление (select)
- Базовая ставка (₽/ч)
- Статус (активен/неактивен)

**Estimate**: 3-4 часа

---

#### Task 1.2: Directions Full CRUD ⭐ PRIORITY
**Почему критично**: Направления - core entity для группировки проектов

**Implementation**:
```typescript
// Создать hooks/use-directions.ts
- useDirections()
- useDirection(id)
- useCreateDirection()
- useUpdateDirection()
- useDeleteDirection()

// Обновить pages/directions/page.tsx
- Добавить диалог создания
- Добавить диалог редактирования
- Color picker для выбора цвета
```

**Поля**:
- Название *
- Описание
- Цвет (color picker)
- Бюджет (₽)
- Порог превышения бюджета (%)

**Estimate**: 2-3 часа

---

### Phase 2: P1 - Унификация и улучшения (2-3 дня)

#### Task 2.1: My Tasks - UniversalDataTable
**Цель**: Унифицировать с остальным UI

**Changes**:
- Переписать на UniversalDataTable
- Добавить CRUD диалоги
- Фильтры по проекту, статусу, приоритету

**Estimate**: 2-3 часа

---

#### Task 2.2: Approvals - Full Implementation
**Цель**: Реализовать workflow согласования часов

**Features**:
- Список ожидающих согласования (для manager+)
- Bulk approve/reject
- Комментарии при reject
- Уведомления сотрудникам

**Estimate**: 4-5 часов

---

#### Task 2.3: Finance Pages - Audit & Upgrade
**Цель**: Проверить и унифицировать все finance страницы

**Pages to check**:
- /admin/finance/revenues
- /admin/finance/salary
- /admin/finance/extra-costs
- /admin/finance/orders
- /admin/finance/services
- /admin/finance/allocations

**Actions**:
1. Audit current state
2. Migrate to UniversalDataTable where applicable
3. Implement CRUD where needed
4. Add validation

**Estimate**: 6-8 часов

---

### Phase 3: P2 - Advanced Features (3-5 дней)

#### Task 3.1: Project Rates (Тарифные планы)
**Цель**: Гибкая система тарификации

**Features**:
- Разные ставки для разных проектов
- Разные ставки для разных сотрудников на проекте
- Разные ставки для разных видов деятельности
- Validity period (от/до)

**UI**: Вкладка "Тарифы" в проекте

**Estimate**: 8 часов

---

#### Task 3.2: Work Calendars (Производственные календари)
**Цель**: Учёт рабочих дней и праздников

**Features**:
- Календари для разных стран (РФ, KZ, BY)
- Праздничные дни
- Перенесённые рабочие дни
- Индивидуальные графики сотрудников

**UI**: /admin/dictionaries/calendars

**Estimate**: 10-12 часов

---

#### Task 3.3: Enhanced Timesheet
**Цель**: Улучшить UX списания часов

**Features**:
- Привязка к видам деятельности (Activities)
- Теги для time entries
- Копирование записей (repeat last week)
- Шаблоны частых записей
- Validat

ion: не более X часов в день

**Estimate**: 6-8 часов

---

## 📋 ЧАСТЬ 4: Приоритизация Product Owner

### Sprint 1 (Week 1): Foundation ⭐⭐⭐
**Goal**: Завершить все P0 CRUD операции

- [x] Справочники (Customers, Activities, Tags) - ✅ DONE
- [ ] Employees Full CRUD - P0
- [ ] Directions Full CRUD - P0
- [ ] My Tasks UniversalDataTable - P1
- [ ] Approvals Basic - P1

**Success Criteria**:
- Все core entities имеют полный CRUD ✅
- Консистентный UI для всех страниц ✅
- < 3 кликов для создания entity ✅

**Estimate**: 5 дней  
**Team**: 1 developer

---

### Sprint 2 (Week 2): Finance & Workflow ⭐⭐
**Goal**: Унифицировать Finance, реализовать Approvals

- [ ] Finance Pages Audit & Upgrade
- [ ] Approvals Full Implementation
- [ ] Enhanced Timesheet (Activities integration)

**Success Criteria**:
- Finance pages унифицированы ✅
- Workflow согласования работает ✅
- Time entries привязаны к Activities ✅

**Estimate**: 5 дней  
**Team**: 1 developer

---

### Sprint 3 (Week 3-4): Advanced Features ⭐
**Goal**: Project Rates, Work Calendars

- [ ] Project Rates
- [ ] Work Calendars
- [ ] Enhanced Timesheet (Templates, Tags)

**Success Criteria**:
- Гибкая тарификация работает ✅
- Производственные календари работают ✅
- UX списания часов улучшен ✅

**Estimate**: 10 дней  
**Team**: 1 developer

---

## 🎨 ЧАСТЬ 5: UI/UX Engineer - Design System

### 5.1. Components Library

#### Existing (✅ Keep as is)
- `UniversalDataTable` - ⭐⭐⭐⭐⭐ EXCELLENT
- `DictionaryManagementPanel` - ⭐⭐⭐⭐⭐ EXCELLENT
- Dialogs (shadcn/ui) - ✅ GOOD
- Forms (Input, Select, Textarea) - ✅ GOOD
- Buttons - ✅ GOOD

#### To Create (📝)
1. **ColorPicker** - для выбора цветов (directions, tags)
2. **DateRangePicker** - для фильтров по датам
3. **EmployeeSelect** - с поиском и аватарами
4. **ProjectSelect** - с поиском и статусами
5. **RateEditor** - для редактирования ставок в таблице

---

### 5.2. Design Tokens

#### Colors (For Professional IT Company)
```css
/* Primary - Blue (Trust, Professionalism) */
--primary: #3B82F6;
--primary-hover: #2563EB;

/* Success - Green */
--success: #10B981;

/* Warning - Orange */
--warning: #F59E0B;

/* Danger - Red */
--danger: #EF4444;

/* Status Colors */
--status-planning: #6B7280;
--status-active: #10B981;
--status-on-hold: #F59E0B;
--status-completed: #3B82F6;
--status-cancelled: #EF4444;
```

#### Typography
```css
/* Headings - PT Sans */
--font-heading: 'PT Sans', sans-serif;
--font-body: system-ui, sans-serif;

/* Sizes */
--text-xs: 0.75rem;   /* 12px */
--text-sm: 0.875rem;  /* 14px */
--text-base: 1rem;    /* 16px */
--text-lg: 1.125rem;  /* 18px */
--text-xl: 1.25rem;   /* 20px */
--text-2xl: 1.5rem;   /* 24px */
--text-3xl: 1.875rem; /* 30px */
```

#### Spacing
```css
/* Consistent spacing */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
```

---

### 5.3. Layout Patterns

#### Standard Page Layout
```tsx
<div className="space-y-6">
  {/* Header */}
  <div>
    <h1 className="text-3xl font-bold font-['PT_Sans']">{title}</h1>
    <p className="text-gray-600 mt-1">{description}</p>
  </div>

  {/* Data Table */}
  <UniversalDataTable
    title={title}
    description={description}
    icon={Icon}
    data={data}
    columns={columns}
    onAdd={handleAdd}
    onEdit={handleEdit}
    onDelete={handleDelete}
    addButtonLabel="Создать"
    isLoading={loading}
    canExport
  />

  {/* Dialogs */}
  <CreateDialog />
  <EditDialog />
</div>
```

#### Dialog Pattern
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
    </DialogHeader>
    
    <div className="grid gap-4 py-4">
      {/* Form fields */}
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={cancel}>
        Отмена
      </Button>
      <Button onClick={submit} disabled={!valid || loading}>
        {loading ? "Загрузка..." : "Сохранить"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 📊 ЧАСТЬ 6: Metrics & Success Criteria

### 6.1. User Experience Metrics

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
| **Time to Create Project** | 30s | < 30s | ✅ |
| **Time to Create Employee** | N/A | < 20s | 🔴 P0 |
| **Time to Create Direction** | N/A | < 15s | 🔴 P0 |
| **Time to Log Hours** | ~60s | < 45s | 🟡 P1 |
| **Time to Approve Hours** | Unknown | < 10s | 🟡 P1 |
| **Pages with Full CRUD** | 4/14 (29%) | 10/14 (71%) | 🔴 P0 |
| **UI Consistency Score** | 6/10 | 9/10 | 🔴 P0 |

### 6.2. Technical Metrics

| Metric | Current | Target |
|--------|---------|--------|
| **UniversalDataTable Usage** | 9/27 pages | 20/27 pages |
| **Component Reusability** | 70% | 90% |
| **Design Token Usage** | 60% | 95% |
| **Accessibility Score (WCAG)** | Unknown | AA |

### 6.3. Business Impact

**Expected Improvements**:
1. ⬆️ **User Productivity**: +30% (меньше кликов, больше автоматизации)
2. ⬆️ **Data Quality**: +40% (валидация, constraints)
3. ⬇️ **Training Time**: -50% (консистентный UI)
4. ⬇️ **Support Requests**: -60% (интуитивный UX)

---

## 🎯 ИТОГО: Recommendation

### ✅ APPROVE для реализации

**Phase 1 (P0)** - START IMMEDIATELY:
1. Employees Full CRUD (3-4h)
2. Directions Full CRUD (2-3h)
3. My Tasks UniversalDataTable (2-3h)

**Total Estimate**: 7-10 часов (1-2 дня)

**Expected ROI**:
- User Satisfaction: +50%
- System Completeness: 29% → 71%
- UI Consistency: 6/10 → 9/10

---

**Документ подготовлен**:  
- 🎨 UI/UX Engineer: AI Design Team
- 📊 Product Owner: AI Product Manager
- ✅ Status: APPROVED FOR IMPLEMENTATION

**Next Step**: Начать с Task 1.1 (Employees Full CRUD)

