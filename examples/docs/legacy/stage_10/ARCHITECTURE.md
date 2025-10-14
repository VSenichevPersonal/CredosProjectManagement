# Архитектура проекта IB Compliance Platform

## 🏗️ Общая архитектура

### Технологический стек
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: Tailwind CSS v4, shadcn/ui, Radix UI
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **State**: React Context API, SWR для кэширования

## 📁 Структура проекта

\`\`\`
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Защищенные страницы с layout
│   │   ├── admin/              # Административная панель
│   │   │   ├── tenant/         # Настройки тенанта
│   │   │   └── system/         # Системные настройки (super_admin)
│   │   ├── compliance/         # Управление комплаенсом
│   │   ├── requirements/       # Требования
│   │   ├── organizations/      # Организации
│   │   ├── documents/          # Документы
│   │   ├── evidence/           # Доказательства
│   │   ├── controls/           # Меры защиты
│   │   └── analytics/          # Аналитика
│   ├── api/                    # API Routes
│   │   ├── compliance/         # CRUD для комплаенса
│   │   ├── requirements/       # CRUD для требований
│   │   ├── organizations/      # CRUD для организаций
│   │   ├── documents/          # Управление документами
│   │   ├── evidence/           # Управление доказательствами
│   │   ├── controls/           # Управление мерами
│   │   └── admin/              # Административные API
│   └── auth/                   # Страницы аутентификации
├── components/                  # React компоненты
│   ├── admin/                  # Админ компоненты
│   ├── compliance/             # Комплаенс компоненты
│   ├── requirements/           # Требования компоненты
│   ├── organizations/          # Организации компоненты
│   ├── documents/              # Документы компоненты
│   ├── evidence/               # Доказательства компоненты
│   ├── controls/               # Меры защиты компоненты
│   ├── analytics/              # Аналитика компоненты
│   ├── layout/                 # Layout компоненты
│   └── ui/                     # shadcn/ui компоненты
├── lib/                        # Утилиты и сервисы
│   ├── context/               # Execution Context (tenant, user, org)
│   ├── services/              # Бизнес-логика сервисов
│   ├── supabase/              # Supabase клиенты
│   ├── auth/                  # Аутентификация
│   ├── validators/            # Zod схемы валидации
│   └── utils/                 # Утилиты
├── providers/                  # Data Providers
│   ├── database-provider.ts   # Абстракция БД
│   └── supabase-provider.ts   # Supabase реализация
├── types/                      # TypeScript типы
│   ├── domain/                # Доменные модели
│   └── dto/                   # Data Transfer Objects
├── scripts/                    # SQL миграции
└── docs/                       # Документация
\`\`\`

## 🏛️ Архитектурные слои

### 1. **Presentation Layer** (UI)
- **Компоненты**: React компоненты в `components/`
- **Страницы**: Next.js страницы в `app/(dashboard)/`
- **Ответственность**: Отображение данных, обработка пользовательского ввода

### 2. **API Layer** (Backend)
- **API Routes**: REST API в `app/api/`
- **Server Actions**: Серверные действия в компонентах
- **Ответственность**: Валидация запросов, вызов сервисов, возврат ответов

### 3. **Service Layer** (Business Logic)
- **Сервисы**: Бизнес-логика в `lib/services/`
- **Ответственность**: Бизнес-правила, оркестрация провайдеров

### 4. **Data Access Layer** (Providers)
- **Провайдеры**: Абстракция БД в `providers/`
- **Ответственность**: CRUD операции, фильтрация, пагинация

### 5. **Database Layer**
- **Supabase**: PostgreSQL база данных
- **Ответственность**: Хранение данных, RLS политики

## 🔐 Мультитенантность

### Архитектура
- **Tenant Isolation**: Каждый tenant имеет изолированные данные
- **ExecutionContext**: Глобальный контекст с `tenantId`, `userId`, `organizationId`
- **Автоматическая фильтрация**: Все запросы автоматически фильтруются по `tenant_id`

### Компоненты
1. **ExecutionContext** (`lib/context/execution-context.ts`)
   - Хранит контекст выполнения: tenant, user, organization
   - Используется во всех API routes и Server Actions

2. **TenantProvider** (`lib/context/tenant-context.tsx`)
   - React Context для текущего тенанта
   - Загружает tenant при монтировании

3. **SupabaseDatabaseProvider** (`providers/supabase-provider.ts`)
   - Автоматически добавляет `tenant_id` ко всем запросам
   - Использует `withTenantFilter()` helper

### Связь Tenant ↔ Organization
- Каждый tenant имеет `root_organization_id` - головную организацию
- Все организации в иерархии принадлежат одному tenant

## 🔑 Система ролей и прав (RBAC)

### Роли
- **super_admin**: Полный доступ ко всей системе
- **regulator_admin**: Администратор регулятора
- **ministry_user**: Пользователь министерства
- **institution_user**: Пользователь учреждения
- **ciso**: CISO (Chief Information Security Officer)
- **auditor**: Аудитор

### Права доступа
- **Системные настройки**: Только `super_admin`
- **Настройки тенанта**: Администраторы тенанта
- **Данные организации**: Пользователи организации + вышестоящие

## 📊 Основные сущности

### 1. **Tenant** (Тенант)
- Изолированное пространство для организации
- Имеет root organization (головную организацию)
- Все данные фильтруются по tenant_id

### 2. **Organization** (Организация)
- Иерархическая структура (дерево)
- Принадлежит tenant
- Имеет тип (ministry, institution, etc.)

### 3. **Requirement** (Требование)
- Нормативное требование из документа
- Может быть применимо к организациям
- Имеет критичность, категорию, периодичность

### 4. **Compliance** (Комплаенс)
- Статус выполнения требования организацией
- Имеет статус, ответственного, дедлайн
- Связан с доказательствами

### 5. **Evidence** (Доказательство)
- Файл-подтверждение выполнения требования
- Имеет тип, статус, метаданные
- Хранится в Supabase Storage

### 6. **Control** (Мера защиты)
- Типовая мера для выполнения требования
- Имеет тип, частоту, описание
- Может быть связана с требованиями

### 7. **Document** (Документ)
- Нормативный документ (закон, приказ, ГОСТ)
- Имеет версии, статус актуальности
- Содержит требования

## 🔄 Основные потоки данных

### 1. **Создание комплаенса**
\`\`\`
User → API Route → Service → Provider → Database
     ← Response  ← Result  ← Data     ← Query
\`\`\`

### 2. **Загрузка доказательства**
\`\`\`
User → Upload API → Storage Service → Supabase Storage
                 → Evidence Service → Database
\`\`\`

### 3. **Фильтрация по tenant**
\`\`\`
API Route → createExecutionContext(tenantId, userId, orgId)
         → Provider.find({ filters })
         → withTenantFilter(query, tenantId)
         → Database (WHERE tenant_id = ?)
\`\`\`

## 🎨 UI/UX паттерны

### 1. **Breadcrumbs**
- Автоматическая генерация на основе URL
- Компонент: `components/layout/page-breadcrumbs.tsx`

### 2. **Data Tables**
- Пагинация, сортировка, фильтрация
- Bulk actions (массовые операции)
- Компонент: `components/admin/admin-data-table.tsx`

### 3. **Dialogs**
- Создание, редактирование, просмотр
- Форма в модальном окне
- Паттерн: `create-*-dialog.tsx`, `edit-*-dialog.tsx`

### 4. **Cards**
- Компактное отображение информации
- Hover эффекты, badges
- Паттерн: `*-card.tsx`

## 🚀 Производительность

### Оптимизации
1. **Middleware**: Ранний выход для статики и API
2. **Next.js Config**: optimizePackageImports для больших библиотек
3. **Database**: Индексы на tenant_id, organization_id, requirement_id
4. **Caching**: SWR для клиентского кэширования

## 📝 Соглашения о коде

### Naming Conventions
- **Файлы**: kebab-case (`user-profile.tsx`)
- **Компоненты**: PascalCase (`UserProfile`)
- **Функции**: camelCase (`getUserProfile`)
- **Константы**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

### Структура компонента
\`\`\`tsx
// 1. Imports
import { useState } from "react"
import { Button } from "@/components/ui/button"

// 2. Types
interface Props {
  userId: string
}

// 3. Component
export function UserProfile({ userId }: Props) {
  // 3.1. Hooks
  const [loading, setLoading] = useState(false)
  
  // 3.2. Handlers
  const handleSubmit = async () => {
    // ...
  }
  
  // 3.3. Render
  return (
    <div>
      {/* ... */}
    </div>
  )
}
\`\`\`

## 🔍 Поиск кода для LLM

### Как найти нужный код?

1. **По функционалу**:
   - Комплаенс → `components/compliance/`, `app/api/compliance/`
   - Требования → `components/requirements/`, `app/api/requirements/`
   - Организации → `components/organizations/`, `app/api/organizations/`

2. **По типу**:
   - UI компоненты → `components/`
   - API endpoints → `app/api/`
   - Типы данных → `types/domain/`
   - Бизнес-логика → `lib/services/`
   - Провайдеры → `providers/`

3. **По паттерну**:
   - Создание → `create-*-dialog.tsx`, `POST /api/*/route.ts`
   - Редактирование → `edit-*-dialog.tsx`, `PATCH /api/*/[id]/route.ts`
   - Просмотр → `view-*-dialog.tsx`, `GET /api/*/[id]/route.ts`
   - Удаление → `DELETE /api/*/[id]/route.ts`

## 🐛 Отладка

### Debug Logs
Используйте `console.log("[v0] ...")` для отладки:
\`\`\`typescript
console.log("[v0] User context:", ctx.userId)
console.log("[v0] Tenant filter applied:", tenantId)
\`\`\`

### Проверка контекста
\`\`\`typescript
const ctx = await createExecutionContext()
console.log("[v0] ExecutionContext:", {
  tenantId: ctx.tenantId,
  userId: ctx.userId,
  organizationId: ctx.organizationId
})
\`\`\`

## 📚 Дополнительная документация

- [MULTI_TENANT_ARCHITECTURE.md](./MULTI_TENANT_ARCHITECTURE.md) - Детали мультитенантности
- [COMPONENTS_INDEX.md](./COMPONENTS_INDEX.md) - Индекс всех компонентов
- [API_INDEX.md](./API_INDEX.md) - Индекс всех API endpoints
