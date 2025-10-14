# Blueprint: Система управления документами для ИБ-комплаенса

**Дата:** 13 октября 2025  
**Авторы:** Software Architect + Product Owner  
**На основе:** Анализ Drata, Vanta, Secureframe + Российское законодательство  
**Stage:** 16+ (стратегический план)

---

## 🌍 АНАЛИЗ МИРОВЫХ ЛИДЕРОВ

### 🏆 Drata (США, $200M ARR, 2024)

**Ключевые фичи для документов:**

1. **Policy Builder** (Конструктор политик) ⭐
   ```
   - Шаблоны политик для SOC 2, ISO 27001, HIPAA
   - Drag-and-drop редактор
   - Автоматическое версионирование
   - Approval workflow (многоступенчатое утверждение)
   - Автоматическое распространение сотрудникам
   - Tracking подтверждения ознакомления
   ```

2. **Automated Evidence Collection**
   ```
   - Автоматический сбор доказательств из интеграций
   - Связь evidence → control
   - Автоматические напоминания о обновлении
   - Expiry tracking (отслеживание истечения)
   ```

3. **Document Lifecycle**
   ```
   - Draft → Review → Approved → Published
   - Automatic archiving
   - Version control
   - Change tracking
   ```

**Что взять для нашей системы:**
- ✅ Policy Builder для российских политик
- ✅ Автоматическое версионирование
- ✅ Workflow утверждения
- ✅ Tracking истечения документов

---

### 🏆 Vanta (США, >7500 клиентов, 2024)

**Ключевые фичи:**

1. **Trust Center** ⭐
   ```
   - Публичная страница с политиками компании
   - Сертификаты соответствия
   - Security posture для клиентов
   - Автоматическое обновление статусов
   ```

2. **Automated Assessments**
   ```
   - Автоматические questionnaires для вендоров
   - Pre-built frameworks (SOC 2, ISO, GDPR)
   - Continuous monitoring
   - Real-time compliance status
   ```

3. **Document Templates**
   ```
   - Библиотека из 100+ шаблонов
   - Customizable для разных industries
   - Automatic mapping к controls
   - Suggested policies для requirements
   ```

**Что взять для нашей системы:**
- ✅ Автоматический mapping шаблонов к требованиям
- ✅ Библиотека шаблонов для РФ регуляторов
- ✅ Real-time status tracking
- ⏳ Trust Center (для Stage 18+)

---

### 🏆 Secureframe, OneTrust, Tugboat Logic

**Общие паттерны:**

1. **Document Categorization**
   ```
   - Policy (политики)
   - Procedure (процедуры)
   - Standard (стандарты)
   - Guideline (руководства)
   - Record (записи)
   ```

2. **Automatic Expiration**
   ```
   - Review cycle (annual, semi-annual)
   - Ownership (document owner)
   - Automatic reminders
   - Escalation при просрочке
   ```

3. **Approval Chains**
   ```
   - Multi-level approvals
   - Parallel/Serial routing
   - Delegation
   - Audit trail
   ```

---

## 🇷🇺 РОССИЙСКАЯ СПЕЦИФИКА (из интернет-анализа)

### 📚 Российские GRC системы

**Kept GRC, Diasoft Q.Risk&Compliance:**

1. **Номенклатура дел**
   ```
   - Классификация по срокам хранения
   - Автоматическое определение срока
   - Контроль передачи в архив
   - Акты уничтожения
   ```

2. **Регистрация документов**
   ```
   - Регистрационный номер
   - Дата регистрации
   - Журнал регистрации
   - Поиск по реквизитам
   ```

3. **Грифы конфиденциальности**
   ```
   - ДСП (Для служебного пользования)
   - Конфиденциально
   - Коммерческая тайна
   - Ограничения доступа
   ```

4. **Контроль исполнения**
   ```
   - Резолюции
   - Сроки исполнения
   - Ответственные
   - Напоминания и эскалация
   ```

---

## 🎯 СИНТЕЗ: РЕКОМЕНДУЕМАЯ АРХИТЕКТУРА

### 📐 Трехуровневая модель (лучший подход)

```
┌─────────────────────────────────────────────────────────────────┐
│ LEVEL 1: ГЛОБАЛЬНЫЕ ШАБЛОНЫ (Templates)                         │
├─────────────────────────────────────────────────────────────────┤
│ knowledge_base_templates                                         │
│ ├─ Политика ИБ                                                  │
│ ├─ Политика ПДн                                                 │
│ ├─ Модель угроз                                                 │
│ └─ Акт категорирования КИИ                                      │
│                                                                  │
│ Характеристики:                                                  │
│ - Общие для всех тенантов (или tenant-specific)                │
│ - .docx/.xlsx файлы для скачивания                             │
│ - Категоризированы по регуляторам                               │
│ - Связаны с requirements через requirement_document_templates   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ LEVEL 2: ТИПЫ ДОКУМЕНТОВ (Document Types) ⭐ НОВОЕ              │
├─────────────────────────────────────────────────────────────────┤
│ document_types (классификация)                                  │
│ ├─ policy-ib (Политика ИБ)                                     │
│ │  ├─ requires_approval: true                                   │
│ │  ├─ default_retention_years: NULL (постоянно)                │
│ │  └─ default_validity_months: 36 (пересмотр раз в 3 года)    │
│ │                                                               │
│ ├─ policy-pdn (Политика ПДн)                                   │
│ │  ├─ regulator: Роскомнадзор                                  │
│ │  ├─ requires_registration: true                               │
│ │  ├─ default_retention_years: 75 (персональные данные)        │
│ │  └─ default_review_months: 12 (ежегодно)                     │
│ │                                                               │
│ ├─ kii-act (Акт категорирования КИИ)                          │
│ │  ├─ regulator: ФСТЭК                                         │
│ │  ├─ requires_number: true, requires_stamp: true              │
│ │  ├─ default_retention_years: 10                              │
│ │  └─ default_validity_months: 60 (актуализация раз в 5 лет)  │
│ │                                                               │
│ └─ threat-model (Модель угроз)                                 │
│    ├─ regulator: ФСТЭК                                         │
│    ├─ default_retention_years: 5                                │
│    └─ default_review_months: 12 (ежегодная актуализация)       │
│                                                                  │
│ Характеристики:                                                  │
│ - Определяют требования к реквизитам                            │
│ - Сроки хранения по умолчанию (ГОСТ Р 7.0.8-2013)             │
│ - Периодичность пересмотра                                      │
│ - Российская специфика (регулятор, категория)                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ LEVEL 3: ДОКУМЕНТЫ (Instances)                                  │
├─────────────────────────────────────────────────────────────────┤
│ evidence (is_document=true)                                      │
│ ├─ Создан из template_id                                        │
│ ├─ Имеет document_type_id                                       │
│ ├─ Проходит lifecycle: draft → active → archived               │
│ ├─ Версионируется через document_versions                       │
│ ├─ Анализируется через document_analyses (AI)                   │
│ ├─ Утверждается через document_approvals (workflow)             │
│ └─ Связан с control_measures через evidence_links              │
│                                                                  │
│ Реквизиты (российская специфика):                               │
│ - document_number: "№123-ИБ"                                    │
│ - document_date: 2025-10-13                                     │
│ - approved_by, approved_at                                       │
│ - effective_from, effective_until                                │
│ - retention_period_years                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 BEST PRACTICES (из анализа конкурентов)

### ✅ Что делают Drata, Vanta, Secureframe:

#### 1. **Policy Builder / Document Generator**

**Drata:**
```typescript
createPolicyFromTemplate({
  template: "Information Security Policy",
  framework: "SOC2",
  customizations: {
    companyName: "ACME Corp",
    reviewCycle: "annual",
    approvers: ["CISO", "CEO"]
  }
})
→ Генерирует готовую политику с placeholders
→ Автоматически создает controls из политики
→ Назначает review cycle
```

**Наша реализация (TO-DO):**
```typescript
createDocumentFromTemplate({
  templateId: "policy-ib",
  documentTypeId: "policy-ib-type",
  customizations: {
    organizationName: "АО Щёкиноазот",
    reviewCycle: "annually",
    requiredApprovers: ["CISO", "CEO"],
    regulatoryBasis: "ФСТЭК Приказ №17"
  }
})
→ Создает evidence с is_document=true
→ Заполняет реквизиты из document_type
→ Создает approval workflow
→ Связывает с requirements
```

---

#### 2. **Automatic Mapping: Templates → Controls**

**Vanta:**
```
Template: "Access Control Policy"
→ Автоматически создает controls:
  - User provisioning
  - Password requirements
  - MFA enforcement
  - Access reviews
→ Генерирует tasks для implementation
→ Назначает owners
```

**Наша реализация (TO-DO):**
```sql
-- requirement_document_templates (связь)
requirement: { code: "КИИ-003", title: "Политика безопасности КИИ" }
→ Рекомендует: kb_template("policy-ib")
→ При создании документа из шаблона:
  → Автоматически предлагает control_templates
  → Создает меры защиты
  → Назначает ответственных
```

---

#### 3. **Review Cycles & Reminders**

**Все лидеры (Drata, Vanta, Secureframe):**
```
Policy:
├─ review_frequency: "annual"
├─ next_review_date: 2025-10-01
├─ owner: "CISO"
└─ Automatic reminders:
   ├─ 30 days before → Email to owner
   ├─ 14 days before → Email + Slack
   ├─ 7 days before → Email + Slack + In-app
   └─ On due date → Escalation to manager
```

**Наша реализация (ЧАСТИЧНО ЕСТЬ):**
```sql
-- УЖЕ ЕСТЬ:
evidence.next_review_date
evidence.validity_period_days
document_actuality_service → calculateActualityStatus()

-- НУЖНО ДОБАВИТЬ:
- Автоматические напоминания (через notification_service)
- Эскалация при просрочке
- Slack/Email интеграция
```

---

#### 4. **Version Control (как в GitHub)**

**Drata/Vanta:**
```
Policy v1.0 (2023-01-01)
├─ Changed: Added MFA requirement
│
Policy v1.1 (2023-06-15)
├─ Changed: Updated password complexity
│
Policy v2.0 (2024-01-01) ← Major change
└─ Changed: Complete restructuring

UI:
├─ Visual diff (side-by-side)
├─ Change highlights
├─ Comment threads
└─ Rollback to any version
```

**Наша реализация (УЖЕ ЕСТЬ! ✅):**
```sql
document_versions ✅
  - version_number, major_version, minor_version
  - is_current
  - change_summary, change_notes

document_diffs ✅
  - diff_type: text, visual, semantic
  - diff_html

document_analyses ✅
  - AI-powered change analysis
  - critical_changes, impact_assessment
```

**Статус:** 🟢 У нас ЛУЧШЕ чем у конкурентов (есть AI!) ⭐

---

#### 5. **Evidence Library & Linking**

**Vanta:**
```
Control: "Password Policy"
└─ Required Evidence:
   ├─ Policy document (PDF) ✅
   ├─ Configuration screenshot ✅
   ├─ Audit log (last 90 days) ✅
   └─ Training records ⏳ Missing

Auto-status:
├─ Compliant: 3/4 evidence collected
└─ Action needed: Upload training records
```

**Наша реализация:**
```sql
control_measures
└─ evidence_links (many-to-many)
   ├─ evidence_id
   ├─ relevance_score
   └─ link_notes

evidence_types (рекомендуемые типы)
```

**Статус:** 🟡 ЕСТЬ базово, нужно улучшить автоматизацию

---

## 🇷🇺 РОССИЙСКАЯ СПЕЦИФИКА (дополнение к мировым практикам)

### 📋 Что НЕ ДЕЛАЮТ западные системы, но НУЖНО в РФ:

#### 1. **Номенклатура дел (ГОСТ Р 7.0.8-2013)**

```sql
CREATE TABLE nomenclature_items (
  id UUID PRIMARY KEY,
  code VARCHAR(50),              -- 01-01, 02-03, etc
  title TEXT,                     -- "Приказы по основной деятельности"
  retention_period_years INTEGER, -- 3, 5, 10, 75, постоянно
  note TEXT,                      -- Основание для срока
  is_permanent BOOLEAN,           -- Постоянное хранение
  
  -- Иерархия
  parent_id UUID REFERENCES nomenclature_items(id),
  level INTEGER,                  -- 1, 2, 3 (раздел, подраздел, дело)
  
  created_at TIMESTAMPTZ
);

ALTER TABLE evidence ADD COLUMN
  nomenclature_item_id UUID REFERENCES nomenclature_items(id);
```

**Примеры:**
```
01-01 Устав организации (постоянно)
01-02 Положения о структурных подразделениях (постоянно)
01-06 Приказы по основной деятельности (постоянно)
02-01 Документы по ИБ (5 лет)
02-02 Политики и положения ИБ (постоянно)
06-01 Переписка (3 года)
```

---

#### 2. **Регистрация документов (обязательно для ОРД)**

```sql
CREATE TABLE document_registry (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES evidence(id),
  
  -- Регистрация
  registry_number VARCHAR(100),   -- №123
  registry_date DATE,              -- от 13.10.2025
  registry_book VARCHAR(100),      -- "Приказы по ИБ"
  
  registered_by UUID REFERENCES users(id),
  registered_at TIMESTAMPTZ,
  
  -- Метаданные
  incoming_number VARCHAR(100),    -- Для входящих
  correspondent VARCHAR(255),       -- От кого/кому
  
  created_at TIMESTAMPTZ
);
```

---

#### 3. **Грифы и ограничения доступа**

```sql
ALTER TABLE evidence ADD COLUMN
  confidentiality_level VARCHAR(50);
  -- 'public', 'internal', 'confidential', 'dsp', 'trade_secret'

CREATE TABLE document_access_restrictions (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES evidence(id),
  user_id UUID REFERENCES users(id),
  access_level VARCHAR(50),  -- read, write, approve
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);
```

---

#### 4. **Связь с НПА (regulatory documents)**

```sql
CREATE TABLE document_regulatory_basis (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES evidence(id),
  regulatory_document_id UUID REFERENCES regulatory_documents(id),
  legal_article_id UUID REFERENCES legal_articles(id),
  
  -- Обоснование
  requirement_text TEXT,
  how_satisfied TEXT,  -- Как документ выполняет требование
  
  created_at TIMESTAMPTZ
);
```

---

## 🏗️ ИТОГОВАЯ АРХИТЕКТУРА (BLUEPRINT)

### 📊 Новые таблицы (TO-DO):

```sql
-- =====================================================
-- МИГРАЦИЯ 620: ТИПЫ ДОКУМЕНТОВ
-- =====================================================

CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),  -- NULL = глобальный
  
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),  -- organizational, technical, regulatory
  
  -- Российская специфика
  regulator VARCHAR(50),           -- ФСТЭК, Роскомнадзор, ФСБ, ЦБ РФ
  requirement_category VARCHAR(50), -- КИИ, ПДн, ГИС
  
  -- Требования (как в Drata)
  requires_approval BOOLEAN DEFAULT true,
  requires_registration BOOLEAN DEFAULT false,
  requires_number BOOLEAN DEFAULT true,
  requires_date BOOLEAN DEFAULT true,
  requires_signature BOOLEAN DEFAULT true,
  requires_stamp BOOLEAN DEFAULT false,
  
  -- Сроки (как в ГОСТ + Vanta)
  default_retention_years INTEGER,
  default_validity_months INTEGER,
  default_review_months INTEGER,
  
  -- UI
  icon VARCHAR(50),
  color VARCHAR(50),
  template_url TEXT,  -- Ссылка на шаблон в KB
  
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, code)
);

-- =====================================================
-- МИГРАЦИЯ 621: СВЯЗЬ ШАБЛОНОВ И ТРЕБОВАНИЙ
-- =====================================================

CREATE TABLE requirement_document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES knowledge_base_templates(id) ON DELETE CASCADE,
  document_type_id UUID REFERENCES document_types(id),
  
  -- Рекомендация (как в Vanta - suggested policies)
  is_recommended BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 50,  -- 0-100
  
  -- Инструкции (как в Drata - implementation guide)
  usage_instructions TEXT,
  customization_notes TEXT,
  
  -- Автоматическая связь с мерами
  auto_create_measures BOOLEAN DEFAULT false,
  suggested_control_template_ids UUID[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(requirement_id, template_id)
);

-- =====================================================
-- МИГРАЦИЯ 622: WORKFLOW УТВЕРЖДЕНИЯ
-- =====================================================

CREATE TYPE approval_status AS ENUM (
  'pending',        -- Ожидает согласования
  'in_progress',    -- В процессе
  'approved',       -- Утвержден
  'rejected',       -- Отклонен
  'cancelled'       -- Отменен
);

CREATE TABLE document_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_id UUID NOT NULL REFERENCES evidence(id),
  version_id UUID REFERENCES document_versions(id),
  
  -- Workflow (как в Drata)
  workflow_type VARCHAR(50) DEFAULT 'serial',  -- serial, parallel
  required_approvers UUID[],
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 1,
  
  status approval_status DEFAULT 'pending',
  
  -- Результаты
  approved_by UUID[],
  rejected_by UUID,
  rejection_reason TEXT,
  
  -- SLA
  due_date DATE,
  escalation_sent BOOLEAN DEFAULT false,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE document_approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID NOT NULL REFERENCES document_approvals(id) ON DELETE CASCADE,
  
  step_number INTEGER NOT NULL,
  approver_id UUID NOT NULL REFERENCES users(id),
  approver_role VARCHAR(100),  -- CISO, CEO, Legal, etc
  
  status approval_status DEFAULT 'pending',
  comments TEXT,
  
  notified_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  
  UNIQUE(approval_id, step_number)
);

-- =====================================================
-- РАСШИРЕНИЕ evidence
-- =====================================================

ALTER TABLE evidence ADD COLUMN IF NOT EXISTS
  document_type_id UUID REFERENCES document_types(id),
  template_id UUID REFERENCES knowledge_base_templates(id);

-- Индексы
CREATE INDEX idx_evidence_document_type ON evidence(document_type_id) 
  WHERE is_document = true;
CREATE INDEX idx_evidence_template ON evidence(template_id) 
  WHERE template_id IS NOT NULL;
```

---

## 🤖 AI & AUTOMATION (планы)

### На основе Drata/Vanta + наши идеи:

#### 1. **Auto-suggestion документов**

```typescript
// При создании меры
measure = { title: "Внедрить парольную политику" }

AI анализирует:
→ "Нужна Политика паролей"
→ Предлагает: template("policy-passwords")
→ Создает draft документа
→ Автоматически заполняет поля
```

#### 2. **Auto-update при изменении НПА**

```typescript
// Regulatory document обновился
regulatory_doc = { code: "152-ФЗ", version: "2024-10-01" }

AI анализирует:
→ Находит затронутые документы
→ "Ваша Политика ПДн устарела"
→ Предлагает создать новую версию
→ Выделяет что изменилось в НПА
→ Предлагает изменения в политике
```

#### 3. **Smart validation**

```typescript
// Загружаем документ "Политика ИБ"
document_type = "policy-ib"

AI проверяет:
✅ Есть ли номер документа?
✅ Есть ли дата утверждения?
✅ Есть ли подпись руководителя?
✅ Соответствует ли структура шаблону?
❌ Отсутствует раздел "Ответственность"
→ Предлагает дополнения
```

---

## 🎯 ROADMAP ВНЕДРЕНИЯ

### 🔴 Stage 16 (текущая, 2-3 дня):

**Приоритет: Базовая типизация**

- [ ] Миграция 620: создать `document_types`
- [ ] Seed: заполнить базовыми типами (policy, order, act, etc)
- [ ] Миграция 621: создать `requirement_document_templates`
- [ ] UI: добавить выбор типа документа при загрузке
- [ ] API: автоматически заполнять поля из document_type

**Результат:**
- Правильная классификация документов
- Автоматические реквизиты
- Сроки хранения по умолчанию

---

### 🟡 Stage 17 (1-2 недели):

**Приоритет: Workflow и автоматизация**

- [ ] Миграция 622: `document_approvals` + `approval_steps`
- [ ] Service: ApprovalWorkflowService
- [ ] UI: Approval dashboard
- [ ] Notifications: напоминания о согласовании
- [ ] Автоматические рекомендации шаблонов

**Результат:**
- Многоступенчатое утверждение
- Автоматизация создания из шаблонов
- Связь документов → меры

---

### 🟢 Stage 18 (2-4 недели):

**Приоритет: Российская специфика**

- [ ] Номенклатура дел
- [ ] Регистрация документов
- [ ] Грифы конфиденциальности
- [ ] Контроль исполнения
- [ ] AI-валидация документов

**Результат:**
- Полноценная СЭД для ИБ
- Соответствие ГОСТ Р 7.0.8-2013
- Интеграция с 1С (опционально)

---

### 🔵 Stage 19+ (будущее):

**Приоритет: Advanced AI**

- [ ] Auto-update при изменении НПА
- [ ] Генерация документов из templates с AI
- [ ] Смысловой поиск по документам
- [ ] Автоматическое обезличивание ПДн
- [ ] Trust Center для клиентов (как в Vanta)

---

## 📊 СРАВНИТЕЛЬНАЯ ТАБЛИЦА

| Фича | Drata | Vanta | Наша система (сейчас) | Наша система (TO-BE) |
|------|-------|-------|----------------------|---------------------|
| **Версионирование** | ✅ Basic | ✅ Basic | ✅ Advanced (AI!) | ✅ Advanced |
| **Policy Builder** | ✅ | ✅ | ❌ | ✅ Stage 17 |
| **Auto-mapping templates** | ✅ | ✅ | ❌ | ✅ Stage 16 |
| **Approval workflow** | ✅ | ✅ | ❌ | ✅ Stage 17 |
| **Evidence linking** | ✅ | ✅ | ✅ | ✅ |
| **Review cycles** | ✅ | ✅ | ✅ Partial | ✅ Stage 17 |
| **AI analysis** | ❌ | ❌ | ✅ **У НАС ЛУЧШЕ!** | ✅ |
| **Номенклатура дел** | ❌ | ❌ | ❌ | ✅ Stage 18 |
| **Регистрация (РФ)** | ❌ | ❌ | ❌ | ✅ Stage 18 |
| **Грифы (ДСП)** | ❌ | ❌ | ❌ | ✅ Stage 18 |

---

## 💡 РЕКОМЕНДАЦИИ PRODUCT OWNER

### ✅ Конкурентные преимущества (уже есть):

1. **AI-анализ документов** - У Drata/Vanta НЕТ! ⭐
2. **Semantic diff** - уникально
3. **Версионирование на уровне GitHub** - детально
4. **Российская локализация** - полная

### ➕ Что добавить для паритета с лидерами:

1. **Policy Builder** (Stage 17)
   - Генерация из шаблонов
   - Placeholder substitution
   - Автоматические controls

2. **Auto-mapping** (Stage 16-17)
   - Рекомендация шаблонов
   - Связь с мерами
   - Smart suggestions

3. **Approval Workflow** (Stage 17)
   - Многоступенчатое
   - Параллельное/последовательное
   - Email/Slack уведомления

### 🇷🇺 Что добавить для российского рынка:

1. **Номенклатура дел** (Stage 18)
2. **Регистрация документов** (Stage 18)
3. **ДСП и грифы** (Stage 18)
4. **Интеграция с 1С** (Stage 19)

---

## 🎯 ФИНАЛЬНАЯ РЕКОМЕНДАЦИЯ

### ✅ Stage 16 (СЕЙЧАС):

**Создать минимальный набор для работы:**

```sql
1. document_types (классификация) ⭐
2. requirement_document_templates (рекомендации) ⭐
3. ALTER evidence ADD document_type_id
4. ALTER evidence ADD template_id
```

**Время:** 1-2 дня  
**Ценность:** КРИТИЧЕСКАЯ 🔥🔥🔥

**Результат:**
- Правильная типизация документов
- Автоматические рекомендации шаблонов
- Реквизиты из типа
- Сроки по умолчанию

---

### ⏭️ Stage 17 (СЛЕДУЮЩАЯ):

**Workflow и автоматизация:**
- Approval workflow
- Policy builder
- Auto-create from templates
- Notifications

---

## 📚 ИТОГО

**Наша система уже имеет:**
- ✅ 70% функционала Drata/Vanta
- ✅ ЛУЧШЕ в AI-анализе
- ✅ ЛУЧШЕ в версионировании
- ✅ Готова к российской специфике

**Нужно добавить:**
- ⏳ Типизацию документов (document_types)
- ⏳ Связь шаблонов (requirement_document_templates)
- ⏳ Workflow утверждения

**После этого будем:**
- 🏆 На уровне Drata/Vanta
- 🇷🇺 + Российская специфика
- 🤖 + AI преимущество

---

**Делаем сейчас миграции 620-621?** 🚀

