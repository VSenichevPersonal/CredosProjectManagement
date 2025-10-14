# Архитектура системы - Stage 11

## Обзор

IB Compliance Platform - это мультитенантная система управления соответствием требованиям информационной безопасности.

## Ключевые принципы

### 1. Domain-Driven Design (DDD)
Система организована вокруг бизнес-доменов:
- **ComplianceContext** - управление требованиями и их исполнением
- **EvidenceContext** - управление доказательствами и документами
- **UserContext** - управление пользователями, организациями, тенантами
- **RiskContext** - управление рисками

### 2. ExecutionContext Pattern
Все операции выполняются в контексте, содержащем:
- `userId` - кто выполняет операцию
- `tenantId` - в каком тенанте
- `organizationId` - в какой организации
- `roles` - роли пользователя
- `permissions` - права доступа

### 3. Provider Pattern
Провайдеры инкапсулируют работу с внешними системами:
- `DatabaseProvider` - работа с БД (Supabase)
- `StorageProvider` - работа с файлами
- `LLMProvider` - работа с AI моделями

### 4. Thin Services
Сервисы содержат бизнес-логику, но делегируют работу с данными провайдерам.

## Слои архитектуры

\`\`\`
┌─────────────────────────────────────┐
│   Presentation Layer (UI)           │
│   - React Components                │
│   - Next.js Pages                   │
│   - Client State (SWR)              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   API Layer (Route Handlers)        │
│   - app/api/**/*.ts                 │
│   - ExecutionContext creation       │
│   - Request/Response handling       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Service Layer (Business Logic)    │
│   - services/**/*.ts                │
│   - Domain logic                    │
│   - Validation                      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Provider Layer (Data Access)      │
│   - providers/**/*.ts               │
│   - Database queries                │
│   - External API calls              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Infrastructure Layer              │
│   - Supabase (PostgreSQL)           │
│   - Vercel Blob Storage             │
│   - AI Gateway                      │
└─────────────────────────────────────┘
\`\`\`

## Новые возможности Stage 11

### Режимы исполнения требований

Система поддерживает два режима исполнения требований:

#### Strict (Строгий) режим
- Организация использует только предложенные шаблоны мер контроля
- Можно загружать только разрешенные типы доказательств
- Валидация на уровне API

#### Flexible (Гибкий) режим
- Организация может создавать свои меры контроля
- Можно использовать любые типы доказательств
- Нет ограничений по шаблонам

### Новые сущности

#### EvidenceType (Тип доказательства)
\`\`\`typescript
interface EvidenceType {
  id: string
  tenant_id: string
  name: string
  description?: string
  icon?: string
  sort_order: number
}
\`\`\`

#### ControlMeasureTemplate (Шаблон меры контроля)
\`\`\`typescript
interface ControlMeasureTemplate {
  id: string
  tenant_id: string
  title: string
  description?: string
  implementation_guide?: string
  category?: string
  sort_order: number
}
\`\`\`

#### ControlMeasure (Мера контроля)
\`\`\`typescript
interface ControlMeasure {
  id: string
  tenant_id: string
  requirement_assignment_id: string
  template_id?: string  // Если создана из шаблона
  title: string
  description?: string
  status: 'planned' | 'in_progress' | 'implemented' | 'verified'
  responsible_user_id?: string
  due_date?: string
  completed_at?: string
}
\`\`\`

### Обновленные сущности

#### Requirement (Требование)
Добавлены поля для режимов:
\`\`\`typescript
interface Requirement {
  measure_mode: 'strict' | 'flexible'
  evidence_type_mode: 'strict' | 'flexible'
  allowed_evidence_type_ids: string[]
  suggested_control_measure_template_ids: string[]
}
\`\`\`

#### RequirementAssignment (compliance_records)
Добавлены поля для мер и дат:
\`\`\`typescript
interface RequirementAssignment {
  control_measure_ids: string[]
  evidence_ids: string[]
  next_due_date?: string
  last_confirmed_at?: string
}
\`\`\`

## Мультитенантность

### Изоляция данных
- Все таблицы содержат `tenant_id`
- RLS политики обеспечивают изоляцию на уровне БД
- ExecutionContext автоматически фильтрует по `tenant_id`

### Иерархия организаций
- Организации могут иметь родительскую организацию (`parent_id`)
- Пользователи видят свою организацию и подведомственные
- Super admin и regulator видят все организации в тенанте

## Безопасность

### Row Level Security (RLS)
Все таблицы защищены RLS политиками:
\`\`\`sql
CREATE POLICY "Users can only access their tenant data"
ON evidence
FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
\`\`\`

### Проверка прав доступа
\`\`\`typescript
// Проверка доступа к организации
if (!canAccessOrganization(ctx.user, organizationId)) {
  throw new Error('Access denied')
}
\`\`\`

## Производительность

### Индексы
Созданы индексы для часто используемых фильтров:
\`\`\`sql
CREATE INDEX idx_evidence_tenant_id ON evidence(tenant_id);
CREATE INDEX idx_evidence_organization_id ON evidence(organization_id);
CREATE INDEX idx_requirements_tenant_id ON requirements(tenant_id);
\`\`\`

### Кэширование
- Клиентское кэширование через SWR
- Дедупликация запросов
- Оптимистичные обновления

### Оптимизация запросов
- JOIN вместо N+1 запросов
- Pagination для больших списков
- Ранний выход в функциях

## Технологический стек

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - типизация
- **Tailwind CSS v4** - стилизация
- **shadcn/ui** - UI компоненты
- **SWR** - клиентское состояние

### Backend
- **Next.js API Routes** - API endpoints
- **Supabase** - PostgreSQL + Auth + Storage
- **Vercel** - хостинг и деплой

### AI/ML
- **Vercel AI SDK** - работа с LLM
- **AI Gateway** - управление AI запросами

## Структура проекта

\`\`\`
app/
├── (dashboard)/          # Защищенные страницы
│   ├── requirements/     # Управление требованиями
│   ├── compliance/       # Управление исполнением
│   ├── evidence/         # Управление доказательствами
│   └── admin/            # Админка
│       └── dictionaries/ # Справочники
├── api/                  # API endpoints
│   ├── requirements/
│   ├── compliance/
│   └── dictionaries/     # API для справочников
└── auth/                 # Аутентификация

components/
├── requirements/         # Компоненты требований
├── compliance/           # Компоненты исполнения
├── evidence/             # Компоненты доказательств
└── ui/                   # UI компоненты (shadcn)

lib/
├── context/              # ExecutionContext
├── services/             # Бизнес-логика
└── utils/                # Утилиты

providers/
├── database-provider.ts  # Интерфейс БД
├── supabase-provider.ts  # Реализация Supabase
└── storage-provider.ts   # Работа с файлами

types/
├── domain/               # Domain models
└── dto/                  # Data Transfer Objects

scripts/
└── *.sql                 # SQL миграции
\`\`\`

## Дальнейшее развитие

### Планируемые улучшения
- Автоматическое создание мер на основе AI
- Рекомендации по типам доказательств
- Валидация доказательств через AI
- Автоматическое обновление статусов
- Интеграция с внешними системами (1С, SIEM)

### Технический долг
- Миграция старых компонентов на новую архитектуру
- Добавление unit тестов для сервисов
- Оптимизация SQL запросов
- Документирование всех API endpoints
