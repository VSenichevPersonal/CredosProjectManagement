# Управление справочниками в админке

## Обзор

В Stage 11 добавлена полная поддержка управления справочниками для режимов исполнения требований через админку.

## Новые справочники

### 1. Типы доказательств (Evidence Types)

**Назначение:** Справочник типов доказательств для валидации в strict режиме.

**Расположение:** `/admin/dictionaries/evidence-types`

**Поля:**
- `name` - название типа (обязательное)
- `description` - описание типа
- `icon` - иконка для UI
- `sort_order` - порядок сортировки

**Примеры:**
- Приказ
- Политика
- Инструкция
- Протокол
- Отчет
- Скриншот
- Журнал
- Сертификат

**Использование:**
- В strict режиме организация может загружать только разрешенные типы
- В flexible режиме справочник используется для подсказок

### 2. Шаблоны мер контроля (Control Measure Templates)

**Назначение:** Предопределенные меры, рекомендованные регулятором.

**Расположение:** `/admin/dictionaries/control-measure-templates`

**Поля:**
- `title` - название меры (обязательное)
- `description` - описание меры
- `implementation_guide` - инструкция по внедрению
- `category` - категория меры
- `sort_order` - порядок сортировки

**Примеры:**
- Назначение ответственного за ПДн
- Разработка политики информационной безопасности
- Проведение обучения сотрудников
- Внедрение системы контроля доступа
- Резервное копирование данных

**Использование:**
- В strict режиме организация выбирает только из предложенных шаблонов
- В flexible режиме шаблоны используются как рекомендации

## Архитектура

### Database Provider

Добавлены методы для работы с новыми справочниками:

\`\`\`typescript
interface DatabaseProvider {
  evidenceTypes: {
    findMany(ctx: ExecutionContext): Promise<EvidenceType[]>
    findById(ctx: ExecutionContext, id: string): Promise<EvidenceType | null>
    create(ctx: ExecutionContext, data: CreateEvidenceTypeDTO): Promise<EvidenceType>
    update(ctx: ExecutionContext, id: string, data: UpdateEvidenceTypeDTO): Promise<EvidenceType>
    delete(ctx: ExecutionContext, id: string): Promise<void>
  }
  
  controlMeasureTemplates: {
    findMany(ctx: ExecutionContext): Promise<ControlMeasureTemplate[]>
    findById(ctx: ExecutionContext, id: string): Promise<ControlMeasureTemplate | null>
    create(ctx: ExecutionContext, data: CreateControlMeasureTemplateDTO): Promise<ControlMeasureTemplate>
    update(ctx: ExecutionContext, id: string, data: UpdateControlMeasureTemplateDTO): Promise<ControlMeasureTemplate>
    delete(ctx: ExecutionContext, id: string): Promise<void>
  }
}
\`\`\`

### API Endpoints

#### Типы доказательств

\`\`\`
GET    /api/dictionaries/evidence-types
POST   /api/dictionaries/evidence-types
GET    /api/dictionaries/evidence-types/[id]
PATCH  /api/dictionaries/evidence-types/[id]
DELETE /api/dictionaries/evidence-types/[id]
\`\`\`

**Пример запроса:**
\`\`\`typescript
// GET /api/dictionaries/evidence-types
const response = await fetch('/api/dictionaries/evidence-types')
const evidenceTypes = await response.json()

// POST /api/dictionaries/evidence-types
const response = await fetch('/api/dictionaries/evidence-types', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Приказ',
    description: 'Приказ руководителя организации',
    icon: 'file-text',
    sort_order: 1
  })
})
\`\`\`

#### Шаблоны мер контроля

\`\`\`
GET    /api/dictionaries/control-measure-templates
POST   /api/dictionaries/control-measure-templates
GET    /api/dictionaries/control-measure-templates/[id]
PATCH  /api/dictionaries/control-measure-templates/[id]
DELETE /api/dictionaries/control-measure-templates/[id]
\`\`\`

**Пример запроса:**
\`\`\`typescript
// GET /api/dictionaries/control-measure-templates
const response = await fetch('/api/dictionaries/control-measure-templates')
const templates = await response.json()

// POST /api/dictionaries/control-measure-templates
const response = await fetch('/api/dictionaries/control-measure-templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Назначение ответственного за ПДн',
    description: 'Назначить ответственного за обработку персональных данных',
    implementation_guide: '1. Издать приказ\n2. Ознакомить сотрудника\n3. Внести в реестр',
    category: 'Организационные меры',
    sort_order: 1
  })
})
\`\`\`

## UI компоненты

### Страница списка справочников

**Расположение:** `/admin/dictionaries`

**Функционал:**
- Список всех справочников, разделенных на категории
- Ссылки на страницы управления каждым справочником
- Счетчики количества записей

**Новые справочники в списке:**
- Типы доказательств (Evidence Types)
- Шаблоны мер контроля (Control Measure Templates)

### Страница управления типами доказательств

**Расположение:** `/admin/dictionaries/evidence-types`

**Функционал:**
- Таблица с типами доказательств
- Кнопка "Добавить тип"
- Действия: редактировать, удалить
- Сортировка по `sort_order`
- Поиск по названию

**Колонки таблицы:**
- Название
- Описание
- Иконка
- Порядок сортировки
- Действия

### Страница управления шаблонами мер

**Расположение:** `/admin/dictionaries/control-measure-templates`

**Функционал:**
- Таблица с шаблонами мер
- Кнопка "Добавить шаблон"
- Действия: редактировать, удалить
- Сортировка по `sort_order`
- Поиск по названию
- Фильтр по категории

**Колонки таблицы:**
- Название
- Описание
- Категория
- Порядок сортировки
- Действия

## Права доступа

### Кто может управлять справочниками?

**Super Admin:**
- ✅ Полный доступ ко всем справочникам
- ✅ Создание, редактирование, удаление

**Regulator:**
- ✅ Полный доступ ко всем справочникам
- ✅ Создание, редактирование, удаление

**Compliance Manager:**
- ✅ Просмотр справочников
- ❌ Создание, редактирование, удаление

**Compliance Officer:**
- ✅ Просмотр справочников
- ❌ Создание, редактирование, удаление

**User:**
- ✅ Просмотр справочников
- ❌ Создание, редактирование, удаление

### Проверка прав в API

\`\`\`typescript
// Проверка прав на создание/редактирование
if (!['super_admin', 'regulator'].includes(ctx.user.role)) {
  return NextResponse.json(
    { error: 'Access denied' },
    { status: 403 }
  )
}
\`\`\`

## Мультитенантность

### Изоляция данных

Все справочники изолированы по `tenant_id`:

\`\`\`typescript
// Автоматическая фильтрация по tenant_id
const evidenceTypes = await ctx.db.evidenceTypes.findMany(ctx)
// Вернет только типы для текущего тенанта
\`\`\`

### RLS политики

\`\`\`sql
-- Политика для evidence_types
CREATE POLICY "Users can only access their tenant evidence types"
ON evidence_types
FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Политика для control_measure_templates
CREATE POLICY "Users can only access their tenant templates"
ON control_measure_templates
FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
\`\`\`

## Примеры использования

### Пример 1: Создание типа доказательства

\`\`\`typescript
// В админке
const newEvidenceType = {
  name: 'Приказ',
  description: 'Приказ руководителя организации',
  icon: 'file-text',
  sort_order: 1
}

// API вызов
const response = await fetch('/api/dictionaries/evidence-types', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newEvidenceType)
})

const created = await response.json()
console.log('Создан тип:', created)
\`\`\`

### Пример 2: Создание шаблона меры

\`\`\`typescript
// В админке
const newTemplate = {
  title: 'Назначение ответственного за ПДн',
  description: 'Назначить ответственного за обработку персональных данных',
  implementation_guide: `
    1. Издать приказ о назначении ответственного
    2. Ознакомить сотрудника с должностной инструкцией
    3. Внести информацию в реестр ответственных лиц
    4. Провести вводное обучение
  `,
  category: 'Организационные меры',
  sort_order: 1
}

// API вызов
const response = await fetch('/api/dictionaries/control-measure-templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newTemplate)
})

const created = await response.json()
console.log('Создан шаблон:', created)
\`\`\`

### Пример 3: Использование в требовании

\`\`\`typescript
// Создание требования с использованием справочников
const requirement = {
  title: 'Обеспечение защиты ПДн',
  measure_mode: 'strict',
  evidence_type_mode: 'strict',
  
  // Используем ID из справочника шаблонов
  suggested_control_measure_template_ids: [
    'template-1', // Назначение ответственного
    'template-2', // Разработка политики
    'template-3'  // Проведение обучения
  ],
  
  // Используем ID из справочника типов доказательств
  allowed_evidence_type_ids: [
    'type-1', // Приказ
    'type-2', // Политика
    'type-3'  // Протокол
  ]
}
\`\`\`

## Лучшие практики

### Для администраторов

1. **Создавайте понятные названия** - используйте термины, понятные пользователям
2. **Добавляйте подробные описания** - помогите пользователям понять назначение
3. **Используйте категории** - группируйте похожие меры
4. **Указывайте порядок сортировки** - важные элементы должны быть в начале списка
5. **Добавляйте инструкции по внедрению** - помогите организациям правильно применить меры

### Для разработчиков

1. **Используйте ExecutionContext** - всегда передавайте контекст в методы провайдера
2. **Проверяйте права доступа** - только super_admin и regulator могут редактировать
3. **Валидируйте данные** - проверяйте обязательные поля перед сохранением
4. **Обрабатывайте ошибки** - показывайте понятные сообщения пользователям
5. **Используйте транзакции** - для операций, затрагивающих несколько таблиц

## Миграции

### 150_add_compliance_modes_architecture.sql

Создает таблицы для новых справочников:

\`\`\`sql
-- Таблица типов доказательств
CREATE TABLE evidence_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица шаблонов мер контроля
CREATE TABLE control_measure_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  title TEXT NOT NULL,
  description TEXT,
  implementation_guide TEXT,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### 151_seed_evidence_types.sql

Заполняет справочник типов доказательств начальными данными:

\`\`\`sql
INSERT INTO evidence_types (tenant_id, name, description, icon, sort_order)
SELECT 
  t.id,
  'Приказ',
  'Приказ руководителя организации',
  'file-text',
  1
FROM tenants t;

-- ... другие типы
\`\`\`

## Дальнейшее развитие

### Планируемые улучшения

- Импорт/экспорт справочников
- Версионирование справочников
- История изменений
- Копирование справочников между тенантами
- Шаблоны справочников для быстрого старта
- Рекомендации по заполнению на основе AI
