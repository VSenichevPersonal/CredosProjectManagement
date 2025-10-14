# Архитектура системы - Stage 13

## Обзор

IB Compliance Platform - мультитенантная система управления соответствием требованиям информационной безопасности, построенная на современных архитектурных паттернах.

## Архитектурные принципы

### 1. Layered Architecture (Слоистая архитектура)

\`\`\`
┌─────────────────────────────────────────────────────────┐
│   Presentation Layer (UI)                               │
│   - React Server Components                             │
│   - Client Components                                   │
│   - Next.js Pages & Layouts                             │
│   - SWR для клиентского состояния                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│   API Layer (Route Handlers)                            │
│   - app/api/**/*.ts                                     │
│   - Request validation                                  │
│   - ExecutionContext creation                           │
│   - Response formatting                                 │
│   - Error handling                                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│   Service Layer (Business Logic)                        │
│   - services/**/*.ts                                    │
│   - Domain logic                                        │
│   - Business rules validation                           │
│   - Orchestration                                       │
│   - Permission checks                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│   Repository Layer (Data Access)                        │
│   - providers/supabase/repositories/**/*.ts             │
│   - CRUD operations                                     │
│   - Query building                                      │
│   - Data mapping                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│   Infrastructure Layer                                  │
│   - Supabase (PostgreSQL + Auth + Storage + RLS)        │
│   - Vercel Blob Storage                                 │
│   - Vercel AI Gateway                                   │
└─────────────────────────────────────────────────────────┘
\`\`\`

### 2. Repository Pattern

**Цель**: Изоляция логики доступа к данным от бизнес-логики.

**Структура**:
\`\`\`typescript
// Repository Interface (в DatabaseProvider)
interface OrganizationRepository {
  findMany(filters?: any): Promise<Organization[]>
  findById(id: string): Promise<Organization | null>
  create(data: any): Promise<Organization>
  update(id: string, data: any): Promise<Organization>
  delete(id: string): Promise<void>
}

// Repository Implementation
class SupabaseOrganizationRepository implements OrganizationRepository {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string
  ) {}
  
  async findMany(filters?: any): Promise<Organization[]> {
    let query = this.supabase
      .from('organizations')
      .select('*')
      .eq('tenant_id', this.tenantId)
    
    // Apply filters...
    
    const { data, error } = await query
    if (error) throw error
    
    return data.map(OrganizationMapper.toDomain)
  }
}
\`\`\`

**Преимущества**:
- Легко тестировать (можно мокировать репозитории)
- Легко менять источник данных
- Чистая бизнес-логика в сервисах

### 3. Execution Context Pattern

**Цель**: Единый источник зависимостей для всех операций.

\`\`\`typescript
interface ExecutionContext {
  // User context
  user?: User
  organizationId?: string
  tenantId?: string
  
  // Infrastructure
  db: DatabaseProvider
  
  // Services
  logger: Logger
  audit: AuditService
  access: AccessControlService
  
  // Metadata
  requestId: string
  timestamp: Date
  request?: Request
  
  // Helpers
  getSubordinateOrganizations?: () => Promise<string[]>
}
\`\`\`

**Использование**:
\`\`\`typescript
// В API route
export async function GET(request: Request) {
  const ctx = await createExecutionContext(request)
  const requirements = await RequirementService.list(ctx, filters)
  return Response.json(requirements)
}

// В сервисе
static async list(ctx: ExecutionContext, filters: any) {
  await ctx.access.require(Permission.REQUIREMENT_READ)
  const requirements = await ctx.db.requirements.findMany(filters)
  await ctx.audit.log({ ... })
  return requirements
}
\`\`\`

### 4. Domain-Driven Design (DDD)

**Bounded Contexts**:
- **ComplianceContext** - управление требованиями и их исполнением
- **EvidenceContext** - управление доказательствами и документами
- **OrganizationContext** - управление организациями и пользователями
- **RiskContext** - управление рисками
- **AuditContext** - аудит и логирование

**Domain Models** (`types/domain/`):
\`\`\`typescript
// Чистые доменные модели без зависимостей от БД
interface Requirement {
  id: string
  code: string
  title: string
  description: string
  // ... domain fields
}
\`\`\`

**DTOs** (`types/dto/`):
\`\`\`typescript
// Объекты для передачи данных между слоями
interface CreateRequirementDTO {
  code: string
  title: string
  description: string
  // ... only fields needed for creation
}
\`\`\`

### 5. Multi-Tenancy

**Стратегия**: Shared database with tenant_id column.

**Реализация**:
- Каждая таблица содержит `tenant_id`
- RLS политики фильтруют по `tenant_id`
- ExecutionContext автоматически применяет фильтр
- Репозитории получают `tenantId` в конструкторе

\`\`\`sql
-- RLS Policy Example
CREATE POLICY "tenant_isolation" ON requirements
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
\`\`\`

### 6. RBAC (Role-Based Access Control)

**Роли** (иерархические):
\`\`\`
super_admin (все права)
  ↓
regulator_admin (управление регулятором)
  ↓
ministry_user (просмотр подведомственных)
  ↓
institution_user (работа в своей организации)
  ↓
ciso (управление комплаенсом)
  ↓
auditor (только чтение)
\`\`\`

**Permissions** (гранулярные):
\`\`\`typescript
enum Permission {
  REQUIREMENT_READ = "requirement:read",
  REQUIREMENT_CREATE = "requirement:create",
  COMPLIANCE_UPDATE = "compliance:update",
  // ... 30+ permissions
}
\`\`\`

**Проверка прав**:
\`\`\`typescript
// В сервисе
await ctx.access.require(Permission.REQUIREMENT_CREATE)

// Проверка доступа к организации
if (!await ctx.access.canAccessOrganization(orgId)) {
  throw new Error('Access denied')
}
\`\`\`

## Ключевые компоненты

### DatabaseProvider

Единый интерфейс для работы с данными:

\`\`\`typescript
interface DatabaseProvider {
  requirements: RequirementRepository
  organizations: OrganizationRepository
  compliance: ComplianceRepository
  evidence: EvidenceRepository
  controls: ControlRepository
  // ... 20+ repositories
}
\`\`\`

### Services

Бизнес-логика без зависимостей от инфраструктуры:

\`\`\`typescript
class RequirementService {
  static async list(ctx: ExecutionContext, filters: any) {
    // 1. Check permissions
    await ctx.access.require(Permission.REQUIREMENT_READ)
    
    // 2. Apply business rules
    const enhancedFilters = this.applyBusinessRules(ctx, filters)
    
    // 3. Fetch data
    const requirements = await ctx.db.requirements.findMany(enhancedFilters)
    
    // 4. Audit
    await ctx.audit.log({ ... })
    
    return requirements
  }
}
\`\`\`

### Repositories

Изолированная логика доступа к данным:

\`\`\`typescript
class RequirementRepository {
  async findMany(filters: any): Promise<Requirement[]> {
    // Build query
    let query = this.supabase
      .from('requirements')
      .select(`
        *,
        regulatory_framework:regulatory_frameworks(*),
        regulator:regulators(*)
      `)
      .eq('tenant_id', this.tenantId)
    
    // Apply filters
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    
    // Execute
    const { data, error } = await query
    if (error) throw error
    
    // Map to domain
    return data.map(RequirementMapper.toDomain)
  }
}
\`\`\`

### Mappers

Преобразование между БД и доменными моделями:

\`\`\`typescript
class RequirementMapper {
  static toDomain(row: any): Requirement {
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      // ... map all fields
      regulatoryFramework: row.regulatory_framework ? {
        id: row.regulatory_framework.id,
        name: row.regulatory_framework.name,
        // ...
      } : undefined
    }
  }
  
  static toDatabase(domain: Requirement): any {
    return {
      id: domain.id,
      code: domain.code,
      title: domain.title,
      // ... map to DB columns
    }
  }
}
\`\`\`

## Потоки данных

### Чтение данных (Read Flow)

\`\`\`
User Request
  ↓
API Route Handler
  ↓
createExecutionContext() → ExecutionContext
  ↓
Service.list(ctx, filters)
  ↓
ctx.access.require(Permission) → Check permissions
  ↓
ctx.db.repository.findMany(filters) → Repository
  ↓
Supabase Query → Database
  ↓
Mapper.toDomain(rows) → Domain Models
  ↓
ctx.audit.log() → Audit Log
  ↓
Return to API → JSON Response
\`\`\`

### Запись данных (Write Flow)

\`\`\`
User Request + Data
  ↓
API Route Handler
  ↓
validate(schema, data) → Validation
  ↓
createExecutionContext() → ExecutionContext
  ↓
Service.create(ctx, data)
  ↓
ctx.access.require(Permission) → Check permissions
  ↓
Business Rules Validation
  ↓
ctx.db.repository.create(data) → Repository
  ↓
Mapper.toDatabase(domain) → DB Format
  ↓
Supabase Insert → Database
  ↓
Mapper.toDomain(row) → Domain Model
  ↓
ctx.audit.log() → Audit Log
  ↓
Return to API → JSON Response
\`\`\`

## Безопасность

### Row Level Security (RLS)

Все таблицы защищены RLS политиками:

\`\`\`sql
-- Tenant isolation
CREATE POLICY "tenant_isolation" ON requirements
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Organization hierarchy
CREATE POLICY "org_hierarchy_access" ON compliance_records
  FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM get_subordinate_organizations(
        (SELECT organization_id FROM users WHERE id = auth.uid())
      )
    )
  );
\`\`\`

### Permission Checks

Проверка прав на каждом уровне:

\`\`\`typescript
// API Layer - authentication
const user = await getCurrentUser()
if (!user) throw new Error('Unauthorized')

// Service Layer - authorization
await ctx.access.require(Permission.REQUIREMENT_CREATE)

// Service Layer - resource access
if (!await ctx.access.canAccessOrganization(orgId)) {
  throw new Error('Access denied')
}
\`\`\`

### Audit Logging

Все изменения логируются:

\`\`\`typescript
await ctx.audit.log({
  eventType: 'requirement_created',
  userId: ctx.user!.id,
  resourceType: 'requirement',
  resourceId: requirement.id,
  changes: data,
  metadata: { ... }
})
\`\`\`

## Производительность

### Индексы

\`\`\`sql
-- Tenant filtering
CREATE INDEX idx_requirements_tenant_id ON requirements(tenant_id);

-- Common filters
CREATE INDEX idx_requirements_category ON requirements(category_id);
CREATE INDEX idx_requirements_framework ON requirements(regulatory_framework_id);

-- Composite indexes
CREATE INDEX idx_compliance_org_req ON compliance_records(organization_id, requirement_id);
\`\`\`

### Кэширование

\`\`\`typescript
// Client-side caching with SWR
const { data, error } = useSWR('/api/requirements', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000 // 1 minute
})
\`\`\`

### Pagination

\`\`\`typescript
const { data, total } = await RequirementService.list(ctx, {
  page: 1,
  limit: 50
})
\`\`\`

## Тестирование

### Unit Tests (планируется)

\`\`\`typescript
describe('RequirementService', () => {
  it('should list requirements with filters', async () => {
    const mockDb = createMockDatabaseProvider()
    const ctx = createMockExecutionContext({ db: mockDb })
    
    const requirements = await RequirementService.list(ctx, {
      category_id: 'cat-1'
    })
    
    expect(requirements).toHaveLength(5)
  })
})
\`\`\`

### Integration Tests (планируется)

\`\`\`typescript
describe('Requirements API', () => {
  it('should create requirement', async () => {
    const response = await fetch('/api/requirements', {
      method: 'POST',
      body: JSON.stringify({ ... })
    })
    
    expect(response.status).toBe(201)
  })
})
\`\`\`

## Мониторинг и логирование

### Structured Logging

\`\`\`typescript
ctx.logger.info('Requirement created', {
  requirementId: requirement.id,
  userId: ctx.user!.id,
  tenantId: ctx.tenantId
})
\`\`\`

### Error Tracking

\`\`\`typescript
try {
  // ...
} catch (error) {
  ctx.logger.error('Failed to create requirement', {
    error: error.message,
    stack: error.stack,
    userId: ctx.user!.id
  })
  throw error
}
\`\`\`

## Дальнейшее развитие

### Планируемые улучшения
- Event Sourcing для критичных операций
- CQRS для разделения чтения и записи
- GraphQL API для гибких запросов
- WebSocket для real-time обновлений
- Микросервисная архитектура для масштабирования

### Технический долг
- Добавить unit тесты для всех сервисов
- Добавить integration тесты для API
- Оптимизировать N+1 запросы
- Добавить rate limiting
- Улучшить error handling
