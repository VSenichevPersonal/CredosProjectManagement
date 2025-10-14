# Обязательные типы доказательств (Required Evidence Types)

## Обзор

Система поддерживает два режима работы с типами доказательств для требований:

- **Гибкий режим (flexible)**: Организация может использовать любые типы доказательств
- **Строгий режим (strict)**: Организация должна использовать только разрешенные типы доказательств

## Архитектура

### Модель данных

\`\`\`sql
-- Таблица требований
requirements (
  id UUID PRIMARY KEY,
  evidence_type_mode TEXT CHECK (evidence_type_mode IN ('strict', 'flexible')),
  ...
)

-- Связь требований с разрешенными типами доказательств
requirement_evidence_types (
  id UUID PRIMARY KEY,
  requirement_id UUID REFERENCES requirements(id),
  evidence_type_id UUID REFERENCES evidence_types(id),
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
\`\`\`

### Бизнес-логика

#### Гибкий режим (flexible)
- Организация может загружать доказательства любого типа
- Система не проверяет соответствие типов доказательств требованию
- Используется по умолчанию для большинства требований

#### Строгий режим (strict)
- Организация может загружать только доказательства разрешенных типов
- Система проверяет соответствие при загрузке доказательства
- Используется для требований с четкими нормативными ограничениями

### Проверка соответствия

При загрузке доказательства система выполняет следующие проверки:

1. Получить требование и его режим (`evidence_type_mode`)
2. Если режим `flexible` - разрешить любой тип
3. Если режим `strict`:
   - Получить список разрешенных типов из `requirement_evidence_types`
   - Проверить, что тип загружаемого доказательства есть в списке
   - Если типа нет - отклонить загрузку с ошибкой

## API

### Получение разрешенных типов доказательств

\`\`\`typescript
GET /api/requirements/{id}/evidence-types

Response:
{
  "data": [
    {
      "id": "uuid",
      "requirementId": "uuid",
      "evidenceTypeId": "uuid",
      "evidenceType": {
        "id": "uuid",
        "code": "DOC-001",
        "name": "Политика безопасности",
        "description": "..."
      },
      "isRequired": true
    }
  ]
}
\`\`\`

### Добавление разрешенного типа

\`\`\`typescript
POST /api/requirements/{id}/evidence-types

Request:
{
  "evidenceTypeId": "uuid",
  "isRequired": true
}

Response:
{
  "data": {
    "id": "uuid",
    "requirementId": "uuid",
    "evidenceTypeId": "uuid",
    "isRequired": true
  }
}
\`\`\`

### Удаление разрешенного типа

\`\`\`typescript
DELETE /api/requirements/{id}/evidence-types/{evidenceTypeId}

Response:
{
  "success": true
}
\`\`\`

## Компоненты UI

### RequirementEvidenceTypesTab

Компонент для управления разрешенными типами доказательств:

\`\`\`tsx
<RequirementEvidenceTypesTab requirementId={requirementId} />
\`\`\`

Функциональность:
- Отображение текущего режима (гибкий/строгий)
- Список разрешенных типов доказательств
- Добавление/удаление типов
- Отметка обязательных типов

### RequirementModeBadge

Компонент для отображения режима:

\`\`\`tsx
<RequirementModeBadge 
  mode="strict" 
  type="evidence" 
/>
\`\`\`

## Примеры использования

### Пример 1: Требование с гибким режимом

\`\`\`typescript
const requirement = {
  id: "req-001",
  code: "REQ-001",
  title: "Общее требование",
  evidenceTypeMode: "flexible"
}

// Организация может загрузить любой тип доказательства
await uploadEvidence({
  requirementId: "req-001",
  evidenceTypeId: "any-type-id",
  file: file
})
// ✅ Успешно
\`\`\`

### Пример 2: Требование со строгим режимом

\`\`\`typescript
const requirement = {
  id: "req-002",
  code: "REQ-002",
  title: "Требование с ограничениями",
  evidenceTypeMode: "strict",
  allowedEvidenceTypes: [
    { evidenceTypeId: "type-1", isRequired: true },
    { evidenceTypeId: "type-2", isRequired: false }
  ]
}

// Попытка загрузить разрешенный тип
await uploadEvidence({
  requirementId: "req-002",
  evidenceTypeId: "type-1",
  file: file
})
// ✅ Успешно

// Попытка загрузить неразрешенный тип
await uploadEvidence({
  requirementId: "req-002",
  evidenceTypeId: "type-3",
  file: file
})
// ❌ Ошибка: "Тип доказательства не разрешен для этого требования"
\`\`\`

## Миграция данных

При переходе с гибкого режима на строгий:

1. Установить `evidence_type_mode = 'strict'`
2. Добавить разрешенные типы в `requirement_evidence_types`
3. Проверить существующие доказательства на соответствие
4. Уведомить организации о несоответствующих доказательствах

## Рекомендации

### Когда использовать строгий режим

- Требования с четкими нормативными ограничениями
- Требования, где тип доказательства критичен для проверки
- Требования с высокой критичностью

### Когда использовать гибкий режим

- Общие требования без специфических ограничений
- Требования, где важен факт наличия доказательства, а не его тип
- Требования с низкой критичностью

## Связанные документы

- [Compliance Records Architecture](./compliance-records.md)
- [Evidence Management](./evidence-management.md)
- [Requirement Modes](./requirement-modes.md)
