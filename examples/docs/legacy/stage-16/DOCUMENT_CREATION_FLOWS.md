# User Flows: Создание документов и связь с доказательствами

**Дата:** 13 октября 2025  
**Автор:** Product Owner + UX Architect  
**Цель:** Описать понятные сценарии работы пользователей

---

## 🎯 СПОСОБЫ СОЗДАНИЯ ДОКУМЕНТОВ

### Способ 1: **Из библиотеки документов** (независимо от комплаенса)

#### UI Flow:

```
Пользователь: Специалист по ИБ
Задача: Создать политику ИБ для организации

1. Переход в /documents
   └─ Видит библиотеку документов организации

2. Клик "Создать документ"
   └─ Открывается диалог

3. Выбор типа документа
   ┌──────────────────────────────────────┐
   │ Выберите тип документа:              │
   │                                      │
   │ ○ 📋 Политика                        │
   │ ○ 📄 Приказ                          │
   │ ○ 📑 Инструкция                      │
   │ ○ 📊 Акт                            │
   │ ○ 📈 Отчет                          │
   └──────────────────────────────────────┘

4. Выбрал "Политика" → показываются подходящие шаблоны
   ┌──────────────────────────────────────┐
   │ Использовать шаблон? (опционально)   │
   │                                      │
   │ ☑️ Политика ИБ (общая)              │
   │ ☐ Политика ПДн                      │
   │ ☐ Политика работы с ЭП              │
   │ ☐ Без шаблона (пустой документ)     │
   └──────────────────────────────────────┘

5. Выбрал "Политика ИБ" → форма автоматически заполняется
   ┌──────────────────────────────────────┐
   │ Название: Политика информационной    │
   │           безопасности               │
   │                                      │
   │ Номер документа: №___-ИБ            │
   │ Дата документа: [13.10.2025]        │
   │                                      │
   │ Срок действия: [36] месяцев         │
   │ (автоматически из document_type)     │
   │                                      │
   │ Срок хранения: [Постоянно]          │
   │ (автоматически из document_type)     │
   │                                      │
   │ Файл: [Выбрать файл] или             │
   │       [Скачать шаблон и заполнить]   │
   └──────────────────────────────────────┘

6. Скачивает шаблон .docx
   └─ Заполняет в Word/LibreOffice
   └─ Загружает обратно

7. Система создает:
   documents:
     - id: doc-123
     - title: "Политика ИБ"
     - document_type_id: policy-ib
     - document_number: "№15-ИБ"
     - template_id: kb-template-policy
     - lifecycle_status: draft

   document_versions:
     - document_id: doc-123
     - version_number: v1.0
     - file_url: /storage/policy-v1.pdf
     - is_current: true

8. Документ создан → отображается в библиотеке
   └─ Статус: Draft (Черновик)
```

**Результат:**
- ✅ Документ создан в системе документооборота
- ✅ Пока НЕ связан с комплаенсом
- ✅ Можно редактировать, версионировать
- ⏳ Ждет утверждения

---

### Способ 2: **Прямо при создании меры** (контекст комплаенса)

#### UI Flow:

```
Пользователь: Менеджер по комплаенсу
Задача: Внедрить меру "Разработать политику ИБ"

1. Открыл compliance_record для КИИ-003
   └─ Видит меру "Разработать политику ИБ"

2. Клик на меру → вкладка "Доказательства"
   ┌──────────────────────────────────────┐
   │ Добавить доказательство:             │
   │                                      │
   │ [📎 Файл] [📄 Документ] [✨ Создать] │
   └──────────────────────────────────────┘

3. Выбрал "✨ Создать" → умная система
   ┌──────────────────────────────────────┐
   │ 💡 Рекомендация:                    │
   │                                      │
   │ Для меры "Политика ИБ" рекомендуем:  │
   │                                      │
   │ 📋 Тип документа: Политика           │
   │ 📄 Шаблон: Политика ИБ (общая)      │
   │                                      │
   │ [Использовать рекомендацию] [Другой] │
   └──────────────────────────────────────┘

4. Клик "Использовать" → форма с умными defaults
   ┌──────────────────────────────────────┐
   │ ✨ Создание документа из шаблона    │
   │                                      │
   │ Название: Политика информационной    │
   │           безопасности АО "..."      │
   │                                      │
   │ Номер: №15-ИБ                       │
   │ Дата: 13.10.2025                     │
   │                                      │
   │ [Скачать шаблон] [Загрузить файл]   │
   │                                      │
   │ ☑️ Сразу использовать как            │
   │    доказательство для этой меры      │
   └──────────────────────────────────────┘

5. Скачивает шаблон, заполняет, загружает

6. Система АВТОМАТИЧЕСКИ:
   
   a) Создает документ:
      documents:
        - title: "Политика ИБ АО Щёкиноазот"
        - document_type_id: policy-ib
        - template_id: kb-template-policy
        - lifecycle_status: draft
   
   b) Создает доказательство:
      evidence:
        - document_id: doc-123  ⭐ Ссылка!
        - compliance_record_id: comp-КИИ
        - evidence_type_id: policy
        - title: "Политика ИБ"
   
   c) Связывает с мерой:
      evidence_links:
        - evidence_id: ev-456
        - control_measure_id: cm-789

7. Пользователь видит:
   ┌──────────────────────────────────────┐
   │ ✅ Доказательство добавлено          │
   │                                      │
   │ 📄 Политика ИБ АО Щёкиноазот        │
   │ №15-ИБ от 13.10.2025                │
   │ Статус: Draft                        │
   │                                      │
   │ [Открыть документ] [Утвердить]       │
   └──────────────────────────────────────┘
```

**Результат:**
- ✅ Документ создан
- ✅ Сразу привязан как доказательство
- ✅ Связан с мерой
- ✅ Можно открыть в библиотеке документов
- ✅ Можно утвердить через workflow

---

### Способ 3: **Использовать существующий документ**

#### UI Flow:

```
Пользователь: Менеджер по комплаенсу
Задача: Для меры "Обучение персонала" использовать существующую политику

1. В мере → Добавить доказательство → [📄 Документ]

2. Открывается селектор документов
   ┌──────────────────────────────────────┐
   │ Выберите документ из библиотеки:     │
   │                                      │
   │ 🔍 Поиск: [политика обучен...]      │
   │                                      │
   │ Фильтры:                             │
   │ Тип: [Все типы ▼]                   │
   │ Статус: [✓ Только активные]         │
   │ Организация: [Текущая]               │
   │                                      │
   │ ┌──────────────────────────────────┐ │
   │ │ ☐ Политика ИБ                   │ │
   │ │   №15-ИБ от 13.10.2025           │ │
   │ │   Версия: v1.0                   │ │
   │ │   Используется в: 2 меры         │ │
   │ ├──────────────────────────────────┤ │
   │ │ ☐ Политика обучения персонала   │ │
   │ │   №28-ОП от 01.09.2025           │ │
   │ │   Версия: v1.1                   │ │
   │ │   Используется в: 0 мер          │ │
   │ └──────────────────────────────────┘ │
   │                                      │
   │ [Отмена] [Использовать выбранный]    │
   └──────────────────────────────────────┘

3. Выбирает "Политика обучения" → клик "Использовать"

4. Система создает evidence:
   evidence:
     - document_id: doc-555  ⭐ Ссылка на существующий
     - file_url: NULL
     - compliance_record_id: comp-ПДн-007
     - title: "Политика обучения персонала"
     - description: "Доказательство для меры обучения"

5. Автоматически связывает:
   evidence_links:
     - evidence_id: ev-новый
     - control_measure_id: cm-обучение

6. Пользователь видит:
   ┌──────────────────────────────────────┐
   │ ✅ Доказательство добавлено          │
   │                                      │
   │ 📄 Политика обучения персонала       │
   │ №28-ОП от 01.09.2025                │
   │ Версия: v1.1                         │
   │ Статус: Active                       │
   │                                      │
   │ ℹ️ Этот документ также используется: │
   │   - В требовании ПДн-003             │
   │                                      │
   │ [Открыть документ] [Отвязать]        │
   └──────────────────────────────────────┘
```

**Результат:**
- ✅ Переиспользован существующий документ
- ✅ Не создавали дубликатов
- ✅ Видно где еще используется
- ✅ При обновлении документа - все evidence обновятся

---

### Способ 4: **Автоматическое создание по рекомендации**

#### UI Flow:

```
Пользователь: Менеджер по комплаенсу
Задача: Выполнить требование КИИ-002 "Категорирование"

1. Создал compliance_record для КИИ-002

2. Система АВТОМАТИЧЕСКИ показывает:
   ┌──────────────────────────────────────┐
   │ 💡 Рекомендуемые действия:           │
   │                                      │
   │ Для выполнения требования нужно:     │
   │                                      │
   │ ✅ Меры защиты (3):                 │
   │    - Создать комиссию по КИИ         │
   │    - Провести категорирование        │
   │    - Подать сведения в ФСТЭК         │
   │                                      │
   │ ✅ Документы (2):                   │
   │    - Приказ о создании комиссии      │
   │    - Акт категорирования             │
   │                                      │
   │ [Создать всё автоматически]          │
   └──────────────────────────────────────┘

3. Клик "Создать всё" → система делает:
   
   a) Создает меры из control_templates
   
   b) Для каждой меры смотрит рекомендации:
      requirement_document_templates
        WHERE requirement_id = КИИ-002
      
      Находит:
      - template: "Приказ о комиссии КИИ"
      - template: "Акт категорирования"
   
   c) Создает ЧЕРНОВИКИ документов:
      documents:
        - title: "Приказ о создании комиссии по КИИ"
        - template_id: kb-template-commission-order
        - lifecycle_status: draft
        - owner_id: current_user
      
      documents:
        - title: "Акт категорирования объектов КИИ"
        - template_id: kb-template-kii-act
        - lifecycle_status: draft
   
   d) Создает evidence для каждого:
      evidence:
        - document_id: doc-приказ
        - compliance_record_id: comp-КИИ
      
      evidence:
        - document_id: doc-акт
        - compliance_record_id: comp-КИИ
   
   e) Связывает с мерами:
      evidence_links

4. Пользователь видит:
   ┌──────────────────────────────────────┐
   │ ✅ Создано автоматически:            │
   │                                      │
   │ Меры: 3                              │
   │ Документы: 2 (черновики)             │
   │ Доказательства: 2                    │
   │                                      │
   │ 📋 Следующие шаги:                  │
   │ 1. Скачайте шаблоны документов       │
   │ 2. Заполните их                      │
   │ 3. Загрузите обратно                 │
   │ 4. Отправьте на утверждение          │
   └──────────────────────────────────────┘

5. Для каждого черновика:
   ┌──────────────────────────────────────┐
   │ 📄 Приказ о создании комиссии КИИ   │
   │ Статус: ⚠️ Draft                    │
   │                                      │
   │ Действия:                            │
   │ [Скачать шаблон .docx]               │
   │ [Загрузить заполненный]              │
   │ [Отправить на утверждение]           │
   └──────────────────────────────────────┘

6. Загружает заполненный → создается версия v1.0

7. Отправляет на утверждение → создается approval workflow
```

**Результат:**
- ✅ Экономия времени (всё автоматически)
- ✅ Не забыли ничего создать
- ✅ Правильная структура сразу
- ✅ Guided process

---

## 🔗 СВЯЗЫВАНИЕ: Документы ↔ Доказательства

### API Endpoints:

```typescript
// =====================================================
// 1. СОЗДАНИЕ ДОКУМЕНТА
// =====================================================

POST /api/documents
{
  title: "Политика ИБ",
  document_type_id: "uuid-policy-ib",
  template_id: "uuid-kb-template",  // Опционально
  document_number: "№15-ИБ",
  document_date: "2025-10-13",
  organization_id: "uuid-org",
  file: <multipart/form-data>
}

→ Response:
{
  document: {
    id: "doc-123",
    current_version: { version_number: "v1.0", ... }
  }
}

// =====================================================
// 2. ИСПОЛЬЗОВАНИЕ ДОКУМЕНТА КАК ДОКАЗАТЕЛЬСТВА
// =====================================================

POST /api/evidence
{
  // Вариант А: Ссылка на существующий документ
  document_id: "doc-123",
  
  // Вариант Б: Загрузка файла
  // file: <multipart>,
  // file_name: "screenshot.png"
  
  evidence_type_id: "uuid-policy",
  compliance_record_id: "comp-123",
  title: "Политика ИБ как доказательство",
  description: "Подтверждает наличие утвержденной политики"
}

→ Response:
{
  evidence: {
    id: "ev-456",
    document_id: "doc-123",
    document: {  // Populated
      title: "Политика ИБ",
      document_number: "№15-ИБ",
      current_version: { version_number: "v1.0" }
    }
  }
}

// =====================================================
// 3. СВЯЗЫВАНИЕ С МЕРОЙ
// =====================================================

POST /api/evidence-links
{
  evidence_id: "ev-456",
  control_measure_id: "cm-789",
  link_notes: "Основное доказательство",
  relevance_score: 5
}

// =====================================================
// 4. СОЗДАНИЕ ДОКУМЕНТА + EVIDENCE В ОДНОМ ЗАПРОСЕ
// =====================================================

POST /api/documents/create-with-evidence
{
  // Данные документа
  document: {
    title: "Политика ИБ",
    document_type_id: "uuid",
    template_id: "uuid",
    document_number: "№15-ИБ",
    file: <multipart>
  },
  
  // Данные доказательства
  evidence: {
    compliance_record_id: "comp-123",
    evidence_type_id: "uuid-policy",
    control_measure_ids: ["cm-789", "cm-790"],  // Сразу связать с мерами
    title: "Политика ИБ"
  }
}

→ Response:
{
  document: { id: "doc-123", ... },
  evidence: { id: "ev-456", ... },
  links: [
    { evidence_id: "ev-456", control_measure_id: "cm-789" },
    { evidence_id: "ev-456", control_measure_id: "cm-790" }
  ]
}

// =====================================================
// 5. АВТОМАТИЧЕСКОЕ СОЗДАНИЕ ПО REQUIREMENT
// =====================================================

POST /api/compliance-records/{id}/auto-create-documents
{
  // Пустой body или параметры
}

→ Система:
1. Получает requirement.id из compliance_record
2. Находит requirement_document_templates для этого requirement
3. Для каждого шаблона:
   - Создает draft document
   - Создает evidence с document_id
   - Связывает с подходящими мерами

→ Response:
{
  created_documents: [
    { id: "doc-1", title: "Приказ...", status: "draft" },
    { id: "doc-2", title: "Акт...", status: "draft" }
  ],
  created_evidence: [
    { id: "ev-1", document_id: "doc-1" },
    { id: "ev-2", document_id: "doc-2" }
  ],
  next_steps: [
    "Скачайте и заполните шаблоны",
    "Загрузите заполненные документы",
    "Отправьте на утверждение"
  ]
}
```

---

## 🎨 UI КОМПОНЕНТЫ (детально)

### 1. **Карточка доказательства с документом**

```tsx
// components/evidence/evidence-card-with-document.tsx

export function EvidenceCardWithDocument({ evidence }) {
  const { document } = evidence  // Populated через JOIN
  
  if (evidence.document_id) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <Badge variant="outline">Документ</Badge>
            <Badge variant={getLifecycleBadge(document.lifecycle_status)}>
              {document.lifecycle_status}
            </Badge>
          </div>
          <CardTitle>{evidence.title}</CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Реквизиты документа */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Номер:</span>
              <span className="font-medium">{document.document_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Дата:</span>
              <span className="font-medium">{formatDate(document.document_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Версия:</span>
              <span className="font-medium">
                {document.currentVersion?.version_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Действует до:</span>
              <span className="font-medium">
                {formatDate(document.effective_until)}
              </span>
            </div>
          </div>
          
          {/* Предупреждения */}
          {document.lifecycle_status === 'draft' && (
            <Alert variant="warning" className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Документ в статусе черновика. Требуется утверждение.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Кнопки */}
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => router.push(`/documents/${document.id}`)}
            >
              Открыть документ
            </Button>
            <Button 
              variant="outline"
              onClick={() => downloadVersion(document.current_version_id)}
            >
              Скачать
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={viewDocumentHistory}>
                  История версий
                </DropdownMenuItem>
                <DropdownMenuItem onClick={unlinkDocument}>
                  Отвязать документ
                </DropdownMenuItem>
                {document.lifecycle_status === 'draft' && (
                  <DropdownMenuItem onClick={startApproval}>
                    Отправить на утверждение
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Обычное доказательство-файл
  return <EvidenceCardSimple evidence={evidence} />
}
```

---

### 2. **Селектор источника доказательства**

```tsx
// components/evidence/evidence-source-selector.tsx

export function EvidenceSourceSelector({ 
  onEvidenceCreated,
  complianceRecordId,
  controlMeasureId,
  recommendedTemplates  // Из requirement
}) {
  return (
    <Tabs defaultValue="file">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="file">
          <Paperclip className="h-4 w-4 mr-2" />
          Файл
        </TabsTrigger>
        <TabsTrigger value="document">
          <FileText className="h-4 w-4 mr-2" />
          Документ
        </TabsTrigger>
        <TabsTrigger value="create">
          <Sparkles className="h-4 w-4 mr-2" />
          Создать
        </TabsTrigger>
      </TabsList>
      
      {/* Вкладка 1: Загрузка файла */}
      <TabsContent value="file">
        <FileUploader
          onUpload={async (file) => {
            const evidence = await createEvidence({
              file_name: file.name,
              file_url: uploadedUrl,
              file_type: file.type,
              file_size: file.size,
              compliance_record_id: complianceRecordId,
              evidence_type_id: selectedType
            })
            
            if (controlMeasureId) {
              await linkToMeasure(evidence.id, controlMeasureId)
            }
            
            onEvidenceCreated(evidence)
          }}
        />
      </TabsContent>
      
      {/* Вкладка 2: Выбор существующего документа */}
      <TabsContent value="document">
        {recommendedTemplates.length > 0 && (
          <Alert className="mb-4">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              💡 Для этого требования рекомендуются следующие документы:
              <div className="mt-2 flex flex-wrap gap-2">
                {recommendedTemplates.map(t => (
                  <Badge key={t.id} variant="secondary">
                    {t.title}
                  </Badge>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <DocumentSelector
          filters={{
            lifecycle_status: ['active', 'draft'],
            organization_id: currentOrganizationId
          }}
          onSelect={async (document) => {
            const evidence = await createEvidence({
              document_id: document.id,
              compliance_record_id: complianceRecordId,
              evidence_type_id: document.document_type.default_evidence_type_id,
              title: document.title
            })
            
            if (controlMeasureId) {
              await linkToMeasure(evidence.id, controlMeasureId)
            }
            
            onEvidenceCreated(evidence)
          }}
        />
      </TabsContent>
      
      {/* Вкладка 3: Создание нового документа */}
      <TabsContent value="create">
        <CreateDocumentWithTemplate
          recommendedTemplates={recommendedTemplates}
          onCreated={async (document) => {
            // Автоматически создаем evidence
            const evidence = await createEvidence({
              document_id: document.id,
              compliance_record_id: complianceRecordId,
              title: document.title
            })
            
            if (controlMeasureId) {
              await linkToMeasure(evidence.id, controlMeasureId)
            }
            
            onEvidenceCreated(evidence)
          }}
        />
      </TabsContent>
    </Tabs>
  )
}
```

---

### 3. **Страница документа (детальный вид)**

```tsx
// app/(dashboard)/documents/[id]/page.tsx

export default function DocumentDetailPage({ params }) {
  const { document, versions, evidence_usages } = await fetchDocument(params.id)
  
  return (
    <div>
      <Header>
        <Breadcrumb>
          <BreadcrumbItem href="/documents">Документы</BreadcrumbItem>
          <BreadcrumbItem>{document.title}</BreadcrumbItem>
        </Breadcrumb>
        
        <div className="flex gap-2">
          <Button onClick={createNewVersion}>Новая версия</Button>
          <Button onClick={downloadCurrent}>Скачать</Button>
          {document.lifecycle_status === 'draft' && (
            <Button onClick={startApproval}>Отправить на утверждение</Button>
          )}
        </div>
      </Header>
      
      {/* Карточка документа */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{document.title}</CardTitle>
              <CardDescription>
                {document.document_number} от {document.document_date}
              </CardDescription>
            </div>
            <DocumentLifecycleBadge status={document.lifecycle_status} />
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Реквизиты */}
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">Тип документа</dt>
              <dd className="font-medium">{document.documentType.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Версия</dt>
              <dd className="font-medium">{document.currentVersion.version_number}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Действует с</dt>
              <dd className="font-medium">{formatDate(document.effective_from)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Действует до</dt>
              <dd className="font-medium">{formatDate(document.effective_until)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Следующий пересмотр</dt>
              <dd className="font-medium">{formatDate(document.next_review_date)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Срок хранения</dt>
              <dd className="font-medium">
                {document.retention_period_years 
                  ? `${document.retention_period_years} лет`
                  : 'Постоянно'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      
      {/* Где используется как доказательство */}
      {evidence_usages.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Используется как доказательство</CardTitle>
            <CardDescription>
              Этот документ связан с {evidence_usages.length} записями комплаенса
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Требование</TableHead>
                  <TableHead>Мера</TableHead>
                  <TableHead>Дата добавления</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evidence_usages.map(usage => (
                  <TableRow key={usage.evidence_id}>
                    <TableCell>
                      <Link href={`/requirements/${usage.requirement_id}`}>
                        {usage.requirement_code}
                      </Link>
                    </TableCell>
                    <TableCell>{usage.measure_title}</TableCell>
                    <TableCell>{formatDate(usage.created_at)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/compliance/${usage.compliance_record_id}`)}
                      >
                        Открыть
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {/* Версии */}
      <Tabs defaultValue="versions">
        <TabsList>
          <TabsTrigger value="versions">Версии ({versions.length})</TabsTrigger>
          <TabsTrigger value="analysis">AI Анализ</TabsTrigger>
          <TabsTrigger value="approvals">Утверждения</TabsTrigger>
        </TabsList>
        
        <TabsContent value="versions">
          <DocumentVersionsList versions={versions} />
        </TabsContent>
        
        <TabsContent value="analysis">
          <DocumentAnalysisView documentId={document.id} />
        </TabsContent>
        
        <TabsContent value="approvals">
          <DocumentApprovalsView documentId={document.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## 🔄 ЖИЗНЕННЫЙ ЦИКЛ (end-to-end)

### Полный цикл документа-доказательства:

```
1. СОЗДАНИЕ
   User: Создает документ из шаблона
   System:
     → documents (lifecycle: draft)
     → document_versions (v1.0, is_current: true)
     → evidence (document_id: ...)
     → evidence_links (связь с мерой)

2. УТВЕРЖДЕНИЕ
   User: Отправляет на утверждение
   System:
     → document_approvals (status: pending)
     → document_approval_steps (для каждого approver)
     → notifications (уведомления approvers)
   
   Approvers: Согласовывают по очереди
   System:
     → Обновляет approval_steps
     → Когда все утвердили:
       → documents.lifecycle_status = active
       → documents.approved_at = NOW()
       → documents.effective_from = NOW() (если не указано)
       → Уведомление создателю

3. ИСПОЛЬЗОВАНИЕ
   User: Документ используется в комплаенсе
   System:
     → evidence уже создан
     → Можно добавить еще evidence для других мер
     → Один документ → много evidence

4. АКТУАЛИЗАЦИЯ
   System: Наступает next_review_date
     → Уведомление owner
     → Task "Пересмотреть документ"
   
   User: Создает новую версию
   System:
     → document_versions (v1.1, is_current: true)
     → document_analyses (AI сравнение v1.0 vs v1.1)
     → Все evidence автоматически видят новую версию!

5. АРХИВИРОВАНИЕ
   System: Наступает effective_until
     → documents.lifecycle_status = archived
     → Уведомление: "Документ истек"
   
   User: Создает новый документ взамен
   System:
     → Новый документ (v2.0 major)
     → Может обновить evidence.document_id на новый

6. УНИЧТОЖЕНИЕ
   System: Наступает destruction_date
     → documents.lifecycle_status = destroyed
     → Уведомление архивариусу
   
   Archiver: Подтверждает уничтожение
   System:
     → Акт уничтожения (отдельный документ!)
     → Файлы удаляются из storage
     → Запись остается (audit trail)
```

---

## 📊 ИТОГОВАЯ ДИАГРАММА

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCUMENT ECOSYSTEM                        │
└─────────────────────────────────────────────────────────────┘

requirements
    │
    ├─ requirement_document_templates ──→ knowledge_base_templates
    │  │                                   (шаблоны .docx)
    │  │
    │  └─ Рекомендации: "Для КИИ-002 нужен Акт категорирования"
    │
    └─ compliance_records
        │
        ├─ control_measures
        │   │
        │   └─ evidence_links ──→ evidence
        │                           │
        │                           ├─ file_url (простой файл)
        │                           │  └─ screenshot.png
        │                           │
        │                           └─ document_id ──→ documents ⭐
        │                                               │
        │                                               ├─ document_type_id → document_types
        │                                               ├─ template_id → kb_templates
        │                                               ├─ document_versions
        │                                               ├─ document_analyses (AI)
        │                                               └─ document_approvals
        │
        └─ Другие evidence (файлы)


Независимая библиотека:
/documents
    └─ Все документы организации
        ├─ Могут использоваться в комплаенсе
        └─ Могут НЕ использоваться (внутренние)
```

---

## ✅ ИТОГОВАЯ РЕКОМЕНДАЦИЯ

### **Создание документов: 4 способа**

1. **Из библиотеки** → /documents → Создать
2. **При создании меры** → Автоматически из рекомендаций
3. **Из требования** → Auto-create по requirement_document_templates
4. **Из шаблона KB** → Скачать → Заполнить → Загрузить

### **Связывание с доказательствами: 3 способа**

1. **Автоматически** при создании (checkbox "Использовать как доказательство")
2. **Вручную** из селектора документов
3. **Массово** для нескольких мер одновременно

### **Ключевые принципы:**

✅ Документ может существовать БЕЗ evidence  
✅ Документ может использоваться МНОГОКРАТНО как evidence  
✅ Evidence может быть ЛИБО файл, ЛИБО документ  
✅ При обновлении документа → все evidence видят изменения  

---

## 🚀 Что дальше?

**Реализовать миграцию 620:**
1. Создать таблицу `documents`
2. Создать таблицу `document_types`
3. Мигрировать данные
4. Обновить API и UI

**Время:** 2-3 дня  
**Ценность:** 🔥🔥🔥 Критическая

**Начинаем?** 🎯

