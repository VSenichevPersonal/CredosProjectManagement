# README for LLM: Принципы разработки

## ⚠️ КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА

### 🚫 НЕ ЗАКРЫВАТЬ СТАДИИ БЕЗ СОГЛАСОВАНИЯ!

**Стадии разработки (Stage 15, 16, 17...) НЕ закрываются автоматически!**

- ❌ **НЕ ГОВОРИТЬ** "Stage X завершен!" без явного согласования с пользователем
- ❌ **НЕ СОЗДАВАТЬ** финальные документы типа "STAGE_X_COMPLETE.md" без разрешения
- ❌ **НЕ ПИСАТЬ** "Closes #stage-X" в коммитах без подтверждения
- ❌ **НЕ ИНИЦИАЛИЗИРОВАТЬ** новую стадию без запроса

**ПРАВИЛЬНО:**
- ✅ **СПРОСИТЬ:** "Закрываем Stage X?" перед любой финализацией
- ✅ **ДОЖДАТЬСЯ** подтверждения от пользователя
- ✅ **ТОЛЬКО ПОТОМ** создавать финальные документы и Summary

**Причина:** Стадии НЕ планируются жестко. Работа может продолжаться в рамках одной стадии долго. Пользователь сам решает когда закрыть стадию.

### 🚫 НЕ КОММИТИТЬ СЛИШКОМ ЧАСТО!

**Коммиты должны быть осмысленными и накапливать изменения!**

- ❌ **НЕ КОММИТИТЬ** после каждого файла
- ❌ **НЕ ДЕЛАТЬ** 10+ коммитов за сессию для мелких правок
- ❌ **НЕ ПУШИТЬ** сразу после коммита (дать время на синхронизацию)

**ПРАВИЛЬНО:**
- ✅ **НАКАПЛИВАТЬ** логически связанные изменения
- ✅ **СПРАШИВАТЬ:** "Закоммитить изменения?" когда накопился хороший объем
- ✅ **ГРУППИРОВАТЬ:** несколько файлов в один осмысленный коммит
- ✅ **ДЕЛАТЬ ПАУЗУ** 2-3 секунды между commit и push

**Примеры хороших коммитов:**
```
✅ feat: добавлена система документов (5 файлов, миграция + типы + UI)
✅ fix: исправлены критические баги (3 компонента)
✅ docs: обновлена архитектурная документация (10 файлов)
```

**Примеры плохих коммитов:**
```
❌ fix: опечатка
❌ update: добавлен импорт
❌ refactor: переименована переменная
```

**Причина:** Git не успевает синхронизироваться при частых коммитах. Лучше 3 больших осмысленных коммита, чем 20 мелких.

---

## Цель документа
Этот документ описывает ключевые принципы разработки проекта IB Compliance Platform для обеспечения понятности кода как для LLM, так и для человека-разработчика.

---

## 1. Domain-Driven Design (DDD)

### Принцип
Код организован вокруг бизнес-доменов, а не технических слоев.

### Bounded Contexts
Система разделена на изолированные контексты:
- **EvidenceContext** - управление доказательствами и документами
- **ComplianceContext** - управление требованиями и комплаенсом
- **UserContext** - управление пользователями, ролями, тенантами
- **RiskContext** - управление рисками

### Структура
\`\`\`
services/
  ├── evidence-service.ts       # EvidenceContext
  ├── document-service.ts       # EvidenceContext
  ├── requirement-service.ts    # ComplianceContext
  ├── compliance-service.ts     # ComplianceContext
  └── organization-service.ts   # UserContext

types/domain/
  ├── evidence.ts               # Domain models
  ├── document.ts
  ├── requirement.ts
  └── user.ts
\`\`\`

### Правила
- Каждый сервис отвечает за свой домен
- Домены общаются через события (event-driven)
- Нет прямых зависимостей между доменами
- Используйте DTO для передачи данных между слоями

---

## 2. ExecutionContext (ctx*)

### Принцип
Все операции выполняются в контексте, который содержит информацию о пользователе, тенанте и правах доступа.

### Структура ExecutionContext
\`\`\`typescript
interface ExecutionContext {
  userId: string           // Кто выполняет операцию
  tenantId: string         // В каком тенанте
  organizationId?: string  // В какой организации
  roles: string[]          // Роли пользователя
  permissions: string[]    // Права доступа
}
\`\`\`

### Использование
\`\`\`typescript
// ❌ НЕПРАВИЛЬНО: Прямой доступ к БД без контекста
const documents = await supabase.from('evidence').select('*')

// ✅ ПРАВИЛЬНО: Через ExecutionContext
const ctx = await createExecutionContext(request)
const documents = await documentService.getAll(ctx)
\`\`\`

### Правила
- Всегда создавайте ExecutionContext в начале API route
- Передавайте ctx первым параметром в сервисы
- Используйте ctx для проверки прав доступа
- Используйте ctx для автоматической фильтрации по tenant_id

---

## 3. Сервисная архитектура (Thin Services)

### Принцип
Сервисы содержат бизнес-логику, но делегируют работу с данными провайдерам.

### Слои
\`\`\`
API Route (app/api/)
    ↓
Service (services/)
    ↓
Provider (providers/)
    ↓
Database (Supabase)
\`\`\`

### Thin Service Pattern
\`\`\`typescript
// ❌ НЕПРАВИЛЬНО: Сервис содержит SQL запросы
class DocumentService {
  async getAll(ctx: ExecutionContext) {
    const { data } = await supabase
      .from('evidence')
      .select('*')
      .eq('tenant_id', ctx.tenantId)
    return data
  }
}

// ✅ ПРАВИЛЬНО: Сервис делегирует провайдеру
class DocumentService {
  constructor(private provider: DatabaseProvider) {}
  
  async getAll(ctx: ExecutionContext): Promise<Document[]> {
    // Бизнес-логика (валидация, трансформация)
    const filters = { evidenceType: 'document' }
    
    // Делегирование провайдеру
    return this.provider.evidence.getAll(ctx, filters)
  }
}
\`\`\`

### Правила
- Сервисы НЕ содержат SQL запросы
- Сервисы содержат бизнес-логику и валидацию
- Провайдеры содержат работу с данными
- Один сервис = один домен

---

## 4. Провайдерная архитектура

### Принцип
Провайдеры инкапсулируют работу с внешними системами (БД, Storage, AI).

### Типы провайдеров
\`\`\`
providers/
  ├── database-provider.ts      # Интерфейс для БД
  ├── supabase-provider.ts      # Реализация для Supabase
  ├── storage-provider.ts       # Работа с файлами
  └── llm/
      ├── llm-provider.interface.ts
      ├── openai-provider.ts
      └── anthropic-provider.ts
\`\`\`

### Интерфейс провайдера
\`\`\`typescript
interface DatabaseProvider {
  evidence: {
    getAll(ctx: ExecutionContext, filters?: Filters): Promise<Evidence[]>
    getById(ctx: ExecutionContext, id: string): Promise<Evidence | null>
    create(ctx: ExecutionContext, data: CreateEvidenceDTO): Promise<Evidence>
    update(ctx: ExecutionContext, id: string, data: UpdateEvidenceDTO): Promise<Evidence>
    delete(ctx: ExecutionContext, id: string): Promise<void>
  }
  // ... другие сущности
}
\`\`\`

### Правила
- Провайдеры реализуют интерфейсы
- Легко заменить провайдера (Supabase → PostgreSQL)
- Провайдеры автоматически фильтруют по tenant_id
- Провайдеры обрабатывают ошибки БД

---

## 5. LLM-Friendly код

### Принцип
Код должен быть понятен как для LLM, так и для человека.

### Правила именования
\`\`\`typescript
// ❌ НЕПРАВИЛЬНО: Неясные сокращения
const getEvd = async (id: string) => { ... }
const updDoc = async (d: Doc) => { ... }

// ✅ ПРАВИЛЬНО: Полные, понятные имена
const getEvidenceById = async (evidenceId: string) => { ... }
const updateDocument = async (document: Document) => { ... }
\`\`\`

### Структура файлов
\`\`\`typescript
// ✅ Каждый файл начинается с комментария о назначении
/**
 * DocumentService
 * 
 * Manages document lifecycle: creation, versioning, analysis.
 * Part of EvidenceContext.
 */

// ✅ Импорты сгруппированы
// External dependencies
import { z } from 'zod'

// Internal types
import type { Document, DocumentVersion } from '@/types/domain/document'

// Internal services
import { DocumentAnalysisService } from './document-analysis-service'

// ✅ Экспорты в конце файла
export { DocumentService }
export type { CreateDocumentDTO, UpdateDocumentDTO }
\`\`\`

### Комментарии
\`\`\`typescript
// ✅ Комментарии объясняют "почему", а не "что"
// Filter by tenant_id to ensure multi-tenant isolation
const documents = await provider.evidence.getAll(ctx, { 
  tenantId: ctx.tenantId 
})

// ✅ Сложная логика объясняется
// Calculate actuality score based on:
// 1. Days since last update (weight: 40%)
// 2. Days since regulatory change (weight: 40%)
// 3. Expiration date proximity (weight: 20%)
const actualityScore = calculateActualityScore(document)
\`\`\`

### Правила
- Используйте TypeScript для типизации
- Избегайте сокращений в именах
- Добавляйте JSDoc для публичных методов
- Группируйте импорты логически
- Комментируйте сложную бизнес-логику

---

## 6. Оптимизация вычислительных ресурсов

### Принцип
Код должен быть эффективным и не тратить ресурсы впустую.

### Правила оптимизации

#### 6.1 Ранний выход (Early Return)
\`\`\`typescript
// ❌ НЕПРАВИЛЬНО: Вложенные условия
async function getDocument(ctx: ExecutionContext, id: string) {
  if (ctx.userId) {
    if (ctx.tenantId) {
      const doc = await provider.evidence.getById(ctx, id)
      if (doc) {
        return doc
      } else {
        throw new Error('Not found')
      }
    } else {
      throw new Error('No tenant')
    }
  } else {
    throw new Error('No user')
  }
}

// ✅ ПРАВИЛЬНО: Ранний выход
async function getDocument(ctx: ExecutionContext, id: string) {
  if (!ctx.userId) throw new Error('No user')
  if (!ctx.tenantId) throw new Error('No tenant')
  
  const doc = await provider.evidence.getById(ctx, id)
  if (!doc) throw new Error('Not found')
  
  return doc
}
\`\`\`

#### 6.2 Избегайте N+1 запросов
\`\`\`typescript
// ❌ НЕПРАВИЛЬНО: N+1 запросов
const documents = await getDocuments()
for (const doc of documents) {
  doc.organization = await getOrganization(doc.organizationId) // N запросов!
}

// ✅ ПРАВИЛЬНО: JOIN или batch запрос
const documents = await supabase
  .from('evidence')
  .select('*, organization:organizations(*)')
\`\`\`

#### 6.3 Кэширование
\`\`\`typescript
// ✅ Используйте SWR для клиентского кэширования
const { data: documents } = useSWR(
  `/api/documents?tenantId=${tenantId}`,
  fetcher,
  { revalidateOnFocus: false, dedupingInterval: 60000 }
)

// ✅ Используйте мемоизацию для тяжелых вычислений
const actualityScore = useMemo(
  () => calculateActualityScore(document),
  [document.updatedAt, document.expiresAt]
)
\`\`\`

#### 6.4 Индексы БД
\`\`\`sql
-- ✅ Создавайте индексы для часто используемых фильтров
CREATE INDEX idx_evidence_tenant_id ON evidence(tenant_id);
CREATE INDEX idx_evidence_organization_id ON evidence(organization_id);
CREATE INDEX idx_evidence_type ON evidence(evidence_type);
\`\`\`

### Правила
- Используйте ранний выход для упрощения логики
- Избегайте N+1 запросов (используйте JOIN)
- Кэшируйте данные на клиенте (SWR)
- Создавайте индексы для часто используемых полей
- Используйте pagination для больших списков

---

## 7. Понятность для человека

### Принцип
Код должен читаться как книга, а не как головоломка.

### Правила

#### 7.1 Функции делают одно дело
\`\`\`typescript
// ❌ НЕПРАВИЛЬНО: Функция делает слишком много
async function processDocument(file: File) {
  const uploaded = await uploadFile(file)
  const analyzed = await analyzeDocument(uploaded)
  const saved = await saveDocument(analyzed)
  await sendNotification(saved)
  await updateStatistics()
  return saved
}

// ✅ ПРАВИЛЬНО: Разбито на шаги
async function processDocument(file: File) {
  const document = await uploadAndAnalyze(file)
  await notifyStakeholders(document)
  return document
}

async function uploadAndAnalyze(file: File) {
  const uploaded = await uploadFile(file)
  return await analyzeDocument(uploaded)
}
\`\`\`

#### 7.2 Константы вместо магических чисел
\`\`\`typescript
// ❌ НЕПРАВИЛЬНО: Магические числа
if (daysSinceUpdate > 180) {
  status = 'outdated'
}

// ✅ ПРАВИЛЬНО: Именованные константы
const DAYS_UNTIL_OUTDATED = 180
if (daysSinceUpdate > DAYS_UNTIL_OUTDATED) {
  status = 'outdated'
}
\`\`\`

#### 7.3 Типы вместо any
\`\`\`typescript
// ❌ НЕПРАВИЛЬНО: any теряет типизацию
function processData(data: any) {
  return data.map((item: any) => item.value)
}

// ✅ ПРАВИЛЬНО: Строгая типизация
interface DataItem {
  value: string
  metadata: Record<string, unknown>
}

function processData(data: DataItem[]): string[] {
  return data.map(item => item.value)
}
\`\`\`

### Правила
- Одна функция = одна ответственность
- Используйте константы для магических чисел
- Избегайте any, используйте строгую типизацию
- Разбивайте большие функции на маленькие
- Используйте говорящие имена переменных

---

## 8. Прочие принципы DDD и сопровождения

### 8.1 Ubiquitous Language
Используйте единый язык бизнеса в коде:
- **Evidence** (доказательство), а не "file" или "attachment"
- **Requirement** (требование), а не "rule" или "regulation"
- **Compliance** (соответствие), а не "status" или "check"
- **Tenant** (тенант), а не "company" или "client"

### 8.2 Aggregates
Группируйте связанные сущности:
\`\`\`typescript
// Document - это aggregate root
interface Document {
  id: string
  versions: DocumentVersion[]  // Aggregate members
  analyses: DocumentAnalysis[]  // Aggregate members
}

// Работа с aggregate через root
document.addVersion(newVersion)
document.analyzeChanges()
\`\`\`

### 8.3 Value Objects
Используйте value objects для бизнес-концепций:
\`\`\`typescript
// ✅ Value Object для статуса документа
class DocumentStatus {
  constructor(private value: 'draft' | 'active' | 'archived' | 'expired') {}
  
  isActive(): boolean {
    return this.value === 'active'
  }
  
  canBeEdited(): boolean {
    return this.value === 'draft' || this.value === 'active'
  }
}
\`\`\`

### 8.4 Repository Pattern
Инкапсулируйте доступ к данным:
\`\`\`typescript
// ✅ Repository для работы с документами
interface DocumentRepository {
  findById(id: string): Promise<Document | null>
  findByTenant(tenantId: string): Promise<Document[]>
  save(document: Document): Promise<void>
  delete(id: string): Promise<void>
}
\`\`\`

### 8.5 Event Sourcing (опционально)
Храните историю изменений через события:
\`\`\`typescript
// События домена
interface DocumentCreated {
  documentId: string
  createdBy: string
  createdAt: Date
}

interface DocumentVersionAdded {
  documentId: string
  versionId: string
  versionNumber: number
}
\`\`\`

---

## 9. Чеклист для code review

### Перед коммитом проверьте:

- [ ] Код следует DDD принципам (домены изолированы)
- [ ] ExecutionContext используется везде
- [ ] Сервисы тонкие (thin), логика в провайдерах
- [ ] Имена понятны для LLM и человека
- [ ] Нет магических чисел, используются константы
- [ ] Нет N+1 запросов
- [ ] Есть индексы для новых фильтров
- [ ] Типы строгие, нет any
- [ ] Функции делают одно дело
- [ ] Есть комментарии для сложной логики
- [ ] Код оптимизирован (ранний выход, кэширование)
- [ ] Тесты покрывают новый функционал

---

## 10. Примеры кода

### Пример 1: Создание нового сервиса
\`\`\`typescript
/**
 * ThreatModelService
 * 
 * Manages threat models and threats.
 * Part of RiskContext.
 */

import type { ExecutionContext } from '@/lib/context/execution-context'
import type { DatabaseProvider } from '@/providers/database-provider'
import type { ThreatModel, Threat } from '@/types/domain/threat'

export class ThreatModelService {
  constructor(private provider: DatabaseProvider) {}
  
  /**
   * Get all threat models for tenant
   */
  async getAll(ctx: ExecutionContext): Promise<ThreatModel[]> {
    // Validate context
    if (!ctx.tenantId) {
      throw new Error('Tenant ID required')
    }
    
    // Delegate to provider
    return this.provider.threatModels.getAll(ctx)
  }
  
  /**
   * Activate new threat model version
   * Deactivates previous version and notifies stakeholders
   */
  async activate(
    ctx: ExecutionContext, 
    modelId: string
  ): Promise<void> {
    // Business logic: deactivate old version
    const currentActive = await this.provider.threatModels.getActive(ctx)
    if (currentActive) {
      await this.provider.threatModels.deactivate(ctx, currentActive.id)
    }
    
    // Activate new version
    await this.provider.threatModels.activate(ctx, modelId)
    
    // Notify stakeholders (event-driven)
    await this.publishEvent({
      type: 'ThreatModelActivated',
      modelId,
      tenantId: ctx.tenantId,
      activatedBy: ctx.userId
    })
  }
}
\`\`\`

### Пример 2: API Route с ExecutionContext
\`\`\`typescript
// app/api/threat-models/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createExecutionContext } from '@/lib/context/create-context'
import { ThreatModelService } from '@/services/threat-model-service'
import { SupabaseDatabaseProvider } from '@/providers/supabase-provider'

export async function GET(request: NextRequest) {
  try {
    // Create execution context
    const ctx = await createExecutionContext(request)
    
    // Initialize service with provider
    const provider = new SupabaseDatabaseProvider(ctx)
    const service = new ThreatModelService(provider)
    
    // Execute business logic
    const threatModels = await service.getAll(ctx)
    
    return NextResponse.json(threatModels)
  } catch (error) {
    console.error('[API] Error fetching threat models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch threat models' },
      { status: 500 }
    )
  }
}
\`\`\`

---

## 11. Управление подведомственными организациями

### Принцип
Пользователи видят только свою организацию и подведомственные ей организации. Суперадмин и регулятор видят все организации в тенанте.

### Архитектура

#### 11.1 Иерархия организаций
\`\`\`typescript
// Таблица organizations имеет поле parent_id
interface Organization {
  id: string
  tenant_id: string
  parent_id?: string  // Ссылка на вышестоящую организацию
  name: string
}
\`\`\`

#### 11.2 Атрибут организации у пользователя
\`\`\`typescript
interface User {
  id: string
  tenant_id: string
  organization_id?: string  // Nullable - для super_admin и regulator
  role: string
}
\`\`\`

**Правила:**
- `organization_id` **опционален** (nullable)
- Super admin и regulator могут не иметь организации
- Обычные пользователи должны иметь организацию

#### 11.3 Логика доступа

\`\`\`typescript
// Функция определения доступных организаций
function getAccessibleOrganizationIds(user: ExtendedUser): string[] | "all" {
  // Super admin и regulator видят все организации в тенанте
  if (user.role === "super_admin" || user.role === "regulator") {
    return "all"
  }

  // Пользователь без организации не видит ничего
  if (!user.organizationId) {
    return []
  }

  // Пользователь видит свою организацию + подведомственные
  return [user.organizationId, ...user.subordinateOrganizationIds]
}
\`\`\`

#### 11.4 SQL функция для получения подведомственных

\`\`\`sql
-- Рекурсивная функция get_subordinate_organizations
-- Возвращает ID всех подведомственных организаций
CREATE FUNCTION get_subordinate_organizations(org_id UUID)
RETURNS TABLE(id UUID) AS $$
  WITH RECURSIVE subordinates AS (
    -- Базовый случай: сама организация
    SELECT id, parent_id FROM organizations WHERE id = org_id
    UNION ALL
    -- Рекурсия: все дочерние организации
    SELECT o.id, o.parent_id
    FROM organizations o
    INNER JOIN subordinates s ON o.parent_id = s.id
  )
  SELECT id FROM subordinates;
$$ LANGUAGE SQL;
\`\`\`

#### 11.5 Использование в API

\`\`\`typescript
// ✅ ПРАВИЛЬНО: Фильтрация по доступным организациям
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  const accessibleIds = getAccessibleOrganizationIds(user)
  
  let query = supabase
    .from("compliance_records")
    .eq("tenant_id", user.tenantId)
  
  // Фильтр по доступным организациям
  if (accessibleIds !== "all") {
    query = query.in("organization_id", accessibleIds)
  }
  
  const { data } = await query
  return Response.json({ data })
}
\`\`\`

#### 11.6 Проверка доступа к конкретной организации

\`\`\`typescript
// Проверка доступа к организации
function canAccessOrganization(
  user: ExtendedUser,
  organizationId: string
): boolean {
  const accessibleIds = getAccessibleOrganizationIds(user)
  
  if (accessibleIds === "all") return true
  return accessibleIds.includes(organizationId)
}

// Использование в API
if (!canAccessOrganization(user, organizationId)) {
  return Response.json({ error: "Access denied" }, { status: 403 })
}
\`\`\`

### Правила реализации

- ✅ Всегда загружайте `subordinateOrganizationIds` в `getCurrentUser()`
- ✅ Используйте `getAccessibleOrganizationIds()` для фильтрации
- ✅ Проверяйте доступ через `canAccessOrganization()` перед операциями
- ✅ Super admin и regulator получают `"all"` вместо списка ID
- ✅ Пользователь без организации получает пустой массив `[]`
- ✅ Фильтруйте данные по `organization_id IN (accessibleIds)`

### Примеры

#### Пример 1: Загрузка compliance records
\`\`\`typescript
const user = await getCurrentUser()
const accessibleIds = getAccessibleOrganizationIds(user)

let query = supabase
  .from("compliance_records")
  .eq("tenant_id", user.tenantId)

if (accessibleIds !== "all") {
  query = query.in("organization_id", accessibleIds)
}

const { data } = await query
\`\`\`

#### Пример 2: Проверка доступа к организации
\`\`\`typescript
const user = await getCurrentUser()

if (!canAccessOrganization(user, targetOrganizationId)) {
  throw new Error("Access denied to this organization")
}

// Продолжаем операцию
\`\`\`

#### Пример 3: Создание записи с проверкой
\`\`\`typescript
const user = await getCurrentUser()

// Проверяем, что пользователь может создать запись для этой организации
if (!canAccessOrganization(user, data.organization_id)) {
  throw new Error("Cannot create record for this organization")
}

await supabase.from("compliance_records").insert({
  ...data,
  tenant_id: user.tenantId,
})
\`\`\`

---

## 12. Stage 14: Continuous Compliance Architecture

### Обзор
Stage 14 представляет фундаментальный переход от "реестра требований" к "платформе непрерывного соответствия" (Continuous Compliance) по модели SGRC (Security, Governance, Risk, and Compliance).

### Ключевые изменения

#### 12.1 Новая иерархия: Requirement → Control → Evidence

**Было (Stage 13):**
\`\`\`
Requirement → Evidence Types → Evidence
\`\`\`

**Стало (Stage 14):**
\`\`\`
Requirement → Control Measure Templates → Control Measures → Evidence Types → Evidence
\`\`\`

#### 12.2 Переиспользование доказательств

- Таблица `evidence_links` для many-to-many связей
- Одно доказательство может подтверждать несколько мер контроля
- Снижение нагрузки на организации

#### 12.3 Continuous Compliance Model

- Нет фиксированных сроков проверки
- Real-time расчёт статуса на основе наличия доказательств
- Автоматическая агрегация: мера → требование → организация

#### 12.4 Flexible vs Strict Modes

Требования имеют `measure_mode`:
- **flexible**: Организации могут добавлять свои меры
- **strict**: Только предопределённые меры из шаблонов

### Новые сервисы

#### ControlMeasureService
\`\`\`typescript
class ControlMeasureService {
  // Создать меры из шаблонов
  static async createFromTemplate(
    ctx: ExecutionContext,
    complianceRecordId: string,
    templateId: string
  ): Promise<ControlMeasure>

  // Рассчитать завершённость меры
  static async calculateCompletion(
    ctx: ExecutionContext,
    measureId: string
  ): Promise<number>

  // Получить меры с доказательствами
  static async getWithEvidence(
    ctx: ExecutionContext,
    complianceRecordId: string
  ): Promise<ControlMeasureWithEvidence[]>
}
\`\`\`

#### EvidenceLinkService
\`\`\`typescript
class EvidenceLinkService {
  // Связать доказательство с мерой
  static async linkEvidence(
    ctx: ExecutionContext,
    evidenceId: string,
    measureId: string
  ): Promise<EvidenceLink>

  // Получить все меры, использующие доказательство
  static async getMeasuresForEvidence(
    ctx: ExecutionContext,
    evidenceId: string
  ): Promise<ControlMeasure[]>

  // Массовое связывание
  static async bulkLink(
    ctx: ExecutionContext,
    evidenceId: string,
    measureIds: string[]
  ): Promise<EvidenceLink[]>
}
\`\`\`

### Обновлённые сервисы

#### ComplianceService
\`\`\`typescript
// Автоматическое создание мер из шаблонов при создании compliance record
static async create(
  ctx: ExecutionContext,
  data: CreateComplianceRecordDTO
): Promise<ComplianceRecord> {
  // 1. Создать compliance record
  const record = await ctx.db.compliance.create(data)
  
  // 2. Получить шаблоны мер из требования
  const requirement = await ctx.db.requirements.findById(data.requirementId)
  
  // 3. Создать меры из шаблонов
  for (const templateId of requirement.suggestedControlMeasureTemplateIds) {
    await ControlMeasureService.createFromTemplate(ctx, record.id, templateId)
  }
  
  return record
}
\`\`\`

#### EvidenceService
\`\`\`typescript
// Поддержка evidence_links
static async linkToMeasures(
  ctx: ExecutionContext,
  evidenceId: string,
  measureIds: string[]
): Promise<void> {
  await EvidenceLinkService.bulkLink(ctx, evidenceId, measureIds)
}
\`\`\`

### Схема БД

#### Новые таблицы
\`\`\`sql
-- Связи доказательств с мерами (many-to-many)
CREATE TABLE evidence_links (
  id UUID PRIMARY KEY,
  evidence_id UUID REFERENCES evidence(id),
  control_measure_id UUID REFERENCES control_measures(id),
  requirement_id UUID REFERENCES requirements(id),
  linked_by UUID REFERENCES users(id),
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 5),
  notes TEXT,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  UNIQUE(evidence_id, control_measure_id)
);
\`\`\`

#### Обновлённые таблицы
\`\`\`sql
-- Шаблоны мер с рекомендуемыми типами доказательств
ALTER TABLE control_measure_templates 
  ADD COLUMN recommended_evidence_type_ids UUID[];

-- Требования с режимом мер
ALTER TABLE requirements 
  ADD COLUMN measure_mode VARCHAR(20) DEFAULT 'flexible'
  CHECK (measure_mode IN ('flexible', 'strict'));

-- Меры с разрешёнными типами доказательств
ALTER TABLE control_measures
  ADD COLUMN allowed_evidence_type_ids UUID[];
\`\`\`

### UI Architecture

#### Role-Based Views

**Administrator/CISO View:**
- Полный контроль над требованиями, мерами, типами доказательств
- Настройка шаблонов и назначение задач
- Комплексный интерфейс со всеми функциями

**Executor View (Упрощённый):**
- Dashboard "Мои задачи"
- Простая загрузка доказательств
- Отслеживание статуса
- Без доступа к настройкам

#### Компоненты

\`\`\`
app/(dashboard)/
  ├─ requirements/[id]/
  │   └─ page.tsx (показывает suggested measures)
  ├─ compliance/[id]/
  │   └─ page.tsx (показывает actual measures с evidence)
  └─ executor/
      └─ my-tasks/
          └─ page.tsx (упрощённый вид)

components/
  ├─ requirements/
  │   └─ requirement-controls-tab.tsx (suggested measures)
  ├─ compliance/
  │   ├─ control-measure-card.tsx (мера с доказательствами)
  │   └─ compliance-measures-tab.tsx (все меры)
  ├─ evidence/
  │   ├─ evidence-upload-dialog.tsx (связь с мерами)
  │   └─ evidence-links-table.tsx (показать переиспользование)
  └─ executor/
      ├─ my-tasks-dashboard.tsx (упрощённый)
      └─ simple-evidence-upload.tsx (для исполнителей)
\`\`\`

### Правила реализации

#### 12.5 Создание compliance record
\`\`\`typescript
// ✅ ПРАВИЛЬНО: Автоматически создавать меры из шаблонов
const record = await ComplianceService.create(ctx, {
  requirementId: "req-1",
  organizationId: "org-1"
})
// Автоматически создаст меры из suggested_control_measure_template_ids
\`\`\`

#### 12.6 Загрузка доказательства
\`\`\`typescript
// ✅ ПРАВИЛЬНО: Связывать с конкретными мерами
const evidence = await EvidenceService.create(ctx, {
  file: file,
  evidenceTypeId: "type-1"
})

await EvidenceLinkService.linkEvidence(ctx, evidence.id, measureId)
\`\`\`

#### 12.7 Расчёт статуса
\`\`\`typescript
// Статус меры
const completion = await ControlMeasureService.calculateCompletion(ctx, measureId)
// completion = (linked_evidence_count / required_evidence_count) * 100

// Статус compliance record
const status = allMeasuresCompleted ? 'compliant' : 'in_progress'
\`\`\`

### Миграция

Выполнено 7 шагов миграции:
1. ✅ Добавлены новые структуры (evidence_links, колонки)
2. ✅ Обновлены шаблоны мер с типами доказательств
3. ✅ Очищены старые данные
4. ✅ Обновлены требования с suggested measures
5. ✅ Созданы тестовые compliance records
6. ✅ Созданы тестовые доказательства и связи
7. ✅ Обновлены RLS политики

### Документация Stage 14

Полная документация находится в `docs/stage-14/`:
- `README.md` - Обзор Stage 14
- `ARCHITECTURE.md` - Детальная архитектура
- `CONTINUOUS_COMPLIANCE.md` - Модель непрерывного соответствия
- `DATABASE_SCHEMA.md` - Схема БД
- `API_REFERENCE.md` - Справочник API
- `reference-book-pattern.md` - Паттерн справочников

### Принципы Continuous Compliance

1. **No Due Dates**: Статус рассчитывается в реальном времени
2. **Evidence Reusability**: Одно доказательство → много мер
3. **Flexible/Strict Modes**: Адаптация под разные требования
4. **Real-time Status**: Автоматическая агрегация статусов
5. **Role-Based UI**: Упрощённый интерфейс для исполнителей

---

## Заключение

Следуя этим принципам, вы создаете код, который:
- ✅ Понятен для LLM и человека
- ✅ Легко поддерживается и расширяется
- ✅ Оптимизирован по производительности
- ✅ Следует лучшим практикам DDD
- ✅ Готов к масштабированию
- ✅ Поддерживает Continuous Compliance модель (Stage 14)

**Помните:** Код пишется один раз, но читается сотни раз. Пишите для читателя, а не для компилятора.
