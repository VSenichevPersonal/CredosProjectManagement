# Чистая архитектура: Документы vs Доказательства

**Дата:** 13 октября 2025  
**Автор:** Software Architect  
**Проблема:** Запутанная модель evidence + is_document  
**Решение:** Разделение concerns

---

## ❌ ТЕКУЩАЯ ПРОБЛЕМА

### Что есть сейчас:

```sql
evidence (универсальная таблица)
├─ is_document = false → Простое доказательство (скриншот, лог)
└─ is_document = true  → Документ (политика, приказ)
```

### Почему это запутанно:

```typescript
// Непонятно:
evidence = { 
  is_document: true,
  file_name: "Политика_ИБ.pdf"
}

// Это доказательство? Или документ? Или и то, и то?
// Если документ - зачем в таблице evidence?
// Если доказательство - зачем версионирование?
```

**Проблемы:**
1. ❌ Смешаны разные концепции (documents vs evidence)
2. ❌ is_document флаг - признак плохого дизайна
3. ❌ Невозможно иметь документ БЕЗ привязки к доказательству
4. ❌ Система документов не работает независимо

---

## ✅ ЧИСТОЕ РЕШЕНИЕ

### 🎯 Принцип разделения concerns:

```
ДОКУМЕНТЫ (documents)
├─ Система документооборота организации
├─ Политики, приказы, положения, инструкции
├─ Версионирование, утверждение, хранение
├─ Работают НЕЗАВИСИМО от compliance
└─ Могут стать доказательствами (опционально)

ДОКАЗАТЕЛЬСТВА (evidence)
├─ Подтверждение выполнения требований
├─ Скриншоты, логи, конфигурации, файлы
├─ Привязаны к мерам и требованиям
├─ Могут ссылаться на документы (опционально)
└─ НЕ требуют версионирования
```

---

## 🏗️ РЕКОМЕНДУЕМАЯ АРХИТЕКТУРА

### 📊 Новая модель данных:

```sql
-- =====================================================
-- ТАБЛИЦА 1: DOCUMENTS (Система документооборота)
-- =====================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  organization_id UUID REFERENCES organizations(id),  -- Может быть NULL (тенант-уровень)
  
  -- Классификация
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  
  -- Основная информация
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Реквизиты (российская специфика)
  document_number VARCHAR(100),    -- №123-ИБ
  document_date DATE,               -- от 13.10.2025
  
  -- Текущая версия (FK)
  current_version_id UUID,          -- → document_versions
  
  -- Жизненный цикл
  lifecycle_status document_lifecycle DEFAULT 'draft',
  -- draft, active, archived, destroyed
  
  -- Утверждение
  approved_by UUID REFERENCES users(id),
  approved_at DATE,
  
  -- Период действия
  effective_from DATE,
  effective_until DATE,
  
  -- Пересмотр
  next_review_date DATE,
  last_reviewed_at TIMESTAMPTZ,
  last_reviewed_by UUID REFERENCES users(id),
  
  -- Хранение (ГОСТ Р 7.0.8-2013)
  retention_period_years INTEGER,
  destruction_date DATE,
  nomenclature_item_id UUID,  -- Номенклатура дел
  
  -- Грифы конфиденциальности
  confidentiality_level VARCHAR(50),  -- public, internal, confidential, dsp
  
  -- Связь с шаблоном (откуда создан)
  template_id UUID REFERENCES knowledge_base_templates(id),
  
  -- Владение
  owner_id UUID REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ТАБЛИЦА 2: EVIDENCE (Доказательства для комплаенса)
-- =====================================================

CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  organization_id UUID REFERENCES organizations(id),
  
  -- Связи с комплаенсом
  compliance_record_id UUID REFERENCES compliance_records(id),
  requirement_id UUID REFERENCES requirements(id),
  control_measure_id UUID,  -- через evidence_links (many-to-many)
  
  -- Тип доказательства
  evidence_type_id UUID NOT NULL REFERENCES evidence_types(id),
  
  -- Файл (если это файл)
  file_name VARCHAR(500),
  file_url TEXT,
  file_type VARCHAR(100),
  file_size BIGINT,
  storage_path TEXT,
  
  -- Или ссылка на документ (если документ является доказательством)
  document_id UUID REFERENCES documents(id),  -- ⭐ КЛЮЧЕВОЕ ПОЛЕ
  
  -- Метаданные
  title VARCHAR(500),
  description TEXT,
  tags TEXT[],
  
  -- Статус
  status evidence_status DEFAULT 'pending',
  -- pending, approved, rejected, archived
  
  review_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Загрузка
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: либо file, либо document
  CONSTRAINT evidence_has_content CHECK (
    (file_url IS NOT NULL AND document_id IS NULL) OR
    (file_url IS NULL AND document_id IS NOT NULL)
  )
);

-- =====================================================
-- ТАБЛИЦА 3: DOCUMENT_VERSIONS (Версии документов)
-- =====================================================

CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  version_number VARCHAR(20) NOT NULL,  -- v1.0, v1.1, v2.0
  major_version INTEGER NOT NULL,
  minor_version INTEGER NOT NULL,
  
  -- Файл версии
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- Изменения
  change_summary TEXT,
  change_notes TEXT,
  
  -- Статус
  is_current BOOLEAN DEFAULT false,
  
  -- Audit
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(document_id, version_number)
);
```

---

## 🎯 КАК ЭТО РАБОТАЕТ

### Сценарий 1: **Документ = Доказательство**

```typescript
// 1. Создаем документ (политика ИБ)
document = {
  id: "doc-123",
  title: "Политика информационной безопасности",
  document_type_id: "policy-ib",
  document_number: "№15-ИБ",
  document_date: "2025-10-01",
  lifecycle_status: "active"
}

// 2. Используем документ как доказательство
evidence = {
  id: "ev-456",
  document_id: "doc-123",  // ⭐ Ссылка на документ
  file_url: NULL,           // Нет файла, есть документ
  evidence_type_id: "policy",
  compliance_record_id: "comp-789",
  title: "Политика ИБ как доказательство"
}

// 3. Связываем с мерой
evidence_link = {
  evidence_id: "ev-456",
  control_measure_id: "cm-999"
}
```

**Результат:**
- ✅ Документ существует независимо
- ✅ Может использоваться как доказательство
- ✅ Может использоваться в нескольких мерах
- ✅ Версионируется как документ (не evidence)

---

### Сценарий 2: **Простое доказательство (НЕ документ)**

```typescript
// Загружаем скриншот настроек файрвола
evidence = {
  id: "ev-111",
  document_id: NULL,        // ⭐ Нет документа
  file_url: "/storage/firewall.png",
  file_name: "firewall_config.png",
  file_type: "image/png",
  evidence_type_id: "screenshot",
  compliance_record_id: "comp-789"
}
```

**Результат:**
- ✅ Простой файл, не документ
- ✅ НЕ нужно версионирование
- ✅ НЕ нужна регистрация
- ✅ Просто доказательство

---

### Сценарий 3: **Документ БЕЗ использования как доказательство**

```typescript
// Политика обучения персонала (внутренняя)
document = {
  id: "doc-777",
  title: "Положение об обучении персонала",
  document_type_id: "instruction",
  lifecycle_status: "active",
  organization_id: "org-123"
}

// НЕТ evidence для этого документа!
// Документ просто хранится в системе документооборота
```

**Результат:**
- ✅ Документ живет своей жизнью
- ✅ Версионируется
- ✅ Хранится по срокам
- ✅ НЕ привязан к комплаенсу (пока не нужно)

---

### Сценарий 4: **Один документ → Много доказательств**

```typescript
// Политика ИБ
document = { id: "doc-888", title: "Политика ИБ" }

// Используется как доказательство в разных местах
evidence_1 = {
  document_id: "doc-888",
  compliance_record_id: "comp-КИИ-001",
  title: "Политика для КИИ"
}

evidence_2 = {
  document_id: "doc-888",
  compliance_record_id: "comp-ПДн-005",
  title: "Политика для ПДн"
}

evidence_3 = {
  document_id: "doc-888",
  requirement_id: "req-ГИС-003",
  title: "Политика для ГИС"
}
```

**Результат:**
- ✅ Один документ
- ✅ Используется в 3 разных контекстах
- ✅ Разные notes/relevance_score для каждого использования
- ✅ При обновлении документа - все evidence видят новую версию

---

## 📐 UI/UX ПАТТЕРНЫ

### 1. **Загрузка доказательства**

```tsx
<UploadEvidenceDialog>
  <RadioGroup>
    <RadioItem value="file">
      📎 Загрузить файл
      └─ Input[type=file]
    </RadioItem>
    
    <RadioItem value="document">
      📄 Использовать документ из системы
      └─ Select (выбор из documents)
         └─ Фильтр: только active documents
    </RadioItem>
    
    <RadioItem value="new-document">
      ✨ Создать новый документ
      └─ Форма создания документа
         ├─ Выбор типа документа
         ├─ Выбор шаблона (опционально)
         └─ После создания → используется как evidence
    </RadioItem>
  </RadioGroup>
</UploadEvidenceDialog>
```

---

### 2. **Карточка доказательства**

```tsx
<EvidenceCard>
  {evidence.document_id ? (
    // Доказательство-документ
    <div>
      <Badge>📄 Документ</Badge>
      <Link href={`/documents/${evidence.document_id}`}>
        {evidence.title}
      </Link>
      <p className="text-xs">
        {document.document_number} от {document.document_date}
      </p>
      <p className="text-xs text-muted">
        Версия: {document.currentVersion.version_number}
      </p>
      
      {/* Кнопки */}
      <Button onClick={openDocument}>Открыть документ</Button>
      <Button onClick={unlinkDocument}>Отвязать</Button>
    </div>
  ) : (
    // Простое доказательство-файл
    <div>
      <Badge>📎 Файл</Badge>
      <p>{evidence.file_name}</p>
      <p className="text-xs">{formatFileSize(evidence.file_size)}</p>
      
      {/* Кнопки */}
      <Button onClick={downloadFile}>Скачать</Button>
      <Button onClick={deleteEvidence}>Удалить</Button>
    </div>
  )}
</EvidenceCard>
```

---

### 3. **Библиотека документов (независимая)**

```tsx
// /documents - отдельная страница
<DocumentsLibrary>
  {/* Фильтры */}
  <Filters>
    <Select name="document_type" />
    <Select name="lifecycle_status" />
    <Select name="organization" />
    <Input name="search" />
  </Filters>
  
  {/* Список документов */}
  {documents.map(doc => (
    <DocumentCard key={doc.id}>
      <Badge>{doc.documentType.name}</Badge>
      <h3>{doc.title}</h3>
      <p>{doc.document_number} от {doc.document_date}</p>
      
      {/* Статусы */}
      <Badge variant={doc.lifecycle_status}>
        {doc.lifecycle_status}
      </Badge>
      
      {/* Используется как доказательство? */}
      {doc.usedAsEvidence && (
        <Badge variant="outline">
          Используется в {doc.evidenceCount} доказательствах
        </Badge>
      )}
      
      {/* Действия */}
      <DropdownMenu>
        <MenuItem onClick={viewDocument}>Открыть</MenuItem>
        <MenuItem onClick={createNewVersion}>Новая версия</MenuItem>
        <MenuItem onClick={useAsEvidence}>Использовать как доказательство</MenuItem>
        <MenuItem onClick={archiveDocument}>Архивировать</MenuItem>
      </DropdownMenu>
    </DocumentCard>
  ))}
</DocumentsLibrary>
```

---

## 🗄️ ПОЛНАЯ СХЕМА БД

```sql
-- =====================================================
-- МИГРАЦИЯ 620: РАЗДЕЛЕНИЕ ДОКУМЕНТОВ И ДОКАЗАТЕЛЬСТВ
-- =====================================================

-- 1. СОЗДАТЬ ТАБЛИЦУ ДОКУМЕНТОВ
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Классификация
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  template_id UUID REFERENCES knowledge_base_templates(id),
  
  -- Основная информация
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Реквизиты (обязательно для РФ)
  document_number VARCHAR(100),
  document_date DATE,
  
  -- Версионирование
  current_version_id UUID,  -- FK to document_versions
  
  -- Жизненный цикл
  lifecycle_status document_lifecycle DEFAULT 'draft',
  
  -- Утверждение
  approved_by UUID REFERENCES users(id),
  approved_at DATE,
  
  -- Период действия
  effective_from DATE,
  effective_until DATE,
  
  -- Пересмотр
  validity_period_days INTEGER,
  next_review_date DATE,
  last_reviewed_at TIMESTAMPTZ,
  last_reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  
  -- Хранение
  retention_period_years INTEGER,
  destruction_date DATE,
  nomenclature_item_id UUID,
  
  -- Конфиденциальность
  confidentiality_level VARCHAR(50) DEFAULT 'internal',
  access_restrictions JSONB,
  
  -- Владение
  owner_id UUID REFERENCES users(id),
  
  -- Audit
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Индексы
  CONSTRAINT documents_number_unique UNIQUE(tenant_id, document_number)
);

-- 2. ОБНОВИТЬ ТАБЛИЦУ EVIDENCE (убрать document-specific поля)
-- Все поля is_document, current_version_id, etc → удалить
-- Добавить только:
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL;

-- Constraint: либо file, либо document
ALTER TABLE evidence ADD CONSTRAINT evidence_content_check CHECK (
  (file_url IS NOT NULL AND document_id IS NULL) OR
  (file_url IS NULL AND document_id IS NOT NULL)
);

-- 3. ИНДЕКСЫ
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_organization ON documents(organization_id);
CREATE INDEX idx_documents_type ON documents(document_type_id);
CREATE INDEX idx_documents_lifecycle ON documents(lifecycle_status);
CREATE INDEX idx_documents_active ON documents(lifecycle_status) 
  WHERE lifecycle_status = 'active';
CREATE INDEX idx_documents_number ON documents(document_number) 
  WHERE document_number IS NOT NULL;

CREATE INDEX idx_evidence_document ON evidence(document_id) 
  WHERE document_id IS NOT NULL;

-- 4. FOREIGN KEY для current_version_id
ALTER TABLE documents ADD CONSTRAINT documents_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES document_versions(id) ON DELETE SET NULL;

-- 5. TRIGGER для documents (как для control_measures)
CREATE OR REPLACE FUNCTION update_document_lifecycle()
RETURNS TRIGGER AS $$
BEGIN
  -- При утверждении: draft → active
  IF NEW.approved_at IS NOT NULL AND (OLD IS NULL OR OLD.approved_at IS NULL) THEN
    IF NEW.lifecycle_status = 'draft' THEN
      NEW.lifecycle_status := 'active';
    END IF;
    
    IF NEW.effective_from IS NULL THEN
      NEW.effective_from := NEW.approved_at;
    END IF;
  END IF;
  
  -- Рассчитать destruction_date
  IF NEW.retention_period_years IS NOT NULL AND NEW.destruction_date IS NULL THEN
    NEW.destruction_date := NEW.effective_from + (NEW.retention_period_years || ' years')::INTERVAL;
  END IF;
  
  -- Архивировать при истечении
  IF NEW.effective_until IS NOT NULL 
     AND NEW.effective_until < CURRENT_DATE 
     AND NEW.lifecycle_status = 'active' THEN
    NEW.lifecycle_status := 'archived';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_document_lifecycle
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_lifecycle();
```

---

## 🔄 МИГРАЦИЯ СУЩЕСТВУЮЩИХ ДАННЫХ

```sql
-- =====================================================
-- МИГРАЦИЯ ДАННЫХ: evidence → documents
-- =====================================================

-- 1. Перенести документы из evidence в documents
INSERT INTO documents (
  id,
  tenant_id,
  organization_id,
  title,
  description,
  current_version_id,
  lifecycle_status,
  next_review_date,
  last_reviewed_at,
  last_reviewed_by,
  retention_period_years,
  owner_id,
  created_by,
  created_at,
  updated_at
)
SELECT 
  id,
  tenant_id,
  organization_id,
  title,
  description,
  current_version_id,
  CASE 
    WHEN status = 'approved' THEN 'active'::document_lifecycle
    WHEN status = 'archived' THEN 'archived'::document_lifecycle
    ELSE 'draft'::document_lifecycle
  END,
  next_review_date,
  last_reviewed_at,
  last_reviewed_by,
  5,  -- По умолчанию 5 лет
  uploaded_by,
  uploaded_by,
  created_at,
  updated_at
FROM evidence
WHERE is_document = true;

-- 2. Обновить document_versions → ссылаться на documents
-- (уже правильно ссылаются через document_id)

-- 3. Создать evidence записи для документов-доказательств
INSERT INTO evidence (
  id,
  tenant_id,
  organization_id,
  compliance_record_id,
  requirement_id,
  document_id,  -- ⭐ Ссылка на новую таблицу documents
  evidence_type_id,
  title,
  description,
  status,
  uploaded_by,
  uploaded_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),  -- Новый ID для evidence
  e.tenant_id,
  e.organization_id,
  e.compliance_record_id,
  e.requirement_id,
  e.id,  -- document_id = старый evidence.id
  e.evidence_type_id,
  e.title || ' (документ)',
  e.description,
  e.status,
  e.uploaded_by,
  e.uploaded_at,
  NOW(),
  NOW()
FROM evidence e
WHERE e.is_document = true
  AND (e.compliance_record_id IS NOT NULL OR e.requirement_id IS NOT NULL);

-- 4. Удалить старые поля из evidence
ALTER TABLE evidence DROP COLUMN IF EXISTS is_document;
ALTER TABLE evidence DROP COLUMN IF EXISTS current_version_id;
ALTER TABLE evidence DROP COLUMN IF EXISTS validity_period_days;
ALTER TABLE evidence DROP COLUMN IF EXISTS expires_at;
ALTER TABLE evidence DROP COLUMN IF EXISTS document_status;
ALTER TABLE evidence DROP COLUMN IF EXISTS actuality_status;

-- Эти поля теперь в documents!
```

---

## 🎨 UI КОМПОНЕНТЫ (обновленные)

### 1. **Две отдельные секции в навигации**

```tsx
<AppSidebar>
  {/* Секция Комплаенс */}
  <SidebarSection title="Комплаенс">
    <SidebarItem href="/compliance">Записи соответствия</SidebarItem>
    <SidebarItem href="/requirements">Требования</SidebarItem>
    <SidebarItem href="/evidence">Доказательства</SidebarItem> {/* Только файлы + ссылки на документы */}
  </SidebarSection>
  
  {/* Секция Документооборот */}
  <SidebarSection title="Документооборот">
    <SidebarItem href="/documents">Документы</SidebarItem> {/* Независимая библиотека */}
    <SidebarItem href="/documents/templates">Шаблоны</SidebarItem>
    <SidebarItem href="/documents/registry">Регистрация</SidebarItem>
  </SidebarSection>
</AppSidebar>
```

---

### 2. **Компонент выбора: файл vs документ**

```tsx
<EvidenceSourceSelector>
  <Tabs defaultValue="file">
    <TabsList>
      <TabsTrigger value="file">📎 Файл</TabsTrigger>
      <TabsTrigger value="document">📄 Документ</TabsTrigger>
      <TabsTrigger value="create-document">✨ Новый документ</TabsTrigger>
    </TabsList>
    
    <TabsContent value="file">
      <FileUploader
        onUpload={(file) => createEvidence({ file })}
      />
    </TabsContent>
    
    <TabsContent value="document">
      <DocumentSelector
        documents={activeDocuments}
        onSelect={(doc) => createEvidence({ document_id: doc.id })}
      />
    </TabsContent>
    
    <TabsContent value="create-document">
      <CreateDocumentForm
        templates={recommendedTemplates}
        documentTypes={availableTypes}
        onCreated={(doc) => createEvidence({ document_id: doc.id })}
      />
    </TabsContent>
  </Tabs>
</EvidenceSourceSelector>
```

---

### 3. **Библиотека документов (независимая)**

```tsx
// Страница: /documents
<DocumentsLibrary>
  <Header>
    <h1>Документы организации</h1>
    <Button onClick={createDocument}>Создать документ</Button>
  </Header>
  
  <Filters>
    <Select name="type" options={documentTypes} />
    <Select name="lifecycle" options={lifecycleStatuses} />
    <Select name="confidentiality" options={confidentialityLevels} />
    <DateRangePicker name="dateRange" />
  </Filters>
  
  <DocumentsGrid>
    {documents.map(doc => (
      <DocumentCard
        document={doc}
        showUsageStats={true}  {/* Используется в N доказательствах */}
        actions={[
          "view", "edit", "new-version", 
          "use-as-evidence",  {/* Создать evidence из документа */}
          "archive", "destroy"
        ]}
      />
    ))}
  </DocumentsGrid>
</DocumentsLibrary>
```

---

## 📊 QUERIES & VIEWS

### 1. **Документы используемые как доказательства**

```sql
CREATE VIEW v_documents_as_evidence AS
SELECT 
  d.id as document_id,
  d.title as document_title,
  d.document_number,
  d.document_date,
  d.lifecycle_status,
  COUNT(DISTINCT e.id) as evidence_count,
  COUNT(DISTINCT e.compliance_record_id) as used_in_compliance_records,
  COUNT(DISTINCT e.requirement_id) as used_in_requirements,
  array_agg(DISTINCT cm.id) as linked_measure_ids
FROM documents d
LEFT JOIN evidence e ON e.document_id = d.id
LEFT JOIN evidence_links el ON el.evidence_id = e.id
LEFT JOIN control_measures cm ON cm.id = el.control_measure_id
GROUP BY d.id;
```

### 2. **Доказательства без привязки**

```sql
-- Найти "осиротевшие" evidence
SELECT 
  e.id,
  e.title,
  e.file_name,
  e.uploaded_at,
  CASE 
    WHEN e.document_id IS NOT NULL THEN 'Документ'
    ELSE 'Файл'
  END as evidence_type
FROM evidence e
WHERE e.compliance_record_id IS NULL
  AND e.requirement_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM evidence_links el WHERE el.evidence_id = e.id
  );
```

### 3. **Документы требующие внимания**

```sql
SELECT 
  d.id,
  d.title,
  d.document_number,
  CASE
    WHEN d.next_review_date < CURRENT_DATE THEN 'Просрочен пересмотр'
    WHEN d.effective_until < CURRENT_DATE THEN 'Истек срок действия'
    WHEN d.destruction_date < CURRENT_DATE THEN 'Требует уничтожения'
    WHEN d.document_number IS NULL THEN 'Нет номера'
    ELSE 'OK'
  END as issue
FROM documents d
WHERE d.lifecycle_status IN ('draft', 'active')
  AND (
    d.next_review_date < CURRENT_DATE OR
    d.effective_until < CURRENT_DATE OR
    d.destruction_date < CURRENT_DATE OR
    d.document_number IS NULL
  );
```

---

## 🎯 ИТОГОВАЯ РЕКОМЕНДАЦИЯ АРХИТЕКТОРА

### ✅ ЧТО ДЕЛАЕМ:

**Миграция 620: Чистое разделение**

1. Создать таблицу `documents` (отдельно)
2. Обновить `evidence` (добавить `document_id`, убрать `is_document`)
3. Мигрировать данные
4. Обновить все сервисы и UI

**Преимущества:**
- ✅ Чистая архитектура (Single Responsibility)
- ✅ Документы работают независимо
- ✅ Документ может использоваться многократно как evidence
- ✅ Понятно: documents для документооборота, evidence для комплаенса
- ✅ Гибко: можно расширять каждую сущность независимо

**Время:** 2-3 дня (большая миграция)

---

## 🤔 АЛЬТЕРНАТИВНЫЙ ВАРИАНТ (если времени мало)

### Оставить как есть, но добавить четкую семантику:

```sql
-- Не создавать documents, а улучшить evidence
ALTER TABLE evidence ADD COLUMN
  is_document_evidence BOOLEAN DEFAULT false;

-- Документ в системе = evidence с is_document=true И document_id IS NULL
-- Доказательство-документ = evidence с is_document=false И document_id IS NOT NULL
```

**НО!** Это компромисс. Не рекомендую. ❌

---

## 🚀 МОЯ РЕКОМЕНДАЦИЯ:

**Делать ПРАВИЛЬНО:**
1. Создать отдельную таблицу `documents`
2. Чистое разделение concerns
3. Миграция данных
4. Обновление UI

**Это инвестиция в будущее:**
- Масштабируемость
- Понятность
- Соответствие best practices (Drata/Vanta)
- Готовность к enterprise

**Делаем миграцию 620?** 🎯

