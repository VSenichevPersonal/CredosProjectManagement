# Анализ: Как загружаются доказательства к мерам

**Дата:** 2025-01-12  
**Компонент:** Карточка записи соответствия → Вкладка "Меры"

---

## 🔍 Текущий Flow загрузки

### 1. Компонент: `components/compliance/compliance-measures-tab.tsx`

**Метод:** `fetchMeasures()`  
**Строки:** 41-81

```typescript
const fetchMeasures = async () => {
  // 1. Загрузить меры с доказательствами
  const measuresRes = await fetch(
    `/api/compliance/${complianceId}/measures?includeEvidenceTypes=true&includeLinkedEvidence=true`
  )
  
  const measuresData = await measuresRes.json()
  setMeasures(measuresData.data || [])
  
  // 2. Загрузить рекомендуемые шаблоны (если есть)
  const templateIds = requirement?.suggestedControlMeasureTemplateIds || []
  if (templateIds.length > 0) {
    const templatesRes = await fetch(`/api/control-templates?ids=${templateIds.join(",")}`)
    const templatesData = await templatesRes.json()
    setSuggestedTemplates(templatesData.data || [])
  }
}
```

### 2. API Endpoint: `/api/compliance/[id]/measures`

**Файл:** `app/api/compliance/[id]/measures/route.ts`  
**Метод:** `GET`  
**Строки:** 4-71

**Что загружает:**

```typescript
// Базовый запрос
from("control_measures")
  .select(`
    *,
    template:control_measure_templates(id, code, title, description),
    responsibleUser:users!control_measures_responsible_user_id_fkey(id, name, email)
  `)
  .eq("compliance_record_id", params.id)
  
// Если includeEvidenceTypes=true
for each measure {
  fetch evidence_types 
    WHERE id IN measure.allowed_evidence_type_ids
  
  → measure.evidenceTypes = [...]
}

// Если includeLinkedEvidence=true
for each measure {
  fetch evidence_links
    .select(`
      id, evidence_id, relevance_score, link_reason,
      evidence:evidence_id (
        id, title, file_name, file_url, status, uploaded_at,
        evidence_types:evidence_type_id (id, title, code)
      )
    `)
    WHERE control_measure_id = measure.id
  
  → measure.linkedEvidence = [...]
  → measure.linkedEvidenceCount = count
}
```

**Результат:**
```typescript
{
  data: [
    {
      id: "measure-uuid",
      title: "Двухфакторная аутентификация",
      status: "planned",
      from_template: true,
      is_locked: true,
      template: { ... },
      responsibleUser: { ... },
      
      // Типы доказательств, которые нужны
      evidenceTypes: [
        { id: "...", title: "Приказ", code: "ORDER" },
        { id: "...", title: "Политика", code: "POLICY" }
      ],
      
      // Связанные доказательства (через evidence_links)
      linkedEvidence: [
        {
          id: "link-uuid",
          evidence_id: "evidence-uuid",
          relevance_score: 5,
          link_reason: "Подтверждает внедрение 2FA",
          evidence: {
            id: "evidence-uuid",
            title: "Приказ о внедрении 2FA",
            file_name: "prikaz_2fa.pdf",
            file_url: "https://...",
            status: "approved",
            uploaded_at: "2025-01-12",
            evidence_types: {
              id: "...",
              title: "Приказ",
              code: "ORDER"
            }
          }
        }
      ],
      linkedEvidenceCount: 1
    }
  ]
}
```

---

## 📊 Отображение в UI

### Таблица мер (строки 210-241)

```typescript
<TableRow>
  <TableCell>
    {measure.title}
    {measure.fromTemplate && <Badge>Из шаблона</Badge>}
  </TableCell>
  
  <TableCell>
    <Badge>{status.label}</Badge>
  </TableCell>
  
  <TableCell>
    {measure.responsibleUser?.fullName || "Не назначен"}
  </TableCell>
  
  <TableCell>
    {/* Требуемые типы доказательств */}
    {measure.evidenceTypes?.map(type => (
      <Badge>{type.title}</Badge>
    ))}
  </TableCell>
  
  <TableCell>
    {/* Загруженные доказательства */}
    <Badge variant={isComplete ? "default" : "outline"}>
      {linkedCount}/{requiredCount}
    </Badge>
    {isComplete && <CheckCircle2 />}
  </TableCell>
</TableRow>
```

**Расчёт:**
```typescript
const requiredCount = measure.allowedEvidenceTypeIds?.length || 0
const linkedCount = measure.linkedEvidence?.length || 0
const isComplete = requiredCount > 0 && linkedCount >= requiredCount
```

---

## 🔗 Таблица `evidence_links` (Junction Table)

### Схема

```sql
CREATE TABLE evidence_links (
  id UUID PRIMARY KEY,
  evidence_id UUID REFERENCES evidence(id) ON DELETE CASCADE,
  control_measure_id UUID REFERENCES control_measures(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
  
  -- Метаданные связи
  relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 5),
  link_reason TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Tenant isolation
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Constraint: связь должна быть или с мерой, или с требованием
  CONSTRAINT evidence_links_must_have_target CHECK (
    control_measure_id IS NOT NULL OR requirement_id IS NOT NULL
  )
);
```

### Связи

```
Control Measure (Мера)
      ↕ many-to-many (через evidence_links)
Evidence (Доказательство)
```

**Один документ может подтверждать несколько мер:**
```
Приказ о назначении ответственного.pdf
  ├─ Linked to: Мера #1 "Назначить ответственного за ИБ"
  ├─ Linked to: Мера #2 "Утвердить политику ИБ"
  └─ Linked to: Мера #3 "Определить полномочия"
```

---

## 🎯 Полный Flow (от загрузки до отображения)

### Шаг 1: Пользователь открывает карточку записи соответствия

```
URL: /compliance/[id]
Component: app/(dashboard)/compliance/[id]/page.tsx
  ↓
Server Component: ComplianceService.getById(ctx, id)
  ↓
Client Component: ComplianceDetailClient
```

### Шаг 2: Пользователь переключается на вкладку "Меры"

```
Component: ComplianceMeasuresTab
  ↓
useEffect → fetchMeasures()
  ↓
GET /api/compliance/[id]/measures?includeEvidenceTypes=true&includeLinkedEvidence=true
```

### Шаг 3: API загружает меры с доказательствами

```sql
-- 1. Загрузить меры
SELECT * FROM control_measures 
WHERE compliance_record_id = [id]

-- 2. Для каждой меры:
--    a) Загрузить allowed evidence types
SELECT * FROM evidence_types 
WHERE id IN (measure.allowed_evidence_type_ids)

--    b) Загрузить связанные доказательства
SELECT 
  el.*,
  e.*,
  et.*
FROM evidence_links el
JOIN evidence e ON e.id = el.evidence_id
LEFT JOIN evidence_types et ON et.id = e.evidence_type_id
WHERE el.control_measure_id = [measure.id]
```

### Шаг 4: UI отображает данные

```typescript
// Для каждой меры:
<TableRow>
  <TableCell>{measure.title}</TableCell>
  <TableCell><Badge>{measure.status}</Badge></TableCell>
  <TableCell>{measure.responsibleUser?.name}</TableCell>
  
  {/* Требуемые типы */}
  <TableCell>
    {measure.evidenceTypes.map(type => (
      <Badge>{type.title}</Badge>  // "Приказ", "Политика", etc
    ))}
  </TableCell>
  
  {/* Загружено доказательств */}
  <TableCell>
    <Badge>{measure.linkedEvidence.length}/{measure.evidenceTypes.length}</Badge>
    
    // Если все типы покрыты доказательствами:
    {isComplete && <CheckCircle2 className="text-green-600" />}
  </TableCell>
</TableRow>
```

---

## 📝 Детальный анализ данных

### Что приходит в `measure.linkedEvidence`

```typescript
[
  {
    id: "link-uuid-1",
    evidence_id: "evidence-uuid-1",
    relevance_score: 5,
    link_reason: "Подтверждает внедрение двухфакторной аутентификации",
    created_at: "2025-01-12T10:00:00Z",
    
    evidence: {
      id: "evidence-uuid-1",
      title: "Приказ о внедрении 2FA",
      file_name: "prikaz_2fa.pdf",
      file_url: "https://storage.supabase.co/.../prikaz_2fa.pdf",
      file_type: "application/pdf",
      status: "approved",
      uploaded_at: "2025-01-12T09:00:00Z",
      evidence_type_id: "type-uuid-1",
      
      evidence_types: {
        id: "type-uuid-1",
        title: "Приказ",
        code: "ORDER"
      }
    }
  }
]
```

### Что используется для отображения

```typescript
// В колонке "Загружено"
const linkedCount = measure.linkedEvidence?.length || 0  // Количество связей
const requiredCount = measure.allowedEvidenceTypeIds?.length || 0  // Требуется типов

// Индикатор завершенности
const isComplete = requiredCount > 0 && linkedCount >= requiredCount

// Badge
<Badge variant={isComplete ? "default" : linkedCount > 0 ? "secondary" : "outline"}>
  {linkedCount}/{requiredCount}
</Badge>

// Иконка галочки
{isComplete && <CheckCircle2 className="text-green-600" />}
```

---

## 🚀 Улучшения (опционально)

### Проблема 1: Показывается только count, не детали

**Сейчас:**
```
Загружено: 2/3 ✓
```

**Можно улучшить:**
```
Загружено: 2/3
📄 Приказ о внедрении 2FA
📄 Политика информационной безопасности

Не хватает:
❌ Инструкция по настройке
```

### Проблема 2: Нет быстрого доступа к загрузке доказательств

**Сейчас:**
- Нужно идти в отдельную вкладку "Доказательства"
- Или искать кнопку добавления

**Можно улучшить:**
```typescript
<TableCell className="text-right">
  <Button 
    variant="ghost" 
    size="sm" 
    onClick={() => openUploadDialog(measure.id)}
  >
    {linkedCount < requiredCount ? "Загрузить доказательство" : "Просмотр"}
  </Button>
</TableCell>
```

### Проблема 3: Не видно, какие типы доказательств уже загружены

**Сейчас:**
```
Требуемые: [Приказ] [Политика] [Инструкция]
Загружено: 2/3
```

Не понятно, какие именно 2 из 3 загружены.

**Можно улучшить:**
```typescript
{measure.evidenceTypes?.map(type => {
  const hasEvidence = measure.linkedEvidence?.some(
    link => link.evidence?.evidence_type_id === type.id
  )
  
  return (
    <Badge 
      key={type.id}
      variant={hasEvidence ? "default" : "outline"}
    >
      {hasEvidence && <CheckCircle2 className="h-3 w-3 mr-1" />}
      {type.title}
    </Badge>
  )
})}
```

---

## 📊 Текущая архитектура (Stage 14)

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UI Component (ComplianceMeasuresTab)                     │
│    - Вызывает fetchMeasures()                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. API Endpoint (/api/compliance/[id]/measures)            │
│    - Параметры: includeEvidenceTypes, includeLinkedEvidence│
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Database Query                                           │
│    a) control_measures WHERE compliance_record_id = [id]    │
│    b) control_measure_templates (JOIN)                      │
│    c) users (JOIN для responsible)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Enrichment Loop (для каждой меры)                        │
│    a) IF includeEvidenceTypes:                              │
│       - Fetch evidence_types                                │
│         WHERE id IN measure.allowed_evidence_type_ids       │
│                                                              │
│    b) IF includeLinkedEvidence:                             │
│       - Fetch evidence_links + evidence + evidence_types    │
│         WHERE control_measure_id = measure.id               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Response                                                  │
│    {                                                         │
│      data: [                                                 │
│        {                                                     │
│          ...measure,                                         │
│          evidenceTypes: [...],      // Требуемые типы       │
│          linkedEvidence: [...],     // Загруженные          │
│          linkedEvidenceCount: N     // Количество           │
│        }                                                     │
│      ]                                                       │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Отношения в базе данных

### Control Measure → Evidence (Many-to-Many)

```sql
control_measures
  ├─ id
  ├─ allowed_evidence_type_ids[]  -- Какие типы нужны
  └─ ...
        ↕
   evidence_links (junction table)
  ├─ control_measure_id
  ├─ evidence_id
  ├─ relevance_score (1-5)
  └─ link_reason
        ↕
evidence
  ├─ id
  ├─ evidence_type_id  -- Какого типа это доказательство
  ├─ file_url
  └─ ...
```

### Пример данных

**Control Measure:**
```json
{
  "id": "cm-001",
  "title": "Двухфакторная аутентификация",
  "allowed_evidence_type_ids": [
    "type-order",      // Приказ
    "type-policy",     // Политика
    "type-screenshot"  // Скриншот
  ]
}
```

**Evidence Links:**
```json
[
  {
    "control_measure_id": "cm-001",
    "evidence_id": "ev-001",
    "evidence": {
      "evidence_type_id": "type-order",
      "file_name": "prikaz.pdf"
    }
  },
  {
    "control_measure_id": "cm-001",
    "evidence_id": "ev-002",
    "evidence": {
      "evidence_type_id": "type-screenshot",
      "file_name": "screenshot.png"
    }
  }
]
```

**Результат в UI:**
```
Требуемые доказательства: [Приказ] [Политика] [Скриншот]
Загружено: 2/3 
  ✓ Приказ (prikaz.pdf)
  ✓ Скриншот (screenshot.png)
  ✗ Политика - НЕ ЗАГРУЖЕНА
```

---

## ⚠️ Текущие ограничения

### 1. N+1 Query Problem

**Проблема:** Для каждой меры делается 2 дополнительных запроса:
```typescript
for (const measure of measures) {
  // Query 1: Fetch evidence types
  await supabase.from("evidence_types").select("*").in("id", measure.allowed_evidence_type_ids)
  
  // Query 2: Fetch evidence links
  await supabase.from("evidence_links").select("*, evidence(*)").eq("control_measure_id", measure.id)
}
```

**Решение:** Можно оптимизировать через batch запросы:
```typescript
// Собрать все IDs
const allEvidenceTypeIds = measures.flatMap(m => m.allowed_evidence_type_ids || [])
const allMeasureIds = measures.map(m => m.id)

// Один запрос для всех типов
const { data: allEvidenceTypes } = await supabase
  .from("evidence_types")
  .select("*")
  .in("id", allEvidenceTypeIds)

// Один запрос для всех связей
const { data: allLinks } = await supabase
  .from("evidence_links")
  .select("*, evidence(*)")
  .in("control_measure_id", allMeasureIds)

// Потом распределить по мерам
```

### 2. Показывается только count, не список доказательств

**Текущее отображение:**
```
Загружено: 2/3 ✓
```

**Проблема:** Не видно:
- Какие доказательства загружены
- Какие типы еще нужны
- Можно ли скачать/просмотреть доказательство

**Возможное улучшение:**
- Expandable row для просмотра деталей
- Tooltip при наведении на badge
- Кнопка "Просмотр доказательств" для каждой меры

### 3. Нет прямого способа загрузить доказательство для меры

**Сейчас:** Нужно идти в вкладку "Доказательства" → загрузить → выбрать меру

**Улучшение:** Добавить кнопку "Загрузить" прямо в строке меры:
```typescript
<TableCell>
  <Button size="sm" onClick={() => openUploadForMeasure(measure.id)}>
    Загрузить доказательство
  </Button>
</TableCell>
```

---

## 📋 Резюме

### ✅ Что работает хорошо

1. **Загрузка данных:**
   - ✅ API endpoint правильно загружает меры
   - ✅ Загружаются evidence_types (требуемые типы)
   - ✅ Загружаются evidence_links с полными данными доказательств
   - ✅ Данные обогащаются через JOIN в одном запросе

2. **Отображение:**
   - ✅ Показывается статус меры
   - ✅ Показываются требуемые типы доказательств
   - ✅ Показывается прогресс (X/Y)
   - ✅ Показывается галочка при завершении

3. **Архитектура:**
   - ✅ Many-to-many через evidence_links
   - ✅ Переиспользование доказательств
   - ✅ Метаданные связи (relevance_score, link_reason)

### ⚠️ Что можно улучшить

1. **Performance:**
   - ⚠️ N+1 запросы для evidence_types и evidence_links
   - 💡 Решение: Batch loading

2. **UX:**
   - ⚠️ Не видно списка загруженных доказательств
   - ⚠️ Нет быстрого способа загрузить доказательство для меры
   - ⚠️ Не видно, какие конкретно типы еще нужны
   - 💡 Решение: Expandable rows или отдельная колонка с деталями

3. **Визуализация:**
   - ⚠️ Только count в badge
   - 💡 Решение: Цветные индикаторы для каждого типа доказательства

---

## 🎨 Предлагаемые улучшения UI

### Вариант 1: Expandable Row

```typescript
<TableRow onClick={() => toggleExpanded(measure.id)}>
  {/* ... обычные колонки */}
</TableRow>

{expanded[measure.id] && (
  <TableRow>
    <TableCell colSpan={6}>
      <div className="p-4 bg-muted/50">
        <h4>Загруженные доказательства:</h4>
        {measure.linkedEvidence.map(link => (
          <div key={link.id}>
            📄 {link.evidence.file_name}
            <Badge>{link.evidence.evidence_types.title}</Badge>
            <Button size="sm">Скачать</Button>
          </div>
        ))}
        
        <Button onClick={() => openUploadDialog(measure.id)}>
          + Загрузить ещё
        </Button>
      </div>
    </TableCell>
  </TableRow>
)}
```

### Вариант 2: Tooltip на Badge

```typescript
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      <Badge>{linkedCount}/{requiredCount}</Badge>
    </TooltipTrigger>
    <TooltipContent>
      <div className="space-y-2">
        <div className="font-medium">Загружено:</div>
        {measure.linkedEvidence.map(link => (
          <div key={link.id}>✓ {link.evidence.file_name}</div>
        ))}
        
        {linkedCount < requiredCount && (
          <>
            <div className="font-medium mt-2">Еще нужно:</div>
            {/* Показать недостающие типы */}
          </>
        )}
      </div>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

**Хотите, чтобы я реализовал одно из улучшений?** 😊
