# Режимы исполнения требований

## Обзор

Система поддерживает два режима исполнения требований для обеспечения гибкости и контроля:

- **Strict (Строгий)** - организация должна использовать только предложенные меры и типы доказательств
- **Flexible (Гибкий)** - организация может добавлять свои меры и использовать любые типы доказательств

## Бизнес-логика

### Зачем нужны режимы?

**Strict режим** используется когда:
- Регулятор требует строгого соблюдения определенных мер
- Необходим единый подход для всех организаций
- Важна стандартизация процессов

**Flexible режим** используется когда:
- Организации имеют специфические условия
- Требуется адаптация под конкретные процессы
- Важна гибкость в выборе мер

## Архитектура

### Основные сущности

#### 1. Requirement (Требование)
Абстрактное требование из регуляторного документа.

**Новые поля:**
\`\`\`typescript
interface Requirement {
  // Режим для мер контроля
  measure_mode: 'strict' | 'flexible'
  
  // Режим для типов доказательств
  evidence_type_mode: 'strict' | 'flexible'
  
  // Разрешенные типы доказательств (для strict режима)
  allowed_evidence_type_ids: string[]
  
  // Предложенные шаблоны мер (для strict режима)
  suggested_control_measure_template_ids: string[]
}
\`\`\`

#### 2. RequirementAssignment (compliance_records)
Назначение требования конкретной организации.

**Новые поля:**
\`\`\`typescript
interface RequirementAssignment {
  // Меры, которые организация применяет
  control_measure_ids: string[]
  
  // Доказательства исполнения
  evidence_ids: string[]
  
  // Следующая дата проверки
  next_due_date?: string
  
  // Дата последнего подтверждения
  last_confirmed_at?: string
}
\`\`\`

#### 3. EvidenceType (Тип доказательства)
Справочник типов доказательств.

\`\`\`typescript
interface EvidenceType {
  id: string
  tenant_id: string
  name: string              // "Приказ", "Политика", "Протокол"
  description?: string
  icon?: string             // Иконка для UI
  sort_order: number        // Порядок сортировки
}
\`\`\`

#### 4. ControlMeasureTemplate (Шаблон меры)
Предопределенные меры, рекомендованные регулятором.

\`\`\`typescript
interface ControlMeasureTemplate {
  id: string
  tenant_id: string
  title: string                    // "Назначение ответственного"
  description?: string
  implementation_guide?: string    // Инструкция по внедрению
  category?: string                // Категория меры
  sort_order: number
}
\`\`\`

#### 5. ControlMeasure (Мера контроля)
Конкретная мера, применяемая организацией.

\`\`\`typescript
interface ControlMeasure {
  id: string
  tenant_id: string
  requirement_assignment_id: string
  template_id?: string              // Если создана из шаблона
  title: string
  description?: string
  status: 'planned' | 'in_progress' | 'implemented' | 'verified'
  responsible_user_id?: string
  due_date?: string
  completed_at?: string
}
\`\`\`

## Режимы работы

### Strict режим

#### Меры контроля
- ✅ Можно выбрать только из `suggested_control_measure_template_ids`
- ❌ Нельзя создать свою меру
- Валидация: `templateId` должен быть в списке предложенных

#### Типы доказательств
- ✅ Можно загружать только типы из `allowed_evidence_type_ids`
- ❌ Нельзя использовать другие типы
- Валидация: `evidenceTypeId` должен быть в списке разрешенных

### Flexible режим

#### Меры контроля
- ✅ Можно выбрать из предложенных шаблонов
- ✅ Можно создать свою меру с нуля
- Нет валидации по шаблонам

#### Типы доказательств
- ✅ Можно использовать любые типы доказательств
- Нет валидации по типам

## Примеры использования

### Пример 1: Создание требования в strict режиме

\`\`\`typescript
const requirement = {
  title: "Обеспечение защиты персональных данных",
  description: "Организация должна обеспечить защиту ПДн",
  
  // Strict режим для мер
  measure_mode: "strict",
  suggested_control_measure_template_ids: [
    "template-1", // Назначение ответственного за ПДн
    "template-2", // Разработка политики ПДн
    "template-3"  // Проведение обучения
  ],
  
  // Strict режим для доказательств
  evidence_type_mode: "strict",
  allowed_evidence_type_ids: [
    "type-1", // Приказ
    "type-2", // Политика
    "type-3"  // Протокол обучения
  ]
}
\`\`\`

### Пример 2: Создание меры в strict режиме

\`\`\`typescript
// ✅ Валидно - используется предложенный шаблон
const measure = {
  requirementAssignmentId: "assignment-1",
  templateId: "template-1", // Из suggested_control_measure_template_ids
  title: "Назначение ответственного за ПДн",
  status: "planned"
}

// ❌ Невалидно - шаблон не из списка
const invalidMeasure = {
  requirementAssignmentId: "assignment-1",
  templateId: "template-999", // Не в списке
  title: "Своя мера",
  status: "planned"
}
// Вернет ошибку: "Template not allowed in strict mode"
\`\`\`

### Пример 3: Создание меры в flexible режиме

\`\`\`typescript
// ✅ Валидно - можно использовать шаблон
const measureFromTemplate = {
  requirementAssignmentId: "assignment-1",
  templateId: "template-1",
  title: "Назначение ответственного за ПДн",
  status: "planned"
}

// ✅ Валидно - можно создать свою меру
const customMeasure = {
  requirementAssignmentId: "assignment-1",
  title: "Наша собственная мера безопасности",
  description: "Специфичная для нашей организации",
  status: "planned"
}
\`\`\`

### Пример 4: Загрузка доказательства в strict режиме

\`\`\`typescript
// ✅ Валидно - тип разрешен
const evidence = {
  requirementAssignmentId: "assignment-1",
  evidenceTypeId: "type-1", // Из allowed_evidence_type_ids
  title: "Приказ о назначении ответственного",
  file: uploadedFile
}

// ❌ Невалидно - тип не разрешен
const invalidEvidence = {
  requirementAssignmentId: "assignment-1",
  evidenceTypeId: "type-999", // Не в списке
  title: "Скриншот",
  file: uploadedFile
}
// Вернет ошибку: "Evidence type not allowed in strict mode"
\`\`\`

## UI компоненты

### RequirementModeBadge

Компонент для отображения режима требования.

\`\`\`tsx
import { RequirementModeBadge } from "@/components/compliance/requirement-mode-badge"

// Отображение режима для мер
<RequirementModeBadge mode="strict" type="measure" />

// Отображение режима для доказательств
<RequirementModeBadge mode="flexible" type="evidence" />
\`\`\`

**Внешний вид:**
- Strict: красный бейдж с иконкой замка
- Flexible: зеленый бейдж с иконкой настроек

### ControlMeasureCard

Компонент для отображения меры контроля.

\`\`\`tsx
import { ControlMeasureCard } from "@/components/compliance/control-measure-card"

<ControlMeasureCard 
  measure={measure} 
  isFromTemplate={!!measure.templateId} 
/>
\`\`\`

**Отображает:**
- Название меры
- Статус (planned, in_progress, implemented, verified)
- Ответственный
- Срок выполнения
- Индикатор "Из шаблона" (если создана из шаблона)

## Интеграция в существующие страницы

### Страница требования (/requirements/[id])

Добавлено отображение режимов в секции "Информация":

\`\`\`tsx
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <span className="text-sm text-muted-foreground">Режим мер:</span>
    <RequirementModeBadge 
      mode={requirement.measure_mode} 
      type="measure" 
    />
  </div>
  
  <div className="flex items-center gap-2">
    <span className="text-sm text-muted-foreground">Режим доказательств:</span>
    <RequirementModeBadge 
      mode={requirement.evidence_type_mode} 
      type="evidence" 
    />
  </div>
</div>
\`\`\`

### Вкладка "Меры/Контроли"

Добавлено описание режима:

\`\`\`tsx
{requirement.measure_mode === 'strict' ? (
  <p className="text-sm text-muted-foreground">
    Строгий режим: можно выбрать только из предложенных шаблонов мер
  </p>
) : (
  <p className="text-sm text-muted-foreground">
    Гибкий режим: можно создать свои меры или выбрать из шаблонов
  </p>
)}
\`\`\`

### Вкладка "Доказательства"

Добавлено описание режима:

\`\`\`tsx
{requirement.evidence_type_mode === 'strict' ? (
  <p className="text-sm text-muted-foreground">
    Строгий режим: можно загружать только разрешенные типы доказательств
  </p>
) : (
  <p className="text-sm text-muted-foreground">
    Гибкий режим: можно использовать любые типы доказательств
  </p>
)}
\`\`\`

## База данных

### Миграции

**150_add_compliance_modes_architecture.sql** - создает новые таблицы и поля:
- Таблица `evidence_types`
- Таблица `control_measure_templates`
- Таблица `control_measures`
- Поля в `requirements` для режимов
- Поля в `compliance_records` для мер и дат

**151_seed_evidence_types.sql** - заполняет справочник типов доказательств:
- Приказ
- Политика
- Инструкция
- Протокол
- Отчет
- Скриншот
- Журнал
- Сертификат

## API endpoints

### Справочники

\`\`\`
GET    /api/dictionaries/evidence-types
POST   /api/dictionaries/evidence-types
PATCH  /api/dictionaries/evidence-types/[id]
DELETE /api/dictionaries/evidence-types/[id]

GET    /api/dictionaries/control-measure-templates
POST   /api/dictionaries/control-measure-templates
PATCH  /api/dictionaries/control-measure-templates/[id]
DELETE /api/dictionaries/control-measure-templates/[id]
\`\`\`

### Меры контроля (будущая реализация)

\`\`\`
GET    /api/control-measures?requirementAssignmentId=...
POST   /api/control-measures
PATCH  /api/control-measures/[id]
DELETE /api/control-measures/[id]

POST   /api/control-measures/validate  # Валидация меры
\`\`\`

## Валидация

### На уровне API

\`\`\`typescript
// Валидация меры в strict режиме
if (requirement.measure_mode === 'strict') {
  if (!data.templateId) {
    throw new Error('Template required in strict mode')
  }
  
  if (!requirement.suggested_control_measure_template_ids.includes(data.templateId)) {
    throw new Error('Template not allowed in strict mode')
  }
}

// Валидация доказательства в strict режиме
if (requirement.evidence_type_mode === 'strict') {
  if (!data.evidenceTypeId) {
    throw new Error('Evidence type required in strict mode')
  }
  
  if (!requirement.allowed_evidence_type_ids.includes(data.evidenceTypeId)) {
    throw new Error('Evidence type not allowed in strict mode')
  }
}
\`\`\`

### На уровне UI

\`\`\`tsx
// Отключение кнопки "Создать свою меру" в strict режиме
<Button 
  disabled={requirement.measure_mode === 'strict'}
  onClick={handleCreateCustomMeasure}
>
  Создать свою меру
</Button>

// Фильтрация типов доказательств в strict режиме
const availableEvidenceTypes = requirement.evidence_type_mode === 'strict'
  ? evidenceTypes.filter(t => requirement.allowed_evidence_type_ids.includes(t.id))
  : evidenceTypes
\`\`\`

## Лучшие практики

### Для администраторов

1. **Используйте strict режим** для критичных требований
2. **Создавайте качественные шаблоны мер** с подробными инструкциями
3. **Ограничивайте типы доказательств** только необходимыми
4. **Регулярно обновляйте справочники** при изменении требований

### Для разработчиков

1. **Всегда проверяйте режим** перед созданием меры или доказательства
2. **Используйте валидацию** на уровне API и UI
3. **Показывайте понятные сообщения об ошибках** пользователям
4. **Тестируйте оба режима** при разработке новых функций

## Дальнейшее развитие

### Планируемые улучшения

- Автоматическое создание мер на основе AI
- Рекомендации по выбору типов доказательств
- Валидация доказательств через AI
- Шаблоны для быстрого создания требований
- Копирование режимов между требованиями
- История изменений режимов
