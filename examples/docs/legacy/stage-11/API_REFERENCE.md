# API Reference - Stage 11

## Обзор

Справочник API endpoints для работы с режимами исполнения требований и справочниками.

## Базовый URL

\`\`\`
https://your-domain.vercel.app/api
\`\`\`

## Аутентификация

Все запросы требуют аутентификации через Supabase Auth:

\`\`\`typescript
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Получение токена
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token

// Использование в запросах
fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
\`\`\`

## Справочники

### Типы доказательств

#### GET /api/dictionaries/evidence-types

Получить список всех типов доказательств.

**Права доступа:** Все роли

**Ответ:**
\`\`\`json
[
  {
    "id": "uuid",
    "tenant_id": "uuid",
    "name": "Приказ",
    "description": "Приказ руководителя организации",
    "icon": "file-text",
    "sort_order": 1,
    "created_at": "2025-01-10T10:00:00Z",
    "updated_at": "2025-01-10T10:00:00Z"
  }
]
\`\`\`

#### POST /api/dictionaries/evidence-types

Создать новый тип доказательства.

**Права доступа:** super_admin, regulator

**Тело запроса:**
\`\`\`json
{
  "name": "Приказ",
  "description": "Приказ руководителя организации",
  "icon": "file-text",
  "sort_order": 1
}
\`\`\`

**Ответ:**
\`\`\`json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "name": "Приказ",
  "description": "Приказ руководителя организации",
  "icon": "file-text",
  "sort_order": 1,
  "created_at": "2025-01-10T10:00:00Z",
  "updated_at": "2025-01-10T10:00:00Z"
}
\`\`\`

#### GET /api/dictionaries/evidence-types/[id]

Получить тип доказательства по ID.

**Права доступа:** Все роли

**Ответ:**
\`\`\`json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "name": "Приказ",
  "description": "Приказ руководителя организации",
  "icon": "file-text",
  "sort_order": 1,
  "created_at": "2025-01-10T10:00:00Z",
  "updated_at": "2025-01-10T10:00:00Z"
}
\`\`\`

#### PATCH /api/dictionaries/evidence-types/[id]

Обновить тип доказательства.

**Права доступа:** super_admin, regulator

**Тело запроса:**
\`\`\`json
{
  "name": "Приказ (обновленный)",
  "description": "Новое описание"
}
\`\`\`

**Ответ:**
\`\`\`json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "name": "Приказ (обновленный)",
  "description": "Новое описание",
  "icon": "file-text",
  "sort_order": 1,
  "created_at": "2025-01-10T10:00:00Z",
  "updated_at": "2025-01-10T11:00:00Z"
}
\`\`\`

#### DELETE /api/dictionaries/evidence-types/[id]

Удалить тип доказательства.

**Права доступа:** super_admin, regulator

**Ответ:**
\`\`\`json
{
  "success": true
}
\`\`\`

### Шаблоны мер контроля

#### GET /api/dictionaries/control-measure-templates

Получить список всех шаблонов мер.

**Права доступа:** Все роли

**Ответ:**
\`\`\`json
[
  {
    "id": "uuid",
    "tenant_id": "uuid",
    "title": "Назначение ответственного за ПДн",
    "description": "Назначить ответственного за обработку персональных данных",
    "implementation_guide": "1. Издать приказ\n2. Ознакомить сотрудника",
    "category": "Организационные меры",
    "sort_order": 1,
    "created_at": "2025-01-10T10:00:00Z",
    "updated_at": "2025-01-10T10:00:00Z"
  }
]
\`\`\`

#### POST /api/dictionaries/control-measure-templates

Создать новый шаблон меры.

**Права доступа:** super_admin, regulator

**Тело запроса:**
\`\`\`json
{
  "title": "Назначение ответственного за ПДн",
  "description": "Назначить ответственного за обработку персональных данных",
  "implementation_guide": "1. Издать приказ\n2. Ознакомить сотрудника",
  "category": "Организационные меры",
  "sort_order": 1
}
\`\`\`

**Ответ:**
\`\`\`json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "title": "Назначение ответственного за ПДн",
  "description": "Назначить ответственного за обработку персональных данных",
  "implementation_guide": "1. Издать приказ\n2. Ознакомить сотрудника",
  "category": "Организационные меры",
  "sort_order": 1,
  "created_at": "2025-01-10T10:00:00Z",
  "updated_at": "2025-01-10T10:00:00Z"
}
\`\`\`

#### GET /api/dictionaries/control-measure-templates/[id]

Получить шаблон меры по ID.

**Права доступа:** Все роли

#### PATCH /api/dictionaries/control-measure-templates/[id]

Обновить шаблон меры.

**Права доступа:** super_admin, regulator

#### DELETE /api/dictionaries/control-measure-templates/[id]

Удалить шаблон меры.

**Права доступа:** super_admin, regulator

## Коды ошибок

| Код | Описание |
|-----|----------|
| 200 | Успешный запрос |
| 201 | Ресурс создан |
| 400 | Неверный запрос |
| 401 | Не авторизован |
| 403 | Доступ запрещен |
| 404 | Ресурс не найден |
| 500 | Внутренняя ошибка сервера |

## Примеры использования

### TypeScript

\`\`\`typescript
// Получение типов доказательств
const response = await fetch('/api/dictionaries/evidence-types', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const evidenceTypes = await response.json()

// Создание типа доказательства
const response = await fetch('/api/dictionaries/evidence-types', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Приказ',
    description: 'Приказ руководителя',
    icon: 'file-text',
    sort_order: 1
  })
})
const created = await response.json()
\`\`\`

### React Hook

\`\`\`typescript
import useSWR from 'swr'

function useEvidenceTypes() {
  const { data, error, mutate } = useSWR(
    '/api/dictionaries/evidence-types',
    fetcher
  )
  
  return {
    evidenceTypes: data,
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}
