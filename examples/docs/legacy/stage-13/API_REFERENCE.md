# API Reference - Stage 13

Полный справочник API endpoints системы IB Compliance Platform.

## Общие принципы

### Аутентификация

Все API endpoints требуют аутентификации через Supabase Auth:

\`\`\`typescript
// Client-side
const supabase = createClient()
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
\`\`\`

### Авторизация

Доступ к ресурсам контролируется через RBAC:
- Каждый endpoint проверяет необходимые permissions
- Пользователи видят только данные своего tenant
- Доступ к организациям ограничен иерархией

### Формат ответов

**Успешный ответ**:
\`\`\`json
{
  "data": { ... },
  "total": 100,
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
\`\`\`

**Ошибка**:
\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
\`\`\`

## Requirements API

### GET /api/requirements

Получить список требований.

**Query Parameters**:
- `page` (number) - Номер страницы (default: 1)
- `limit` (number) - Количество на странице (default: 50)
- `category_id` (string) - Фильтр по категории
- `criticality_level` (string) - Фильтр по критичности
- `regulatory_framework_id` (string) - Фильтр по нормативной базе
- `document_status` (string) - Фильтр по статусу документа
- `regulator_id` (string) - Фильтр по регулятору
- `search` (string) - Поиск по коду и названию
- `sortField` (string) - Поле для сортировки (default: "code")
- `sortDirection` (string) - Направление сортировки (default: "asc")

**Response**:
\`\`\`json
{
  "data": [
    {
      "id": "uuid",
      "code": "REQ-001",
      "title": "Название требования",
      "description": "Описание",
      "status": "active",
      "criticality": "high",
      "regulatoryFramework": {
        "id": "uuid",
        "code": "187-FZ",
        "name": "О безопасности КИИ"
      }
    }
  ],
  "total": 100,
  "pagination": { ... }
}
\`\`\`

### POST /api/requirements

Создать новое требование.

**Permissions**: `REQUIREMENT_CREATE`

**Body**:
\`\`\`json
{
  "code": "REQ-001",
  "title": "Название",
  "description": "Описание",
  "regulatory_framework_id": "uuid",
  "category_id": "uuid",
  "criticality": "high",
  "measure_mode": "strict",
  "evidence_type_mode": "flexible"
}
\`\`\`

**Response**: `201 Created`

### GET /api/requirements/[id]

Получить требование по ID.

**Response**:
\`\`\`json
{
  "data": {
    "id": "uuid",
    "code": "REQ-001",
    // ... full requirement data
    "legalReferences": [
      {
        "id": "uuid",
        "fullReference": "187-ФЗ, ст. 5, ч. 1",
        "title": "Категорирование объектов КИИ"
      }
    ]
  }
}
\`\`\`

### PATCH /api/requirements/[id]

Обновить требование.

**Permissions**: `REQUIREMENT_UPDATE`

### DELETE /api/requirements/[id]

Удалить требование.

**Permissions**: `REQUIREMENT_DELETE`

### POST /api/requirements/[id]/assign

Назначить требование организациям.

**Permissions**: `REQUIREMENT_ASSIGN`

**Body**:
\`\`\`json
{
  "organizationIds": ["uuid1", "uuid2"]
}
\`\`\`

## Compliance API

### GET /api/compliance

Получить записи комплаенса.

**Query Parameters**:
- `requirementId` (string)
- `organizationId` (string)
- `status` (string)
- `page`, `limit`, `sortField`, `sortDirection`

**Response**:
\`\`\`json
{
  "data": [
    {
      "id": "uuid",
      "requirementId": "uuid",
      "organizationId": "uuid",
      "status": "compliant",
      "assignedTo": "uuid",
      "completedAt": "2025-01-10T12:00:00Z"
    }
  ]
}
\`\`\`

### PATCH /api/compliance/[id]

Обновить статус комплаенса.

**Permissions**: `COMPLIANCE_UPDATE`

**Body**:
\`\`\`json
{
  "status": "compliant",
  "comments": "Выполнено"
}
\`\`\`

### POST /api/compliance/[id]/approve

Одобрить комплаенс.

**Permissions**: `COMPLIANCE_APPROVE`

### POST /api/compliance/[id]/reject

Отклонить комплаенс.

**Permissions**: `COMPLIANCE_REJECT`

**Body**:
\`\`\`json
{
  "reason": "Недостаточно доказательств"
}
\`\`\`

### GET /api/compliance/heatmap

Получить тепловую карту комплаенса.

**Response**:
\`\`\`json
{
  "data": [
    {
      "organizationId": "uuid",
      "organizationName": "Организация 1",
      "compliant": 50,
      "nonCompliant": 10,
      "partial": 5,
      "pending": 35
    }
  ]
}
\`\`\`

## Organizations API

### GET /api/organizations

Получить список организаций.

**Response**:
\`\`\`json
{
  "data": [
    {
      "id": "uuid",
      "name": "Организация",
      "typeId": "uuid",
      "parentId": "uuid",
      "level": 1,
      "inn": "1234567890",
      "attributes": {
        "kiiCategory": 1,
        "pdnLevel": 2
      }
    }
  ]
}
\`\`\`

### GET /api/organizations/hierarchy

Получить иерархию организаций.

**Query Parameters**:
- `rootId` (string) - ID корневой организации

**Response**:
\`\`\`json
{
  "data": [
    {
      "id": "uuid",
      "name": "Корневая организация",
      "children": [
        {
          "id": "uuid",
          "name": "Дочерняя организация",
          "children": []
        }
      ]
    }
  ]
}
\`\`\`

## Evidence API

### GET /api/evidence

Получить список доказательств.

**Query Parameters**:
- `complianceId` (string)
- `controlId` (string)
- `status` (string)

### POST /api/evidence

Загрузить доказательство.

**Permissions**: `EVIDENCE_CREATE`

**Body** (multipart/form-data):
- `file` - Файл
- `complianceId` - ID записи комплаенса
- `controlId` - ID контроля (optional)
- `description` - Описание (optional)

### POST /api/evidence/[id]/approve

Одобрить доказательство.

**Permissions**: `EVIDENCE_APPROVE`

### POST /api/evidence/[id]/reject

Отклонить доказательство.

**Permissions**: `EVIDENCE_APPROVE`

**Body**:
\`\`\`json
{
  "reason": "Неверный формат"
}
\`\`\`

## Documents API

### GET /api/documents

Получить список документов.

### POST /api/documents

Загрузить документ.

**Permissions**: `DOCUMENT_CREATE`

### GET /api/documents/[id]/versions

Получить версии документа.

### POST /api/documents/[id]/analyze

Анализировать документ через AI.

### GET /api/documents/[id]/diff

Сравнить версии документа.

**Query Parameters**:
- `versionA` (string) - ID первой версии
- `versionB` (string) - ID второй версии

## Controls API

### GET /api/controls

Получить меры контроля.

**Query Parameters**:
- `organizationId` (string)
- `requirementId` (string)
- `status` (string)

### POST /api/controls

Создать меру контроля.

### GET /api/controls/templates

Получить шаблоны мер контроля.

## Dictionaries API

### GET /api/dictionaries/regulatory-frameworks

Получить нормативные базы.

### GET /api/dictionaries/categories

Получить категории требований.

### GET /api/dictionaries/evidence-types

Получить типы доказательств.

### GET /api/dictionaries/regulators

Получить регуляторов.

## Admin API

### GET /api/admin/tenants

Получить список тенантов.

**Permissions**: `super_admin` role

### POST /api/admin/tenants

Создать тенант.

**Permissions**: `super_admin` role

### GET /api/admin/users

Получить список пользователей.

**Permissions**: `USER_READ`

### POST /api/admin/users

Создать пользователя.

**Permissions**: `USER_CREATE`

## Reports API

### GET /api/reports/compliance-summary

Получить сводку по комплаенсу.

**Query Parameters**:
- `organizationId` (string)
- `startDate` (string)
- `endDate` (string)

### GET /api/reports/readiness

Получить отчет о готовности.

### GET /api/reports/executive-summary

Получить executive summary.

## Audit API

### GET /api/audit/logs

Получить audit logs.

**Permissions**: `AUDIT_READ`

**Query Parameters**:
- `userId` (string)
- `resourceType` (string)
- `resourceId` (string)
- `eventType` (string)
- `startDate` (string)
- `endDate` (string)

## Коды ошибок

- `400` - Bad Request (невалидные данные)
- `401` - Unauthorized (не аутентифицирован)
- `403` - Forbidden (нет прав доступа)
- `404` - Not Found (ресурс не найден)
- `409` - Conflict (конфликт данных)
- `500` - Internal Server Error (внутренняя ошибка)

## Rate Limiting

В разработке.

## Webhooks

В разработке.
