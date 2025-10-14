# Руководство по режимам исполнения требований

## Обзор

Система поддерживает два режима исполнения требований:
- **Strict (Строгий)** - организация должна использовать только предложенные меры и типы доказательств
- **Flexible (Гибкий)** - организация может добавлять свои меры и использовать любые типы доказательств

## Архитектура

### Основные сущности

1. **Requirement** (Требование) - абстрактное требование из регуляторного документа
   - `measure_mode` - режим для мер контроля ('strict' | 'flexible')
   - `evidence_type_mode` - режим для типов доказательств ('strict' | 'flexible')
   - `allowed_evidence_type_ids` - разрешенные типы доказательств (для strict режима)
   - `suggested_control_measure_template_ids` - предложенные шаблоны мер

2. **RequirementAssignment** (compliance_records) - назначение требования организации
   - `control_measure_ids` - меры, которые организация применяет
   - `evidence_ids` - доказательства исполнения
   - `next_due_date` - следующая дата проверки
   - `last_confirmed_at` - дата последнего подтверждения

3. **ControlMeasureTemplate** - шаблон меры контроля
   - Предопределенные меры, рекомендованные регулятором
   - Содержит описание, инструкции по внедрению

4. **ControlMeasure** - конкретная мера контроля
   - Создается организацией на основе шаблона или с нуля (в flexible режиме)
   - Связана с RequirementAssignment

5. **EvidenceType** - тип доказательства
   - Справочник типов (документ, скриншот, отчет, и т.д.)
   - Используется для валидации в strict режиме

## Режимы работы

### Strict режим

**Меры контроля:**
- Организация может выбрать только из предложенных шаблонов
- Нельзя создать свою меру
- Валидация: `templateId` должен быть в `suggested_control_measure_template_ids`

**Типы доказательств:**
- Можно загружать только разрешенные типы
- Валидация: `evidenceTypeId` должен быть в `allowed_evidence_type_ids`

### Flexible режим

**Меры контроля:**
- Можно выбрать из предложенных шаблонов
- Можно создать свою меру с нуля
- Нет валидации по шаблонам

**Типы доказательств:**
- Можно использовать любые типы доказательств
- Нет валидации по типам

## Компоненты

### RequirementModeBadge

Компонент для отображения режима требования:

\`\`\`tsx
import { RequirementModeBadge } from "@/components/compliance/requirement-mode-badge"

<RequirementModeBadge mode="strict" type="measure" />
<RequirementModeBadge mode="flexible" type="evidence" />
\`\`\`

### ControlMeasureCard

Компонент для отображения меры контроля:

\`\`\`tsx
import { ControlMeasureCard } from "@/components/compliance/control-measure-card"

<ControlMeasureCard 
  measure={measure} 
  isFromTemplate={true} 
/>
\`\`\`

## Интеграция в существующие страницы

### Страница требования (/requirements/[id])

Добавить отображение режимов:

\`\`\`tsx
<div className="flex gap-2">
  <RequirementModeBadge mode={requirement.measure_mode} type="measure" />
  <RequirementModeBadge mode={requirement.evidence_type_mode} type="evidence" />
</div>
\`\`\`

### Страница compliance record (/compliance/[id])

Добавить список мер контроля:

\`\`\`tsx
<div className="space-y-3">
  <h3>Меры контроля</h3>
  {controlMeasures.map(measure => (
    <ControlMeasureCard 
      key={measure.id} 
      measure={measure}
      isFromTemplate={!!measure.templateId}
    />
  ))}
</div>
\`\`\`

## Примеры использования

### Создание требования в strict режиме

\`\`\`typescript
const requirement = {
  title: "Обеспечение защиты персональных данных",
  measure_mode: "strict",
  evidence_type_mode: "strict",
  suggested_control_measure_template_ids: [
    "template-1", // Назначение ответственного за ПДн
    "template-2", // Разработка политики ПДн
    "template-3"  // Проведение обучения
  ],
  allowed_evidence_type_ids: [
    "type-1", // Приказ
    "type-2", // Политика
    "type-3"  // Протокол обучения
  ]
}
\`\`\`

### Создание меры в strict режиме

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
\`\`\`

### Создание меры в flexible режиме

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

## База данных

### Новые таблицы

- `evidence_types` - справочник типов доказательств
- `control_measure_templates` - шаблоны мер контроля
- `control_measures` - конкретные меры организаций

### Обновленные таблицы

- `requirements` - добавлены поля для режимов и связей
- `compliance_records` - добавлены поля для мер и дат
- `evidence` - добавлена связь с типом доказательства

## API endpoints (будущая реализация)

\`\`\`
POST   /api/control-measures              - Создать меру
GET    /api/control-measures/:id          - Получить меру
PATCH  /api/control-measures/:id          - Обновить меру
DELETE /api/control-measures/:id          - Удалить меру

POST   /api/control-measures/validate     - Валидировать меру
GET    /api/control-measure-templates     - Список шаблонов
GET    /api/evidence-types                - Список типов доказательств
