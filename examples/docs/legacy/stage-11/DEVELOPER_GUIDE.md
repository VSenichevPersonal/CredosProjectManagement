# Руководство для разработчиков - Stage 11

## Быстрый старт

### 1. Клонирование и установка

\`\`\`bash
git clone <repository-url>
cd ib-compliance-platform
npm install
\`\`\`

### 2. Настройка окружения

Создайте `.env.local`:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
\`\`\`

### 3. Запуск миграций

\`\`\`bash
# Выполните миграции в Supabase
# scripts/150_add_compliance_modes_architecture.sql
# scripts/151_seed_evidence_types.sql
\`\`\`

### 4. Запуск проекта

\`\`\`bash
npm run dev
\`\`\`

## Работа с режимами исполнения

### Создание требования с режимами

\`\`\`typescript
import { createExecutionContext } from '@/lib/context/create-context'
import { SupabaseDatabaseProvider } from '@/providers/supabase-provider'

export async function POST(request: NextRequest) {
  const ctx = await createExecutionContext(request)
  const provider = new SupabaseDatabaseProvider(ctx)
  
  const data = await request.json()
  
  // Создание требования с режимами
  const requirement = await provider.requirements.create(ctx, {
    title: data.title,
    description: data.description,
    measure_mode: 'strict',  // или 'flexible'
    evidence_type_mode: 'strict',  // или 'flexible'
    suggested_control_measure_template_ids: data.templateIds,
    allowed_evidence_type_ids: data.evidenceTypeIds
  })
  
  return NextResponse.json(requirement)
}
\`\`\`

### Валидация меры в strict режиме

\`\`\`typescript
// Проверка режима требования
const requirement = await provider.requirements.findById(ctx, requirementId)

if (requirement.measure_mode === 'strict') {
  // Проверяем, что templateId в списке разрешенных
  if (!data.templateId) {
    throw new Error('Template required in strict mode')
  }
  
  if (!requirement.suggested_control_measure_template_ids.includes(data.templateId)) {
    throw new Error('Template not allowed in strict mode')
  }
}

// Создание меры
const measure = await provider.controlMeasures.create(ctx, {
  requirementAssignmentId: data.requirementAssignmentId,
  templateId: data.templateId,
  title: data.title,
  status: 'planned'
})
\`\`\`

## Работа со справочниками

### Получение справочников

\`\`\`typescript
// В компоненте
import useSWR from 'swr'

function MyComponent() {
  const { data: evidenceTypes } = useSWR('/api/dictionaries/evidence-types')
  const { data: templates } = useSWR('/api/dictionaries/control-measure-templates')
  
  return (
    <div>
      {evidenceTypes?.map(type => (
        <div key={type.id}>{type.name}</div>
      ))}
    </div>
  )
}
\`\`\`

### Создание записи в справочнике

\`\`\`typescript
// В API route
export async function POST(request: NextRequest) {
  const ctx = await createExecutionContext(request)
  
  // Проверка прав
  if (!['super_admin', 'regulator'].includes(ctx.user.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }
  
  const data = await request.json()
  const provider = new SupabaseDatabaseProvider(ctx)
  
  const evidenceType = await provider.evidenceTypes.create(ctx, {
    name: data.name,
    description: data.description,
    icon: data.icon,
    sort_order: data.sort_order
  })
  
  return NextResponse.json(evidenceType)
}
\`\`\`

## Тестирование

### Unit тесты

\`\`\`typescript
import { describe, it, expect } from 'vitest'
import { validateMeasureInStrictMode } from '@/lib/validation'

describe('validateMeasureInStrictMode', () => {
  it('should throw error if template not in allowed list', () => {
    const requirement = {
      measure_mode: 'strict',
      suggested_control_measure_template_ids: ['template-1', 'template-2']
    }
    
    expect(() => {
      validateMeasureInStrictMode(requirement, 'template-3')
    }).toThrow('Template not allowed in strict mode')
  })
})
\`\`\`

### Integration тесты

\`\`\`typescript
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/dictionaries/evidence-types/route'

describe('/api/dictionaries/evidence-types', () => {
  it('should return evidence types', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    })
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(200)
    expect(res._getJSONData()).toHaveLength(8)
  })
})
\`\`\`

## Лучшие практики

### 1. Всегда используйте ExecutionContext

\`\`\`typescript
// ❌ Неправильно
const data = await supabase.from('evidence_types').select('*')

// ✅ Правильно
const ctx = await createExecutionContext(request)
const data = await ctx.db.evidenceTypes.findMany(ctx)
\`\`\`

### 2. Проверяйте права доступа

\`\`\`typescript
// Проверка роли
if (!['super_admin', 'regulator'].includes(ctx.user.role)) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 })
}

// Проверка доступа к организации
if (!canAccessOrganization(ctx.user, organizationId)) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 })
}
\`\`\`

### 3. Используйте типы TypeScript

\`\`\`typescript
import type { EvidenceType, ControlMeasureTemplate } from '@/types/domain'

function processEvidenceType(type: EvidenceType) {
  // TypeScript проверит типы
}
\`\`\`

### 4. Обрабатывайте ошибки

\`\`\`typescript
try {
  const data = await ctx.db.evidenceTypes.create(ctx, input)
  return NextResponse.json(data)
} catch (error) {
  console.error('[API] Error creating evidence type:', error)
  return NextResponse.json(
    { error: 'Failed to create evidence type' },
    { status: 500 }
  )
}
\`\`\`

## Отладка

### Логирование

\`\`\`typescript
// Используйте префикс [v0] для отладочных логов
console.log('[v0] Creating evidence type:', data)
console.log('[v0] User context:', ctx.user)
console.log('[v0] Validation result:', isValid)
\`\`\`

### Проверка ExecutionContext

\`\`\`typescript
console.log('[v0] ExecutionContext:', {
  userId: ctx.userId,
  tenantId: ctx.tenantId,
  organizationId: ctx.organizationId,
  role: ctx.user.role
})
\`\`\`

## Полезные ссылки

- [README_FOR_LLM.md](../README_FOR_LLM.md) - Принципы разработки
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Архитектура системы
- [COMPLIANCE_MODES.md](./COMPLIANCE_MODES.md) - Режимы исполнения
- [API_REFERENCE.md](./API_REFERENCE.md) - Справочник API
