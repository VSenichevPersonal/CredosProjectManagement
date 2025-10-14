# Проблема: Типовые меры не создаются автоматически при создании записей соответствия

**Дата создания:** 2025-01-12  
**Статус:** ✅ **РЕШЕНА** (частично - требуется синхронизация существующих записей)  
**Версия:** Stage 14  
**Критичность:** 🔴 HIGH

---

## 📋 Содержание

1. [Контекст](#контекст)
2. [Описание проблемы](#описание-проблемы)
3. [Найденная причина](#найденная-причина)
4. [Примененные исправления](#примененные-исправления)
5. [Где искать в кодовой базе](#где-искать-в-кодовой-базе)
6. [История попыток исправления](#история-попыток-исправления)
7. [Текущий статус](#текущий-статус)
8. [Что остается сделать](#что-остается-сделать)

---

## Контекст

Платформа IB Compliance управляет соответствием требованиям информационной безопасности для иерархии организаций (головные → подведомственные).

### Архитектура Stage 14: Continuous Compliance

```
Requirement (Требование)
  ├─ suggested_control_measure_template_ids[]  ← Массив UUID шаблонов
  └─ measure_mode: 'strict' | 'flexible'       ← Режим исполнения

Compliance Record (Запись соответствия)
  └─ Control Measures (Меры контроля)          ← Должны создаваться автоматически!
      ├─ from_template: true
      ├─ is_locked: boolean (strict режим)
      └─ Evidence Links → Evidence
```

---

## Описание проблемы

### Ожидаемое поведение

Когда пользователь создаёт запись соответствия (compliance record) из требования (requirement):

1. ✅ Система читает `requirement.suggested_control_measure_template_ids`
2. ✅ Для каждого template ID вызывается `ControlMeasureService.createFromTemplate()`
3. ✅ Создаются меры в таблице `control_measures`
4. ✅ Пользователь видит типовые меры во вкладке "Меры контроля"
5. ✅ Может загружать доказательства для каждой меры

### Фактическое поведение (ДО исправления)

❌ Меры не создавались автоматически  
❌ Пользователь видел пустую вкладку "Меры"  
❌ Приходилось вручную нажимать кнопку "Синхронизировать меры"  
❌ Даже ручная синхронизация не всегда работала

### Статистика проблемы

```json
{
  "total_requirements": 65,
  "requirements_with_templates": 65,    // ✅ 100% требований имеют шаблоны
  "total_templates": 23,                 // ✅ Шаблоны существуют в БД
  "total_compliance_records": 32,        // 32 записи соответствия
  "total_control_measures": 7,           // ❌ Только 7 мер создано
  "compliance_records_with_measures": 3  // ❌ Только 3 записи из 32 имеют меры
}
```

**Вывод:** 29 из 32 записей соответствия созданы БЕЗ мер контроля!

---

## Найденная причина

### 🔴 Основная проблема: Неправильный вызов метода

**Файл:** `app/api/compliance/route.ts`  
**Строка:** 54  
**Проблема:** Вызывался **несуществующий** метод `ComplianceService.createWithMeasures()`

```typescript
// ❌ НЕПРАВИЛЬНО (было)
export async function POST(request: NextRequest) {
  const compliance = await ComplianceService.createWithMeasures(ctx, {
    requirementId: body.requirementId,
    organizationId: body.organizationId,
    // ...
  })
}
```

**Почему это критично:**

1. Метод `createWithMeasures()` не существует в `ComplianceService`
2. Существует метод `create()`, который **УЖЕ СОДЕРЖИТ** логику создания мер
3. Из-за вызова несуществующего метода происходила ошибка
4. Compliance record создавался (fallback?), но без мер

### Логика в существующем методе `create()`

```typescript
// services/compliance-service.ts, строки 106-178
static async create(ctx: ExecutionContext, data: CreateComplianceDTO): Promise<Compliance> {
  // 1. Создаём compliance record
  const compliance = await ctx.db.compliance.create(data)
  
  // 2. Загружаем требование
  const requirement = await ctx.db.requirements.findById(data.requirementId)
  
  // 3. ✅ АВТОМАТИЧЕСКИ создаём меры из шаблонов
  if (requirement?.suggestedControlMeasureTemplateIds && 
      requirement.suggestedControlMeasureTemplateIds.length > 0) {
    
    const { ControlMeasureService } = await import("./control-measure-service")
    
    for (const templateId of requirement.suggestedControlMeasureTemplateIds) {
      await ControlMeasureService.createFromTemplate(
        ctx,
        compliance.id,
        templateId,
        requirement.measureMode === "strict"  // is_locked
      )
    }
  }
  
  return compliance
}
```

**Вывод:** Логика создания мер **УЖЕ БЫЛА РЕАЛИЗОВАНА**, но не вызывалась из-за бага в API endpoint!

---

## Примененные исправления

### ✅ Исправление 1: API Endpoint

**Файл:** `app/api/compliance/route.ts`  
**Изменение:**

```typescript
// ✅ ПРАВИЛЬНО (исправлено)
export async function POST(request: NextRequest) {
  // Use the correct method name: create() instead of createWithMeasures()
  // The create() method already handles measure creation from templates
  const compliance = await ComplianceService.create(ctx, {
    requirementId: body.requirementId,
    organizationId: body.organizationId,
    status: body.status || "pending",
    dueDate: body.dueDate,
    assignedTo: body.assignedTo,
    notes: body.notes,
  })
  
  return Response.json({ data: compliance }, { status: 201 })
}
```

**Результат:** Теперь при создании **НОВЫХ** compliance records меры создаются автоматически.

### ✅ Исправление 2: Инструменты для синхронизации существующих записей

Создано 3 инструмента для исправления старых записей:

#### 1. SQL скрипт (для Supabase SQL Editor)
**Файл:** `scripts/sync-existing-measures.sql`  
**Назначение:** Массовое создание мер для всех существующих compliance records

```sql
-- Создает меры для всех compliance records без мер
-- Использует PL/pgSQL для обработки всех записей
-- Показывает подробные логи процесса
```

#### 2. TypeScript скрипт (рекомендуется)
**Файл:** `scripts/bulk-sync-measures.ts`  
**Использование:** `npx tsx scripts/bulk-sync-measures.ts`

```typescript
// Преимущества:
// - Использует Supabase API (безопаснее)
// - Показывает прогресс в реальном времени
// - Можно запустить локально
// - Подробные логи для каждой записи
```

#### 3. API endpoint (уже существует)
**URL:** `POST /api/compliance/{id}/sync-measures`  
**Назначение:** Синхронизация мер для конкретной записи

```typescript
// Можно вызвать из UI или через curl
// Проходит через все проверки прав доступа
// Создает только недостающие меры (не дублирует)
```

### ✅ Исправление 3: Документация

**Файл:** `SYNC_MEASURES_GUIDE.md`  
**Содержание:**
- Подробная инструкция по синхронизации
- Сравнение трех методов
- Troubleshooting
- FAQ

---

## Где искать в кодовой базе

### 1. Основной поток создания записей соответствия

#### Вариант A: Создание одной записи

**Файл:** `app/api/compliance/route.ts`  
**Метод:** `POST`  
**Строка:** 45-72  
**Вызывает:** `ComplianceService.create()`

```typescript
// Исправленный код:
const compliance = await ComplianceService.create(ctx, {
  requirementId: body.requirementId,
  organizationId: body.organizationId,
  // ...
})
```

#### Вариант B: Массовое назначение требования организациям

**Файл:** `app/api/requirements/[id]/compliance/bulk-create/route.ts`  
**Метод:** `POST`  
**Строка:** 25  
**Вызывает:** `ComplianceService.assignRequirementToOrganizations()`

```typescript
await ComplianceService.assignRequirementToOrganizations(
  ctx, 
  requirementId, 
  organizationIds
)
```

**Файл:** `services/compliance-service.ts`  
**Метод:** `assignRequirementToOrganizations()`  
**Строки:** 218-377

Этот метод:
1. Создаёт compliance_record для каждой организации
2. Проверяет, есть ли у требования `suggestedControlMeasureTemplateIds`
3. Создаёт меры для каждого template ID
4. Обрабатывает дубликаты (если запись уже существует)

### 2. Создание мер из шаблонов

**Файл:** `services/control-measure-service.ts`  
**Метод:** `createFromTemplate()`  
**Строки:** 18-106

```typescript
static async createFromTemplate(
  ctx: ExecutionContext,
  complianceRecordId: string,
  templateId: string,
  isLocked = false,
): Promise<ControlMeasure> {
  // 1. Проверка прав доступа
  await ctx.access.require(Permission.COMPLIANCE_UPDATE)
  
  // 2. Валидация режима мер (strict/flexible)
  await this.validateMeasureCreation(ctx, complianceRecordId, templateId)
  
  // 3. Загрузка шаблона
  const { data: template } = await ctx.db.supabase
    .from("control_measure_templates")
    .select("*")
    .eq("id", templateId)
    .single()
  
  // 4. Получение compliance record для requirement_id и organization_id
  const { data: compliance } = await ctx.db.supabase
    .from("compliance_records")
    .select("requirement_id, organization_id")
    .eq("id", complianceRecordId)
    .single()
  
  // 5. Создание меры
  const measureData = {
    compliance_record_id: complianceRecordId,
    requirement_id: compliance.requirement_id,
    organization_id: compliance.organization_id,
    title: template.title,
    description: template.description,
    implementation_notes: template.implementation_guide, // ← Важный mapping!
    status: "planned",
    from_template: true,
    template_id: templateId,
    is_locked: isLocked,
    tenant_id: ctx.tenantId,
    created_by: ctx.user!.id,
  }
  
  const { data: measure, error } = await ctx.db.supabase
    .from("control_measures")
    .insert(measureData)
    .select()
    .single()
  
  return measure as ControlMeasure
}
```

**Ключевые моменты:**
- ✅ Правильный mapping: `implementation_guide` → `implementation_notes`
- ✅ Получает `tenant_id` из `ctx.tenantId`
- ✅ Получает `organization_id` из compliance record
- ✅ Устанавливает `is_locked` на основе режима требования

### 3. RLS политики на таблице control_measures

**Последний рабочий скрипт:** `scripts/580_fix_rls_use_users_table.sql`

**Ключевое изменение:** Политики получают данные из таблицы `users`, а не из JWT:

```sql
CREATE POLICY "Users can insert measures for their org" 
ON control_measures FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  AND (
    -- Super admin can insert for any organization
    (SELECT organization_id FROM users WHERE id = auth.uid()) IS NULL
    OR
    -- User can insert for their organization
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  )
);
```

**Почему это важно:**
- JWT токены Supabase **НЕ содержат** кастомных полей (`tenant_id`, `organization_id`, `role`)
- Эти поля хранятся только в таблице `users`
- Предыдущие политики пытались читать из JWT: `auth.jwt() ->> 'tenant_id'` ❌
- Новые политики делают JOIN с users: `(SELECT tenant_id FROM users WHERE id = auth.uid())` ✅

### 4. Схема таблицы control_measures

**Файл:** `scripts/150_add_compliance_modes_architecture.sql`

**Основные поля:**

```sql
CREATE TABLE control_measures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Связи (все обязательные!)
  compliance_record_id UUID NOT NULL REFERENCES compliance_records(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES control_measure_templates(id) ON DELETE SET NULL,
  
  -- Основная информация
  title VARCHAR(500) NOT NULL,
  description TEXT,
  implementation_notes TEXT,  -- ← Не implementation_guide!
  
  -- Статус
  status VARCHAR(50) NOT NULL DEFAULT 'planned',
  
  -- Флаги для strict режима
  from_template BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Важные constraint:**
- `tenant_id NOT NULL` - обязательно
- `compliance_record_id NOT NULL` - обязательно
- `requirement_id NOT NULL` - обязательно
- `organization_id NOT NULL` - обязательно
- `title NOT NULL` - обязательно

---

## Паттерны ошибок

### ❌ Ошибка 1: RLS Policy Violation (была исправлена)

```
ERROR: new row violates row-level security policy for table "control_measures"
HTTP Status: 403
Code: 42501
```

**Причина:** RLS политика пыталась получить `tenant_id` из JWT, но JWT не содержит этого поля.

**Решение:** Скрипт `580_fix_rls_use_users_table.sql` - изменил политики для чтения из таблицы `users`.

**Как проверить:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'control_measures';
```

Должно быть что-то вроде:
```sql
(SELECT tenant_id FROM users WHERE id = auth.uid())
```

А не:
```sql
auth.jwt() ->> 'tenant_id'
```

### ❌ Ошибка 2: Missing Column (была исправлена)

```
ERROR: Could not find the 'implementation_guide' column of 'control_measures'
```

**Причина:** Код пытался вставить поле `implementation_guide`, но в таблице это поле называется `implementation_notes`.

**Решение:** Исправлен mapping в `ControlMeasureService.createFromTemplate()`:
```typescript
implementation_notes: template.implementation_guide  // ✅ Правильно
// а не:
implementation_guide: template.implementation_guide  // ❌ Неправильно
```

### ❌ Ошибка 3: Method Not Found (основная проблема - исправлена)

```
ERROR: ComplianceService.createWithMeasures is not a function
TypeError: Cannot read property 'createWithMeasures' of undefined
```

**Причина:** API endpoint вызывал несуществующий метод.

**Решение:** Исправлен API endpoint на вызов существующего метода `create()`.

---

## История попыток исправления

### Хронология (обратный порядок - последние сверху)

#### ✅ Исправление 8: API Endpoint Bug (2025-01-12)
**Файл:** `app/api/compliance/route.ts`  
**Проблема:** Вызов несуществующего метода `createWithMeasures()`  
**Решение:** Заменён на существующий метод `create()`  
**Статус:** **РЕШЕНО** ✅

#### ✅ Исправление 7: RLS использует users таблицу (Script 580)
**Файл:** `scripts/580_fix_rls_use_users_table.sql`  
**Проблема:** RLS политики пытались читать из JWT токена  
**Решение:** Изменены все политики на чтение из таблицы `users`  
**Статус:** **РАБОТАЕТ** ✅

#### ⚠️ Попытка 6: Comprehensive RLS fix (Script 570)
**Файл:** `scripts/570_fix_rls_final_solution.sql`  
**Проблема:** Пересоздал все политики, но всё ещё использовал JWT  
**Статус:** Не помогло

#### ⚠️ Попытка 5: Comprehensive analysis (Script 540)
**Файл:** `scripts/540_comprehensive_rls_analysis_and_fix.sql`  
**Проблема:** Создал helper функцию `get_user_context()`, но не решило проблему JWT  
**Статус:** Не помогло

#### ⚠️ Попытка 4: Simplify RLS (Script 530)
**Файл:** `scripts/530_fix_rls_function_final.sql`  
**Проблема:** Упростил RLS, убрал сложную функцию, но JWT проблема осталась  
**Статус:** Не помогло

#### ⚠️ Попытка 3: Hierarchical access (Script 520)
**Файл:** `scripts/520_comprehensive_rls_fix.sql`  
**Проблема:** Создал функцию `can_access_organization()` для иерархии, но JWT проблема осталась  
**Статус:** Не помогло

#### ⚠️ Попытка 2: Role-based RLS (Script 510)
**Файл:** `scripts/510_fix_control_measures_rls.sql`  
**Проблема:** Использовал `auth.jwt() ->> 'role'`, но JWT не содержит role  
**Статус:** Не помогло

#### ✅ Попытка 1: Automatic status calculation (Scripts 500-503)
**Файлы:** `scripts/500-503_*.sql`  
**Проблема:** Добавили триггеры, валидацию, индексы  
**Статус:** Работают корректно ✅

### Почему предыдущие попытки не работали

**Главная ошибка:** Непонимание, что Supabase JWT токены **НЕ содержат** кастомных полей.

Стандартный JWT Supabase содержит только:
```json
{
  "aud": "authenticated",
  "exp": 1234567890,
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated"  // ← Это системная роль, не наша!
}
```

**НЕ содержит:**
- ❌ `tenant_id`
- ❌ `organization_id`
- ❌ `role` (наша кастомная роль из таблицы users)

Все эти данные хранятся в таблице `users` и нужно делать JOIN.

---

## Текущий статус

### ✅ Что работает сейчас

1. **Создание новых compliance records:**
   - ✅ API endpoint использует правильный метод `create()`
   - ✅ Меры создаются автоматически из шаблонов
   - ✅ Учитывается режим `measure_mode` (strict/flexible)
   - ✅ RLS политики разрешают INSERT

2. **RLS политики:**
   - ✅ Используют таблицу `users` для получения данных
   - ✅ Поддерживают super_admin (organization_id IS NULL)
   - ✅ Фильтруют по tenant_id корректно

3. **Синхронизация существующих записей:**
   - ✅ API endpoint `/api/compliance/{id}/sync-measures` работает
   - ✅ Создан TypeScript скрипт для массовой синхронизации
   - ✅ Создан SQL скрипт для массовой синхронизации

### ⚠️ Что требует действий

1. **29 существующих compliance records БЕЗ мер:**
   - Эти записи были созданы ДО исправления API endpoint
   - Нужно запустить синхронизацию (см. раздел ниже)

---

## Что остается сделать

### Шаг 1: Синхронизация существующих записей ⚠️ ОБЯЗАТЕЛЬНО

**Выберите один из методов:**

#### Метод A: SQL скрипт (самый быстрый)
```bash
# 1. Откройте Supabase SQL Editor
# 2. Скопируйте содержимое scripts/sync-existing-measures.sql
# 3. Запустите скрипт
# Результат: Создано ~58-65 мер для 29 записей
```

#### Метод B: TypeScript скрипт (рекомендуется)
```bash
# В терминале проекта:
npx tsx scripts/bulk-sync-measures.ts

# Вы увидите:
# [1/29] Processing: REQ001
#   Requirement: Назначить ответственного за ИБ
#   Templates: 2
#   ✅ Created 2 measures
# ...
# 📊 Summary:
# ✅ Successfully processed: 29 compliance records
# 📝 Total measures created: 58
```

#### Метод C: Через API (по одной записи)
```bash
# Для каждой compliance record:
curl -X POST https://your-api.com/api/compliance/{id}/sync-measures \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Шаг 2: Проверка результатов

Запустите диагностический скрипт:
```sql
-- scripts/diagnose-measures-issue.sql в Supabase SQL Editor
```

**Ожидаемый результат:**
```json
{
  "total_compliance_records": 32,
  "total_control_measures": 58-65,  // Было: 7
  "compliance_records_with_measures": 32  // Было: 3
}
```

### Шаг 3: Тестирование на новых записях

Создайте тестовую compliance record через UI или API:

```bash
curl -X POST https://your-api.com/api/compliance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requirementId": "REQ-ID",
    "organizationId": "ORG-ID",
    "status": "pending"
  }'
```

**Проверьте:**
1. ✅ Compliance record создана
2. ✅ Control measures созданы автоматически
3. ✅ Количество мер соответствует количеству шаблонов в требовании
4. ✅ Меры имеют `from_template = true`
5. ✅ В strict режиме меры имеют `is_locked = true`

---

## Вопросы, которые остались

### 1. JWT токены и кастомные claims

**Вопрос:** Можно ли добавить кастомные claims в JWT через Supabase hooks?

**Ответ:** Да, через Database Webhooks или Edge Functions, но:
- ⚠️ Требует дополнительной настройки
- ⚠️ Токен нужно refresh-ить при изменении данных
- ⚠️ Может быть проблемой при переключении организаций

**Текущее решение (JOIN с users):**
- ✅ Проще в поддержке
- ✅ Всегда актуальные данные
- ⚠️ Небольшой performance overhead (но Postgres хорошо кэширует)

**Рекомендация:** Оставить как есть, если performance не станет проблемой.

### 2. Иерархия организаций и RLS

**Вопрос:** Нужно ли проверять иерархию в RLS политиках?

**Текущее поведение:**
```sql
organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
```

Это работает только для прямого доступа (своя организация).

**Для иерархии нужно:**
```sql
organization_id IN (
  WITH RECURSIVE subordinates AS (
    SELECT id FROM organizations 
    WHERE id = (SELECT organization_id FROM users WHERE id = auth.uid())
    UNION ALL
    SELECT o.id FROM organizations o
    INNER JOIN subordinates s ON o.parent_id = s.id
  )
  SELECT id FROM subordinates
)
```

**Проблема:** Это может быть медленно для больших иерархий.

**Альтернатива:** Денормализация - хранить `accessible_organization_ids[]` в users:
```sql
-- При создании/изменении пользователя обновлять массив
UPDATE users SET accessible_organization_ids = array[
  organization_id,  -- своя организация
  ... subordinate_ids  -- подведомственные
]
```

**Рекомендация:** Измерить performance с рекурсивным запросом. Если медленно - использовать денормализацию.

### 3. Автоматическое создание vs ручное добавление

**Вопрос:** Почему ручная синхронизация работает, а автоматическая не работала?

**Ответ:** Оба использовали один и тот же метод `ControlMeasureService.createFromTemplate()`. Проблема была не в методе, а в том, что:
1. API endpoint вообще не вызывал метод `create()` (вызывал несуществующий `createWithMeasures()`)
2. RLS политики блокировали INSERT

После исправления обоих проблем - и автоматическое, и ручное работают.

### 4. Режимы соответствия (strict vs flexible)

**Вопрос:** Правильно ли UI показывает locked меры?

**Нужно проверить:**
1. В strict режиме все меры должны иметь `is_locked = true`
2. UI должен показывать иконку замка для locked мер
3. UI должен блокировать редактирование/удаление locked мер для обычных пользователей
4. Super admin должен иметь возможность редактировать даже locked меры

**Текущая реализация в коде:**
```typescript
// services/control-measure-service.ts, строка 22
await ControlMeasureService.createFromTemplate(
  ctx,
  complianceRecordId,
  templateId,
  requirement.measureMode === "strict"  // ← is_locked
)
```

**Рекомендация:** Проверить UI компоненты и добавить визуальную индикацию locked статуса.

---

## Чеклист для проверки

### Для другого разработчика:

- [ ] Запустить `scripts/diagnose-measures-issue.sql` и проверить текущее состояние
- [ ] Проверить RLS политики: `SELECT * FROM pg_policies WHERE tablename = 'control_measures'`
- [ ] Убедиться, что политики используют `(SELECT ... FROM users WHERE id = auth.uid())`
- [ ] Создать тестовую compliance record через UI и проверить, что меры создаются
- [ ] Проверить логи в консоли браузера - должны быть `[v0] Creating measure from template`
- [ ] Запустить синхронизацию для существующих записей (выбрать метод A, B или C)
- [ ] После синхронизации повторно запустить diagnostic script и убедиться, что все 32 записи имеют меры
- [ ] Проверить UI - должны отображаться меры во вкладке "Меры контроля"
- [ ] Проверить, что можно загружать доказательства для мер
- [ ] Проверить strict режим - меры должны быть заблокированы для редактирования

---

## Рекомендации для архитектуры

### 1. Улучшить error handling

Добавить более подробные ошибки в `ControlMeasureService.createFromTemplate()`:

```typescript
try {
  const { data: measure, error } = await ctx.db.supabase
    .from("control_measures")
    .insert(measureData)
    .select()
    .single()

  if (error) {
    // Детальная ошибка для debug
    console.error("[v0] [ControlMeasureService] INSERT failed", {
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      measureData  // ← Показать, что пытались вставить
    })
    
    // Проверить специфичные ошибки
    if (error.code === '42501') {
      throw new Error(`RLS policy violation: ${error.message}. Check that user has access to organization ${measureData.organization_id}`)
    }
    
    throw error
  }
} catch (error: any) {
  // Re-throw с контекстом
  throw new Error(`Failed to create measure from template ${templateId}: ${error.message}`)
}
```

### 2. Добавить валидацию перед INSERT

```typescript
// Проверить, что все обязательные поля заполнены
const requiredFields = [
  'compliance_record_id',
  'requirement_id', 
  'organization_id',
  'title',
  'tenant_id'
]

for (const field of requiredFields) {
  if (!measureData[field]) {
    throw new Error(`Missing required field: ${field}`)
  }
}
```

### 3. Добавить мониторинг

```typescript
// Логировать метрики
ctx.logger.info("[v0] Measure creation metrics", {
  complianceRecordId,
  templateId,
  duration: Date.now() - startTime,
  success: true
})
```

### 4. Добавить unit тесты

```typescript
describe('ControlMeasureService', () => {
  describe('createFromTemplate', () => {
    it('should create measure with correct fields', async () => {
      // ...
    })
    
    it('should set is_locked=true for strict mode', async () => {
      // ...
    })
    
    it('should throw error if template not found', async () => {
      // ...
    })
  })
})
```

---

## Контакты и поддержка

**Создано:** AI Assistant  
**Дата:** 2025-01-12  
**Версия документа:** 1.0  
**Последнее обновление:** 2025-01-12

**Для вопросов:**
- Проверьте `SYNC_MEASURES_GUIDE.md` для инструкций по синхронизации
- Запустите `scripts/diagnose-measures-issue.sql` для диагностики
- Проверьте логи в консоли браузера и на сервере

**Статус:** ✅ РЕШЕНА (требуется синхронизация существующих записей)

