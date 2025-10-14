# 🏗️ MASTER PLAN: Система документов + доказательства

**Дата:** 13 октября 2025  
**Авторы:** Software Architect + Product Owner + UX Designer  
**На основе:** Анализ Drata, Vanta + Российское законодательство  
**Статус:** ✅ Готово к реализации

---

## 🎯 VISION

> **Создать интеллектуальную систему управления документами для российского ИБ-комплаенса,** которая:
> - Автоматически рекомендует нужные документы
> - Упрощает создание из шаблонов
> - Версионирует и отслеживает актуальность
> - Связывает документы с мерами и доказательствами
> - Использует AI для анализа изменений

---

## 📊 ЦЕЛЕВАЯ АРХИТЕКТУРА (Visual)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         🏛️ ДОКУМЕНТООБОРОТ + КОМПЛАЕНС                      │
└─────────────────────────────────────────────────────────────────────────────┘

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ УРОВЕНЬ 1: ШАБЛОНЫ И ТИПИЗАЦИЯ (Глобальные справочники)                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

    ┌──────────────────────────┐         ┌──────────────────────────┐
    │ document_types           │         │ knowledge_base_templates │
    ├──────────────────────────┤         ├──────────────────────────┤
    │ • policy-ib              │         │ • Политика ИБ.docx       │
    │ • policy-pdn             │         │ • Политика ПДн.docx      │
    │ • kii-act                │◄────────┤ • Акт категорирования    │
    │ • order-appoint          │         │ • Приказ о назначении    │
    │ • threat-model           │         │ • Модель угроз.docx      │
    │                          │         │                          │
    │ Определяет:              │         │ Содержит:                │
    │ - Реквизиты              │         │ - .docx/.xlsx файлы      │
    │ - Сроки хранения         │         │ - Структура документа    │
    │ - Workflow утверждения   │         │ - Placeholders           │
    └──────────────────────────┘         └──────────────────────────┘
              │                                      │
              │         ┌────────────────────────────┘
              │         │
              ▼         ▼
    ┌─────────────────────────────────────┐
    │ requirement_document_templates       │
    ├─────────────────────────────────────┤
    │ requirement → template → doc_type    │
    │                                     │
    │ "КИИ-002" → "Акт категорирования"   │
    │ "ПДн-001" → "Политика ПДн"          │
    │                                     │
    │ Автоматические рекомендации! 🤖      │
    └─────────────────────────────────────┘

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ УРОВЕНЬ 2: ДОКУМЕНТООБОРОТ (Библиотека документов)                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

    ┌────────────────────────────────────────────────────────┐
    │ documents                                               │
    ├────────────────────────────────────────────────────────┤
    │ id: doc-123                                            │
    │ title: "Политика ИБ АО Щёкиноазот"                     │
    │ document_type_id: policy-ib                            │
    │ template_id: kb-template-policy                        │
    │                                                        │
    │ Реквизиты (РФ):                                        │
    │ • document_number: "№15-ИБ"                            │
    │ • document_date: 2025-10-13                            │
    │ • approved_by: CISO                                    │
    │ • approved_at: 2025-10-20                              │
    │                                                        │
    │ Жизненный цикл:                                        │
    │ • lifecycle: draft → active → archived                 │
    │ • effective_from: 2025-11-01                           │
    │ • effective_until: 2028-11-01 (3 года)                 │
    │ • next_review_date: 2026-10-01 (ежегодно)              │
    │                                                        │
    │ Хранение (ГОСТ):                                       │
    │ • retention_period_years: NULL (постоянно)             │
    │ • nomenclature_item_id: "02-02" (Политики ИБ)          │
    └────────────────────────────────────────────────────────┘
              │
              ├──────────────────────┬──────────────────┐
              ▼                      ▼                  ▼
    ┌──────────────────┐   ┌──────────────┐   ┌────────────────┐
    │document_versions │   │document_     │   │document_       │
    │                  │   │analyses (AI) │   │approvals       │
    ├──────────────────┤   ├──────────────┤   ├────────────────┤
    │ v1.0 (current)   │   │ AI Summary   │   │ Workflow:      │
    │ v0.9             │   │ Critical     │   │ CISO ✅        │
    │ v0.8             │   │ Changes      │   │ CEO ⏳         │
    └──────────────────┘   └──────────────┘   └────────────────┘

    🎯 НЕЗАВИСИМАЯ СИСТЕМА
    Работает без привязки к комплаенсу!

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ УРОВЕНЬ 3: ДОКАЗАТЕЛЬСТВА (Комплаенс)                                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

    ┌────────────────────────────────────────────────────────┐
    │ evidence                                                │
    ├────────────────────────────────────────────────────────┤
    │ ВАРИАНТ A: Файл (простое доказательство)              │
    │ ┌────────────────────────────────────────────────────┐ │
    │ │ id: ev-111                                         │ │
    │ │ file_url: /storage/firewall.png                   │ │
    │ │ file_name: "firewall_config.png"                  │ │
    │ │ document_id: NULL                                  │ │
    │ │ compliance_record_id: comp-123                     │ │
    │ │ evidence_type_id: screenshot                       │ │
    │ └────────────────────────────────────────────────────┘ │
    │                                                        │
    │ ВАРИАНТ B: Документ (переиспользование)               │
    │ ┌────────────────────────────────────────────────────┐ │
    │ │ id: ev-222                                         │ │
    │ │ file_url: NULL                                     │ │
    │ │ document_id: doc-123  ⭐ ССЫЛКА                    │ │
    │ │ compliance_record_id: comp-123                     │ │
    │ │ evidence_type_id: policy                           │ │
    │ └────────────────────────────────────────────────────┘ │
    │                                                        │
    │ CONSTRAINT: file XOR document ✅                       │
    └────────────────────────────────────────────────────────┘
              │
              ▼
    ┌────────────────────────────────────────────────────────┐
    │ evidence_links (many-to-many)                          │
    ├────────────────────────────────────────────────────────┤
    │ evidence_id → control_measure_id                       │
    │                                                        │
    │ Один evidence → много мер                              │
    │ Одна мера → много evidence                             │
    └────────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────────────────┐
    │ control_measures                                        │
    ├────────────────────────────────────────────────────────┤
    │ "Разработать политику ИБ"                              │
    │ status: implemented ✅                                  │
    │                                                        │
    │ Доказательства (через evidence_links):                 │
    │ • evidence[ev-222] → document[doc-123] "Политика ИБ"   │
    └────────────────────────────────────────────────────────┘
```

---

## 📋 ПОЭТАПНЫЙ ПЛАН РЕАЛИЗАЦИИ

### 🔴 ЭТАП 1: Фундамент (Stage 16, 3-4 дня)

#### **Задача 1.1: Создать типы документов** (1 день)

**Миграция 620:**
```sql
CREATE TABLE document_types (
  code, name, category,
  regulator, requirement_category,
  requires_approval, requires_number,
  default_retention_years,
  default_validity_months,
  icon, color
);

-- Seed базовые типы
INSERT INTO document_types VALUES
  ('policy-ib', 'Политика ИБ', 'organizational', ...),
  ('policy-pdn', 'Политика ПДн', 'organizational', 'Роскомнадзор', 'ПДн', ...),
  ('order', 'Приказ', 'organizational', ...),
  ('kii-act', 'Акт категорирования КИИ', 'regulatory', 'ФСТЭК', 'КИИ', ...),
  ('threat-model', 'Модель угроз', 'technical', 'ФСТЭК', 'ПДн', ...),
  ('incident-report', 'Отчет об инциденте', 'regulatory', 'ФСТЭК', 'КИИ', ...),
  ('instruction', 'Инструкция', 'technical', ...),
  ('regulation', 'Регламент', 'organizational', ...),
  ('journal', 'Журнал', 'technical', ...),
  ('certificate', 'Сертификат', 'regulatory', ...);
```

**TypeScript:**
```typescript
// types/domain/document-type.ts
export interface DocumentType {
  id: string
  code: string
  name: string
  category: 'organizational' | 'technical' | 'regulatory'
  regulator?: string
  requirementCategory?: string
  requiresApproval: boolean
  requiresNumber: boolean
  defaultRetentionYears?: number
  defaultValidityMonths?: number
  icon?: string
  color?: string
}
```

**UI:**
```tsx
// components/dictionaries/document-types-list.tsx
// Справочник типов документов (для админов)
```

**Время:** 1 день  
**Ценность:** 🔥🔥🔥

---

#### **Задача 1.2: Создать таблицу documents** (2 дня)

**Миграция 621:**
```sql
CREATE TABLE documents (
  id, tenant_id, organization_id,
  document_type_id, template_id,
  title, description,
  document_number, document_date,
  current_version_id,
  lifecycle_status,
  approved_by, approved_at,
  effective_from, effective_until,
  next_review_date,
  retention_period_years, destruction_date,
  confidentiality_level,
  owner_id, created_by
);

-- Индексы
-- Триггеры для lifecycle
-- RLS policies
```

**Миграция данных:**
```sql
-- Перенести is_document=true из evidence
INSERT INTO documents (...)
SELECT ... FROM evidence WHERE is_document = true;

-- Создать evidence для существующих документов-доказательств
INSERT INTO evidence (document_id, ...)
SELECT ...;

-- Удалить поля из evidence
ALTER TABLE evidence DROP COLUMN is_document, current_version_id, ...;
```

**TypeScript:**
```typescript
// types/domain/document.ts - обновить
export interface Document {
  id: string
  documentTypeId: string
  templateId?: string
  title: string
  documentNumber?: string
  documentDate?: Date
  lifecycleStatus: DocumentLifecycle
  // ...
}
```

**Время:** 2 дня  
**Ценность:** 🔥🔥🔥

---

#### **Задача 1.3: Обновить evidence** (0.5 дня)

```sql
ALTER TABLE evidence ADD COLUMN
  document_id UUID REFERENCES documents(id);

-- Constraint: file XOR document
ALTER TABLE evidence ADD CONSTRAINT evidence_content_check CHECK (
  (file_url IS NOT NULL AND document_id IS NULL) OR
  (file_url IS NULL AND document_id IS NOT NULL)
);
```

**TypeScript:**
```typescript
// types/domain/evidence.ts - обновить
export interface Evidence {
  id: string
  // Либо файл:
  fileUrl?: string
  fileName?: string
  // Либо документ:
  documentId?: string
  document?: Document  // Populated
}
```

**Время:** 0.5 дня  
**Ценность:** 🔥🔥

---

### 🟡 ЭТАП 2: Связи и рекомендации (Stage 16-17, 2 дня)

#### **Задача 2.1: Связать шаблоны с требованиями** (1 день)

**Миграция 622:**
```sql
CREATE TABLE requirement_document_templates (
  requirement_id,
  template_id,
  document_type_id,
  is_recommended,
  priority,
  usage_instructions,
  auto_create_measures,
  suggested_control_template_ids
);

-- Seed связей
INSERT INTO requirement_document_templates VALUES
  ('КИИ-002', 'template-kii-act', 'kii-act', true, 100, ...),
  ('ПДн-001', 'template-policy-pdn', 'policy-pdn', true, 100, ...),
  ...;
```

**Service:**
```typescript
// services/document-recommendation-service.ts
class DocumentRecommendationService {
  async getRecommendedTemplates(requirementId: string) {
    // Получить рекомендации
    const recommendations = await db.requirement_document_templates
      .findByRequirement(requirementId)
    
    return recommendations.map(r => ({
      template: r.template,
      documentType: r.documentType,
      priority: r.priority,
      instructions: r.usage_instructions
    }))
  }
}
```

**UI:**
```tsx
// При создании меры/доказательства показываем:
<RecommendedDocumentsPanel>
  <Alert>
    💡 Для этого требования рекомендуются документы:
  </Alert>
  {recommendations.map(r => (
    <RecommendationCard
      template={r.template}
      onUse={() => createFromTemplate(r)}
    />
  ))}
</RecommendedDocumentsPanel>
```

**Время:** 1 день  
**Ценность:** 🔥🔥🔥

---

#### **Задача 2.2: API для создания документов** (1 день)

```typescript
// app/api/documents/route.ts
POST /api/documents
{
  title, document_type_id, template_id,
  document_number, document_date,
  file, organization_id
}

// app/api/documents/create-with-evidence/route.ts
POST /api/documents/create-with-evidence
{
  document: { title, type, ... },
  evidence: { compliance_record_id, ... },
  auto_link_to_measures: boolean
}

// app/api/documents/[id]/use-as-evidence/route.ts
POST /api/documents/[id]/use-as-evidence
{
  compliance_record_id,
  control_measure_ids,
  evidence_type_id
}
```

**Время:** 1 день  
**Ценность:** 🔥🔥

---

### 🟢 ЭТАП 3: UI компоненты (Stage 17, 3-4 дня)

#### **Задача 3.1: Селектор источника доказательства** (1 день)

```tsx
// components/evidence/evidence-source-selector.tsx

<Tabs>
  <TabsList>
    <TabsTrigger value="file">📎 Файл</TabsTrigger>
    <TabsTrigger value="document">📄 Документ</TabsTrigger>
    <TabsTrigger value="create">✨ Создать</TabsTrigger>
  </TabsList>
  
  <TabsContent value="file">
    <FileUploader />
  </TabsContent>
  
  <TabsContent value="document">
    <DocumentSelector
      filters={{ lifecycle: 'active', organization_id }}
      onSelect={doc => createEvidence({ document_id: doc.id })}
    />
  </TabsContent>
  
  <TabsContent value="create">
    <CreateDocumentWizard
      recommendedTemplates={templates}
      onCreated={doc => createEvidence({ document_id: doc.id })}
    />
  </TabsContent>
</Tabs>
```

**Время:** 1 день  
**Ценность:** 🔥🔥🔥

---

#### **Задача 3.2: Библиотека документов** (2 дня)

```tsx
// app/(dashboard)/documents/page.tsx

<DocumentsLibrary>
  {/* Фильтры */}
  <Filters>
    <Select name="document_type" />
    <Select name="lifecycle_status" />
    <Select name="confidentiality" />
    <DateRangePicker name="effective_period" />
  </Filters>
  
  {/* Карточки документов */}
  <DocumentsGrid>
    {documents.map(doc => (
      <DocumentCard
        document={doc}
        showUsageStats={true}
        actions={[
          "view", "edit", "new-version",
          "use-as-evidence",  // ⭐ Ключевое действие
          "download", "archive"
        ]}
      />
    ))}
  </DocumentsGrid>
</DocumentsLibrary>
```

**Время:** 2 дня  
**Ценность:** 🔥🔥

---

#### **Задача 3.3: Детальная страница документа** (1 день)

```tsx
// app/(dashboard)/documents/[id]/page.tsx

<DocumentDetailView>
  {/* Шапка с реквизитами */}
  <DocumentHeader />
  
  {/* Предупреждения */}
  {document.lifecycle === 'draft' && (
    <Alert>⚠️ Требуется утверждение</Alert>
  )}
  
  {needsReview(document) && (
    <Alert>📅 Требуется пересмотр</Alert>
  )}
  
  {/* Вкладки */}
  <Tabs>
    <TabsContent value="details">
      <DocumentDetails />
      
      {/* Где используется */}
      <UsageSection evidenceUsages={usages} />
    </TabsContent>
    
    <TabsContent value="versions">
      <VersionsTimeline versions={versions} />
    </TabsContent>
    
    <TabsContent value="analysis">
      <AIAnalysisView analyses={analyses} />
    </TabsContent>
    
    <TabsContent value="approvals">
      <ApprovalsTimeline approvals={approvals} />
    </TabsContent>
  </Tabs>
</DocumentDetailView>
```

**Время:** 1 день  
**Ценность:** 🔥🔥

---

### 🔵 ЭТАП 4: Workflow и автоматизация (Stage 17, 3-4 дня)

#### **Задача 4.1: Workflow утверждения** (2 дня)

**Миграция 623:**
```sql
CREATE TABLE document_approvals (
  document_id, version_id,
  workflow_type,  -- serial, parallel
  required_approvers,
  status,
  due_date
);

CREATE TABLE document_approval_steps (
  approval_id, step_number,
  approver_id, approver_role,
  status, comments,
  approved_at
);
```

**Service:**
```typescript
// services/document-approval-service.ts
class DocumentApprovalService {
  async startApproval(documentId, approvers) {
    // Создать approval
    // Создать steps
    // Отправить уведомления
  }
  
  async approve(stepId, approverId, comments) {
    // Обновить step
    // Если последний → утвердить документ
    // Уведомления
  }
}
```

**UI:**
```tsx
// components/documents/approval-workflow-dialog.tsx
<ApprovalWorkflowDialog>
  <StepList>
    <Step number={1} approver="CISO" status="pending" />
    <Step number={2} approver="CEO" status="pending" />
  </StepList>
  
  <Actions>
    <Button onClick={approve}>Утвердить</Button>
    <Button onClick={reject}>Отклонить</Button>
  </Actions>
</ApprovalWorkflowDialog>
```

**Время:** 2 дня  
**Ценность:** 🔥🔥🔥

---

#### **Задача 4.2: Автосоздание документов** (1 день)

**Service:**
```typescript
// services/compliance-automation-service.ts
class ComplianceAutomationService {
  async autoCreateDocuments(complianceRecordId: string) {
    const record = await db.compliance_records.findById(complianceRecordId)
    const requirement = await db.requirements.findById(record.requirement_id)
    
    // Получить рекомендуемые шаблоны
    const templates = await db.requirement_document_templates
      .findByRequirement(requirement.id)
    
    const created = []
    
    for (const template of templates) {
      // 1. Создать черновик документа
      const document = await db.documents.create({
        title: generateTitle(template, record.organization),
        document_type_id: template.document_type_id,
        template_id: template.template_id,
        lifecycle_status: 'draft',
        organization_id: record.organization_id
      })
      
      // 2. Создать evidence
      const evidence = await db.evidence.create({
        document_id: document.id,
        compliance_record_id: complianceRecordId,
        evidence_type_id: template.default_evidence_type_id
      })
      
      // 3. Связать с мерами (если указаны)
      if (template.suggested_control_template_ids) {
        for (const ctrlTemplateId of template.suggested_control_template_ids) {
          const measure = await findMeasureByTemplate(ctrlTemplateId)
          if (measure) {
            await db.evidence_links.create({
              evidence_id: evidence.id,
              control_measure_id: measure.id
            })
          }
        }
      }
      
      created.push({ document, evidence })
    }
    
    return created
  }
}
```

**API:**
```typescript
// app/api/compliance-records/[id]/auto-create-documents/route.ts
POST /api/compliance-records/[id]/auto-create-documents
```

**UI:**
```tsx
// На странице compliance_record
<AutoCreatePanel>
  <Button onClick={autoCreateDocuments}>
    ✨ Создать рекомендуемые документы
  </Button>
</AutoCreatePanel>
```

**Время:** 1 день  
**Ценность:** 🔥🔥🔥

---

#### **Задача 4.3: Умные уведомления** (1 день)

```typescript
// services/document-notification-service.ts
class DocumentNotificationService {
  async checkAndNotify() {
    // 1. Документы требующие пересмотра
    const needReview = await db.documents.findWhere({
      next_review_date: { lte: addDays(now, 14) },
      lifecycle_status: 'active'
    })
    
    for (const doc of needReview) {
      await createNotification({
        userId: doc.owner_id,
        type: 'document_review_needed',
        message: `Документ "${doc.title}" требует пересмотра`
      })
    }
    
    // 2. Документы истекающие
    const expiring = await db.documents.findWhere({
      effective_until: { lte: addDays(now, 30) },
      lifecycle_status: 'active'
    })
    
    // 3. Черновики без утверждения > 7 дней
    const staleДrafts = await db.documents.findWhere({
      lifecycle_status: 'draft',
      created_at: { lte: subDays(now, 7) }
    })
    
    // 4. Документы требующие уничтожения
    const toDestroy = await db.documents.findWhere({
      destruction_date: { lte: now },
      lifecycle_status: { in: ['active', 'archived'] }
    })
  }
}

// Cron job
every('1 day at 09:00', () => {
  documentNotificationService.checkAndNotify()
})
```

**Время:** 1 день  
**Ценность:** 🔥🔥

---

### 🟣 ЭТАП 5: UI/UX полировка (Stage 17, 2-3 дня)

#### **Задача 5.1: Карточка доказательства с документом** (1 день)

```tsx
// components/evidence/enhanced-evidence-card.tsx
<EvidenceCard evidence={evidence}>
  {evidence.document_id ? (
    <DocumentEvidenceView
      document={evidence.document}
      onOpenDocument={() => router.push(`/documents/${doc.id}`)}
      onUnlink={() => unlinkDocument()}
      showVersionInfo={true}
      showUsageStats={true}
    />
  ) : (
    <FileEvidenceView
      file={evidence}
      onDownload={() => download()}
      onDelete={() => delete()}
    />
  )}
</EvidenceCard>
```

**Время:** 1 день  
**Ценность:** 🔥🔥

---

#### **Задача 5.2: Дашборд документов** (2 дня)

```tsx
// app/(dashboard)/documents/page.tsx
<DocumentsDashboard>
  {/* Метрики */}
  <MetricsRow>
    <MetricCard title="Всего документов" value={total} />
    <MetricCard title="Требуют пересмотра" value={needReview} variant="warning" />
    <MetricCard title="Черновики" value={drafts} />
    <MetricCard title="Используются в комплаенсе" value={usedAsEvidence} />
  </MetricsRow>
  
  {/* Группировка по типам */}
  <DocumentsByTypeChart data={byType} />
  
  {/* Календарь пересмотров */}
  <ReviewCalendar documents={upcomingReviews} />
  
  {/* Таблица/Карточки */}
  <DocumentsTable
    columns={['title', 'type', 'number', 'lifecycle', 'next_review', 'actions']}
    data={documents}
  />
</DocumentsDashboard>
```

**Время:** 2 дня  
**Ценность:** 🔥

---

### 🟤 ЭТАП 6: Расширенные фичи (Stage 18, по необходимости)

#### **Задача 6.1: Номенклатура дел** (2 дня)
#### **Задача 6.2: Регистрация документов** (2 дня)
#### **Задача 6.3: Грифы конфиденциальности** (1 день)
#### **Задача 6.4: Расширенный AI** (3 дня)

---

## 🗺️ ГАНTT ДИАГРАММА (ASCII)

```
Stage 16 (Фундамент)                    
├─ Week 1 ──────────────────────────────────┐
│  Day 1-1: document_types        ████      │
│  Day 1-2: documents table       ████████  │
│  Day 1-3: Миграция данных         ████    │
│  Day 1-4: evidence обновление       ██    │
│                                           │
├─ Week 2 ──────────────────────────────────┤
│  Day 2-1: Связи (622)           ████      │
│  Day 2-2: API endpoints           ████    │
│  Day 2-3: Базовый UI                ████  │
└───────────────────────────────────────────┘

Stage 17 (Workflow)
├─ Week 3 ──────────────────────────────────┐
│  Day 3-1: Approvals (623)       ████      │
│  Day 3-2: Approval Service        ████    │
│  Day 3-3: Auto-create logic         ████  │
│  Day 3-4: Notifications               ████│
│                                           │
├─ Week 4 ──────────────────────────────────┤
│  Day 4-1: EvidenceSelector      ████      │
│  Day 4-2: DocumentsLibrary        ████████│
│  Day 4-3: DetailViews               ████  │
└───────────────────────────────────────────┘

Stage 18 (Российская специфика)
├─ По запросу клиентов                     │
└───────────────────────────────────────────┘
```

---

## 📊 ОЦЕНКА ТРУДОЗАТРАТ

| Этап | Задачи | Время | Разработчиков | Итого |
|------|--------|-------|---------------|-------|
| Stage 16 | 1.1-1.3 | 3.5 дня | 1 | 3.5 д |
| Stage 16 | 2.1-2.2 | 2 дня | 1 | 2 д |
| Stage 17 | 3.1-3.3 | 4 дня | 1 | 4 д |
| Stage 17 | 4.1-4.3 | 4 дня | 1 | 4 д |
| **ИТОГО (MVP)** | | **13.5 дней** | **1** | **~3 недели** |

---

## 🎯 ПРИОРИТЕТЫ

### 🔴 MUST HAVE (Stage 16):
- ✅ document_types
- ✅ documents table
- ✅ Миграция данных
- ✅ evidence.document_id
- ✅ Базовый UI

### 🟡 SHOULD HAVE (Stage 17):
- ⏳ requirement_document_templates
- ⏳ Approval workflow
- ⏳ Auto-create documents
- ⏳ Smart notifications

### 🟢 NICE TO HAVE (Stage 18):
- 💡 Номенклатура дел
- 💡 Регистрация
- 💡 Грифы ДСП
- 💡 Advanced AI

---

## ✨ КЛЮЧЕВЫЕ ФИЧИ (после реализации)

### 1. **Умные рекомендации** 🤖

```
Создаете меру "Политика ИБ"
→ Система: "Рекомендую создать документ из шаблона"
→ Клик → Автоматически:
  ✅ Создан черновик
  ✅ Заполнены реквизиты
  ✅ Связан с мерой
  ✅ Готов к заполнению
```

### 2. **Переиспользование документов** ♻️

```
Политика ИБ (doc-123)
├─ Используется в КИИ-002
├─ Используется в ПДн-001
└─ Используется в ГИС-003

При обновлении → все видят изменения!
```

### 3. **AI-анализ изменений** 🧠

```
v1.0 → v1.1
AI выявляет:
  ⚠️ Критическое: Изменены требования к паролям
  ℹ️ Инфо: Добавлен раздел об обучении
  💡 Рекомендация: Обновите меру "Парольная политика"
```

### 4. **Автоматические сроки** ⏰

```
Создаете документ типа "Политика ПДн"
→ Автоматически:
  ✅ retention_period_years: 75 лет (из document_type)
  ✅ review_period: 12 месяцев (ежегодно)
  ✅ requires_approval: true
  ✅ requires_registration: true
```

### 5. **Независимая библиотека** 📚

```
/documents
├─ Все документы организации
├─ Фильтры, поиск, сортировка
├─ Статусы, версии, утверждения
└─ Может работать БЕЗ комплаенса

НО если нужно:
→ "Использовать как доказательство"
→ Выбираешь меру
→ Создается evidence.document_id
```

---

## 🎨 ВИЗУАЛЬНАЯ КОНЦЕПЦИЯ UI

```
┌─────────────────────────────────────────────────────────────┐
│ 📄 БИБЛИОТЕКА ДОКУМЕНТОВ                           [Создать] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Фильтры: [Все типы ▼] [Активные ▼] [Моя орг ▼] 🔍          │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📋 Политика ИБ АО Щёкиноазот                 [Active] │ │
│ │ №15-ИБ от 13.10.2025 • v1.0 • Действует до 13.10.2028   │ │
│ │                                                          │ │
│ │ Пересмотр: 📅 01.10.2026                                 │ │
│ │ Используется: 🔗 3 меры                                  │ │
│ │                                                          │ │
│ │ [Открыть] [Новая версия] [Использовать как доказ-во]    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠️ Акт категорирования КИИ                    [Draft] │ │
│ │ Без номера • v1.0                                        │ │
│ │                                                          │ │
│ │ ⚠️ Требуется: добавить номер и отправить на утверждение │ │
│ │                                                          │ │
│ │ [Редактировать] [Отправить на утверждение]               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🎯 ДОБАВЛЕНИЕ ДОКАЗАТЕЛЬСТВА К МЕРЕ                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Мера: "Разработать политику ИБ"                             │
│                                                              │
│ ┌──────────────┬──────────────┬──────────────┐              │
│ │  📎 Файл     │ 📄 Документ  │ ✨ Создать   │              │
│ └──────────────┴──────────────┴──────────────┘              │
│                                                              │
│ 💡 Рекомендация: Для этой меры рекомендуется:               │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📋 Политика ИБ (из шаблона)                             │ │
│ │ Тип: Политика • Срок внедрения: ~30 дней                │ │
│ │                                                          │ │
│ │ [Создать из шаблона] [Использовать существующую]         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Или выберите файл: [Выбрать файл]                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📄 ДЕТАЛИ ДОКУМЕНТА: Политика ИБ                   [Active] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ №15-ИБ от 13.10.2025 • Версия v1.0                          │
│                                                              │
│ ┌────────────┬────────────┬────────────┬────────────┐       │
│ │  Детали    │  Версии(3) │ AI Анализ  │ Утверждения│       │
│ └────────────┴────────────┴────────────┴────────────┘       │
│                                                              │
│ Реквизиты:                                                   │
│ • Тип: Политика ИБ                                          │
│ • Утвержден: CISO, 20.10.2025                               │
│ • Действует: 01.11.2025 - 01.11.2028                        │
│ • Следующий пересмотр: 📅 01.10.2026                        │
│                                                              │
│ Используется как доказательство:                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ КИИ-003 → Мера "Политика безопасности КИИ"        [↗]  │ │
│ │ ПДн-001 → Мера "Политика обработки ПДн"           [↗]  │ │
│ │ ГИС-002 → Мера "Политика ГИС"                     [↗]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Скачать] [Новая версия] [Добавить к другой мере]           │
└─────────────────────────────────────────────────────────────┘
```

**Время:** 1 день  
**Ценность:** 🔥🔥

---

#### **Задача 5.3: Wizard создания из шаблона** (1 день)

```tsx
<CreateDocumentWizard>
  {/* Шаг 1: Выбор типа и шаблона */}
  <Step1>
    <DocumentTypeSelector />
    <TemplateSelector recommendedTemplates={templates} />
  </Step1>
  
  {/* Шаг 2: Заполнение реквизитов */}
  <Step2>
    <AutoFilledForm
      documentType={selectedType}
      template={selectedTemplate}
      organization={currentOrg}
    />
  </Step2>
  
  {/* Шаг 3: Загрузка файла */}
  <Step3>
    <TemplateDownloadButton />
    <FileUploader />
  </Step3>
  
  {/* Шаг 4: Настройка использования */}
  <Step4>
    <Checkbox>
      ☑️ Использовать как доказательство
    </Checkbox>
    
    {useAsEvidence && (
      <Select label="Для записи комплаенса">
        {complianceRecords.map(...)}
      </Select>
    )}
    
    {useAsEvidence && (
      <MultiSelect label="Связать с мерами">
        {controlMeasures.map(...)}
      </MultiSelect>
    )}
  </Step4>
  
  {/* Шаг 5: Подтверждение */}
  <Step5>
    <Summary>
      ✅ Создается: Документ "Политика ИБ"
      ✅ Версия: v1.0
      ✅ Доказательство: Да
      ✅ Связано с: 2 меры
      
      [Создать] [Назад]
    </Summary>
  </Step5>
</CreateDocumentWizard>
```

**Время:** 1 день  
**Ценность:** 🔥🔥🔥

---

## 🔗 СВЯЗЬ ДАННЫХ (Детальная схема)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ПОЛНАЯ СХЕМА СВЯЗЕЙ                          │
└─────────────────────────────────────────────────────────────────┘

requirements (Требования)
    ↓
    requirement_document_templates (Рекомендации)
    ├─ requirement_id
    ├─ template_id → knowledge_base_templates
    ├─ document_type_id → document_types
    ├─ suggested_control_template_ids
    └─ auto_create_measures: boolean

compliance_records (Записи соответствия)
    ↓
    control_measures (Меры)
    ├─ template_id → control_templates
    └─ target_implementation_date
         ↓
         evidence_links (Связь мер и доказательств)
         ├─ control_measure_id
         └─ evidence_id
              ↓
              evidence (Доказательства)
              ├─ ВАРИАНТ А: Файл
              │  ├─ file_url: "/storage/screenshot.png"
              │  ├─ file_name, file_size, file_type
              │  └─ document_id: NULL
              │
              └─ ВАРИАНТ Б: Документ ⭐
                 ├─ file_url: NULL
                 └─ document_id → documents
                      ↓
                      documents (Система документооборота)
                      ├─ document_type_id → document_types
                      │  └─ Определяет: retention, validity, requirements
                      │
                      ├─ template_id → knowledge_base_templates
                      │  └─ Откуда создан
                      │
                      ├─ current_version_id → document_versions
                      │  ├─ v1.0, v1.1, v2.0
                      │  └─ Файлы каждой версии
                      │
                      ├─ document_analyses (AI)
                      │  └─ Сравнение версий
                      │
                      └─ document_approvals (Workflow)
                         └─ Согласование и утверждение

knowledge_base (База знаний)
├─ kb_articles (Статьи и руководства)
└─ kb_templates (Шаблоны .docx)
```

---

## 🚀 ПЛАН ДЕЙСТВИЙ (Executable)

### Сейчас (Stage 16):

```bash
# 1. Создать миграции
scripts/620_create_document_types.sql
scripts/621_create_documents_table.sql
scripts/622_migrate_evidence_to_documents.sql
scripts/623_create_requirement_templates_link.sql

# 2. Запустить миграции
psql < 620_create_document_types.sql
psql < 621_create_documents_table.sql
psql < 622_migrate_evidence_to_documents.sql
psql < 623_create_requirement_templates_link.sql

# 3. Обновить типы
types/domain/document-type.ts       (новый)
types/domain/document.ts            (обновить)
types/domain/evidence.ts            (обновить)

# 4. Создать сервисы
services/document-type-service.ts   (новый)
lib/services/document-service.ts    (расширить)

# 5. Обновить UI
components/evidence/evidence-source-selector.tsx  (новый)
components/documents/create-document-wizard.tsx   (новый)
app/(dashboard)/documents/page.tsx                (обновить)

# 6. Тестирование
- Создать документ из шаблона
- Использовать как доказательство
- Переиспользовать в другой мере
- Создать новую версию
```

---

## ✅ SUCCESS METRICS

После реализации должны видеть:

```
✅ 90% документов имеют document_type_id
✅ 80% новых документов создаются из шаблонов
✅ 60% документов переиспользуются в разных мерах
✅ 50% документов проходят approval workflow
✅ 0 ошибок при создании evidence с документами
✅ Время создания документа: < 2 минут
✅ NPS пользователей: > 8/10
```

---

## 🎉 ИТОГО

**Создан полный master plan:**

📚 **5 архитектурных документов**  
📐 **Полная схема БД**  
🎨 **UI/UX концепции**  
🔄 **4 способа создания**  
🔗 **3 способа связывания**  
⏱️ **Оценка: 3 недели**  
🎯 **Приоритеты определены**  
✅ **Готово к реализации**

---

**Начинаем реализацию с миграции 620?** 🚀

Или хочешь сначала что-то уточнить/изменить в плане?

