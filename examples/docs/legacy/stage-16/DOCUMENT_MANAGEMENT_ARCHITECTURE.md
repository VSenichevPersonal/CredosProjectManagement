# Архитектура управления документами в системе ИБ-комплаенса

**Дата:** 13 октября 2025  
**Роли:** Software Architect + Product Owner  
**Stage:** 16 (открытая фаза)

---

## 📊 ТЕКУЩАЯ АРХИТЕКТУРА (AS-IS)

### 🏗️ Основная модель данных

```
evidence (универсальная таблица)
├─ is_document = FALSE → Обычное доказательство (скриншот, лог, файл)
└─ is_document = TRUE  → Документ с версионированием
   ├─ document_versions (история версий)
   ├─ document_analyses (AI анализ изменений)
   └─ document_diffs (визуальное сравнение)
```

**Ключевая концепция:**  
✅ **НЕТ отдельной таблицы `documents`!**  
✅ Документы = `evidence` с флагом `is_document=true`

---

### 📋 Структура таблиц

#### 1. **evidence** (основная таблица)

```sql
-- Базовые поля (для всех evidence)
id, tenant_id, organization_id
file_name, file_url, file_type, file_size, storage_path
title, description, tags
status (pending, approved, rejected, archived)
uploaded_by, uploaded_at

-- Связи
compliance_record_id, requirement_id, control_id
evidence_type_id  -- FK to evidence_types

-- Для документов (is_document = true)
is_document BOOLEAN
current_version_id UUID
validity_period_days INTEGER
expires_at TIMESTAMPTZ
next_review_date DATE
actuality_status (ok, needs_update, expired, not_relevant)

-- Жизненный цикл (Stage 16, миграция 610)
lifecycle_status (draft, active, archived, destroyed)
document_number VARCHAR(100)
document_date DATE
effective_from DATE
effective_until DATE
retention_period_years INTEGER
destruction_date DATE
approved_at DATE
approved_by UUID
```

#### 2. **document_versions** (версии документов)

```sql
id, tenant_id, document_id
version_number TEXT (v1.0, v1.1, v2.0)
major_version, minor_version INTEGER
file_name, file_url, file_type, file_size, storage_path
change_summary, change_notes TEXT
is_current BOOLEAN
created_by, created_at
```

**Логика:**
- Только ОДИН `is_current=true` на документ
- Trigger автоматически обновляет `evidence.current_version_id`

#### 3. **document_analyses** (AI анализ)

```sql
id, tenant_id, document_id
from_version_id, to_version_id
summary TEXT
critical_changes JSONB
impact_assessment TEXT
recommendations JSONB
llm_provider (openai, anthropic, grok, local)
llm_model, tokens_used, processing_time_ms
status (pending, processing, completed, failed)
```

**Возможности:**
- AI сравнение версий
- Выявление критичных изменений
- Оценка влияния на комплаенс
- Рекомендации по действиям

#### 4. **document_diffs** (визуальное сравнение)

```sql
id, tenant_id, document_id
from_version_id, to_version_id
diff_type (text, visual, semantic)
diff_data JSONB
diff_html TEXT
additions_count, deletions_count, modifications_count
```

#### 5. **evidence_types** (типизация доказательств)

```sql
id, code, title, description
file_format_regex
icon, sort_order
is_active
```

**Примеры:**
- `policy` - Политика/Положение
- `procedure` - Процедура/Инструкция
- `report` - Отчет
- `certificate` - Сертификат
- `log` - Журнал
- `config` - Конфигурация

#### 6. **knowledge_base_templates** (шаблоны документов)

```sql
id, title, description
category (policy, instruction, act, report, form)
regulator (ФСТЭК, Роскомнадзор, ФСБ...)
requirement_type (КИИ, ПДн, ГИС...)
file_url TEXT
file_type
downloads, created_at
```

**Примеры:**
- Политика ИБ
- Политика ПДн
- Акт категорирования КИИ
- Модель угроз ПДн
- Инструкция СКЗИ

---

## 🎯 ТЕКУЩИЕ ВОЗМОЖНОСТИ

### ✅ Что уже работает:

1. **Версионирование документов**
   - Автоматическая нумерация (v1.0, v1.1, v2.0)
   - Major/minor версии
   - История изменений
   - Откат к предыдущей версии

2. **AI-анализ изменений**
   - Поддержка OpenAI, Anthropic, Grok
   - Автоматическое выявление критичных изменений
   - Оценка влияния на комплаенс
   - Рекомендации по действиям

3. **Визуальное сравнение**
   - Text diff (построчное)
   - Visual diff (rendered)
   - Semantic diff (смысловое)
   - HTML-визуализация

4. **Отслеживание актуальности**
   - Срок действия документа
   - Даты пересмотра
   - Автоматическое изменение статуса
   - Уведомления (через DocumentActualityService)

5. **Шаблоны документов**
   - 10 готовых шаблонов в KB
   - Скачивание .docx/.xlsx
   - Категоризация по регуляторам
   - База знаний со статьями

6. **Типизация доказательств**
   - 9 типов evidence
   - Рекомендуемые типы для требований
   - Связь с control_measure_templates
   - Валидация форматов файлов

---

## ⚠️ ЧТО НЕ ХВАТАЕТ (GAP ANALYSIS)

### ❌ Критические пробелы:

#### 1. **Типизация документов слабая**

**Проблема:**
```typescript
// Сейчас:
document.evidenceTypeId → FK to evidence_types

// Но evidence_types это про ВСЕ доказательства (логи, скриншоты...)
// Нет специализации для ДОКУМЕНТОВ!
```

**Нужно:**
```sql
CREATE TABLE document_types (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE,      -- 'policy', 'order', 'instruction', 'act', ...
  name VARCHAR(255),             -- 'Политика', 'Приказ', 'Инструкция'
  category VARCHAR(100),         -- 'organizational', 'technical', 'regulatory'
  
  -- Российская специфика
  regulator VARCHAR(50),         -- ФСТЭК, Роскомнадзор, ФСБ
  requirement_category VARCHAR(50), -- КИИ, ПДн, ГИС
  
  -- Требования к документу
  requires_approval BOOLEAN,     -- Нужно ли утверждение
  requires_registration BOOLEAN, -- Нужна ли регистрация
  requires_number BOOLEAN,       -- Обязателен ли номер
  
  -- Сроки хранения по умолчанию
  default_retention_years INTEGER,
  
  -- Metadata
  icon VARCHAR(50),
  color VARCHAR(50),
  sort_order INTEGER
);
```

**Примеры:**
```sql
INSERT INTO document_types VALUES
  ('policy-ib', 'Политика ИБ', 'organizational', NULL, 'Общее', true, false, true, NULL, ...),
  ('policy-pdn', 'Политика ПДн', 'organizational', 'Роскомнадзор', 'ПДн', true, true, true, 75, ...),
  ('order-appoint', 'Приказ о назначении', 'organizational', NULL, 'Общее', true, true, true, 5, ...),
  ('kii-act', 'Акт категорирования КИИ', 'regulatory', 'ФСТЭК', 'КИИ', true, true, true, 10, ...),
  ('threat-model', 'Модель угроз', 'technical', 'ФСТЭК', 'ПДн', true, false, false, 5, ...),
  ('incident-report', 'Отчет об инциденте', 'regulatory', 'ФСТЭК', 'КИИ', false, true, true, 5, ...);
```

#### 2. **Нет связи шаблонов → документов**

**Проблема:**
```
knowledge_base_templates (шаблоны) ❌← →❌ evidence (документы)

Нет связи!
```

**Нужно:**
```sql
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS
  template_id UUID REFERENCES knowledge_base_templates(id);

-- Или создать отдельную таблицу
CREATE TABLE document_template_usages (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES evidence(id),
  template_id UUID REFERENCES knowledge_base_templates(id),
  customizations JSONB,  -- Какие изменения внесли
  created_at TIMESTAMPTZ
);
```

#### 3. **Нет workflow утверждения**

**Проблема:**
```
draft → ??? → active

Как документ утверждается?
Кто может утверждать?
Многоступенчатое согласование?
```

**Нужно:**
```sql
CREATE TABLE document_approvals (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES evidence(id),
  version_id UUID REFERENCES document_versions(id),
  
  -- Согласование
  required_approvers UUID[],     -- Кто должен согласовать
  current_approver UUID,          -- Текущий согласующий
  approved_by UUID[],             -- Кто уже согласовал
  rejected_by UUID,               -- Кто отклонил
  
  status VARCHAR(50),             -- pending, approved, rejected
  comments TEXT,
  
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

#### 4. **Нет умных рекомендаций по шаблонам**

**Проблема:**
```typescript
// Создаю меру "Политика ИБ"
// Система НЕ предлагает подходящий шаблон из KB!

requirement: { category: 'КИИ', title: 'Политика ИБ' }
// Должна предложить: knowledge_base_templates[policy-ib]
```

**Нужно:**
```sql
CREATE TABLE requirement_document_templates (
  id UUID PRIMARY KEY,
  requirement_id UUID REFERENCES requirements(id),
  template_id UUID REFERENCES knowledge_base_templates(id),
  
  is_recommended BOOLEAN,
  priority INTEGER,
  usage_instructions TEXT
);
```

#### 5. **Нет автоматизации актуализации**

**Проблема:**
```
Модель угроз ПДн: нужно актуализировать раз в год
→ Система знает next_review_date
→ Но НЕТ механизма создания новой версии!
```

**Нужно:**
```typescript
// При наступлении next_review_date
→ Создать задачу на актуализацию
→ Предложить создать новую версию
→ AI-помощник для обновления (detect changes in regulations)
```

---

## 🎯 РЕКОМЕНДУЕМАЯ АРХИТЕКТУРА (TO-BE)

### 🏛️ Принцип: Трехуровневая модель

```
LEVEL 1: ШАБЛОНЫ (Глобальные)
├─ knowledge_base_templates
├─ Общие для всех тенантов
├─ Скачиваются как .docx
└─ Категоризированы по регуляторам

LEVEL 2: ТИПЫ ДОКУМЕНТОВ (Классификация)
├─ document_types (НОВОЕ!)
├─ Определяют требования к документу
├─ Связаны с регуляторами
└─ Определяют сроки хранения

LEVEL 3: ДОКУМЕНТЫ (Инстансы)
├─ evidence (is_document=true)
├─ Принадлежат организации/тенанту
├─ Версионируются
├─ Проходят lifecycle
└─ Связаны с мерами и требованиями
```

---

### 📐 Предлагаемая схема

```sql
-- =====================================================
-- НОВАЯ ТАБЛИЦА: document_types
-- =====================================================

CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),  -- NULL = глобальный тип
  
  -- Идентификация
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),  -- organizational, technical, regulatory
  
  -- Российская специфика
  regulator VARCHAR(50),          -- ФСТЭК, Роскомнадзор, ФСБ, ЦБ РФ
  requirement_category VARCHAR(50), -- КИИ, ПДн, ГИС, Криптография
  
  -- Требования к документу
  requires_approval BOOLEAN DEFAULT true,
  requires_registration BOOLEAN DEFAULT false,
  requires_number BOOLEAN DEFAULT true,
  requires_date BOOLEAN DEFAULT true,
  requires_signature BOOLEAN DEFAULT true,
  requires_stamp BOOLEAN DEFAULT false,
  
  -- Сроки хранения (ГОСТ Р 7.0.8-2013)
  default_retention_years INTEGER,  -- 3, 5, 10, 75, NULL=постоянно
  retention_note TEXT,              -- Основание для срока
  
  -- Сроки действия и актуализации
  default_validity_months INTEGER,  -- Срок действия
  default_review_months INTEGER,    -- Периодичность пересмотра
  
  -- UI
  icon VARCHAR(50),
  color VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, code)  -- Уникальность в рамках тенанта
);

-- Индексы
CREATE INDEX idx_document_types_category ON document_types(category);
CREATE INDEX idx_document_types_regulator ON document_types(regulator);
CREATE INDEX idx_document_types_active ON document_types(is_active) WHERE is_active = true;

-- =====================================================
-- РАСШИРЕНИЕ evidence ДЛЯ ДОКУМЕНТОВ
-- =====================================================

ALTER TABLE evidence ADD COLUMN IF NOT EXISTS
  document_type_id UUID REFERENCES document_types(id);  -- ⭐ КЛЮЧЕВОЕ ПОЛЕ

-- Индекс
CREATE INDEX idx_evidence_document_type ON evidence(document_type_id) 
  WHERE is_document = true;

-- =====================================================
-- СВЯЗЬ ШАБЛОНОВ И ТРЕБОВАНИЙ
-- =====================================================

CREATE TABLE requirement_document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES knowledge_base_templates(id) ON DELETE CASCADE,
  document_type_id UUID REFERENCES document_types(id),
  
  -- Рекомендация
  is_recommended BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,  -- 0-100
  usage_instructions TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(requirement_id, template_id)
);

-- =====================================================
-- WORKFLOW УТВЕРЖДЕНИЯ ДОКУМЕНТОВ
-- =====================================================

CREATE TABLE document_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_id UUID NOT NULL REFERENCES evidence(id),
  version_id UUID REFERENCES document_versions(id),
  
  -- Workflow
  required_approvers UUID[],      -- Массив ID пользователей
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 1,
  
  -- Статус
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- pending, in_progress, approved, rejected, cancelled
  
  -- Результаты
  approved_by UUID[],
  rejected_by UUID,
  rejection_reason TEXT,
  
  -- Timestamps
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE document_approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID NOT NULL REFERENCES document_approvals(id) ON DELETE CASCADE,
  
  step_number INTEGER NOT NULL,
  approver_id UUID NOT NULL REFERENCES users(id),
  
  status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected, skipped
  comments TEXT,
  
  approved_at TIMESTAMPTZ,
  
  UNIQUE(approval_id, step_number)
);
```

---

## 🎨 BEST PRACTICES (Анализ конкурентов + российская специфика)

### 📚 Международные практики:

#### **Drata / Vanta / Secureframe:**
```
✅ Document Library с типизацией
✅ Версионирование
✅ AI-анализ изменений
✅ Автоматические напоминания
✅ Связь документов с controls
✅ Политики срока действия
```

#### **SharePoint / Confluence:**
```
✅ Иерархическая структура
✅ Метаданные и теги
✅ Workflow утверждения
✅ Контроль версий
✅ Права доступа
```

### 🇷🇺 Российская специфика:

#### **Системы электронного документооборота (СЭД):**

**1С:Документооборот, Directum:**
```
✅ Реквизиты документа (номер, дата)
✅ Грифы конфиденциальности (ДСП, Конфиденциально)
✅ Маршруты согласования
✅ Регистрация документов
✅ Номенклатура дел
✅ Контроль исполнения
✅ Сроки хранения (по номенклатуре)
```

#### **Требования ГОСТ Р 7.0.8-2013:**
```
✅ Регистрация документов
✅ Контроль исполнения
✅ Номенклатура дел
✅ Сроки хранения
✅ Уничтожение/передача в архив
```

#### **152-ФЗ (ПДн):**
```
✅ Обработка и хранение согласно политике
✅ Уничтожение по достижении цели
✅ Обезличивание
✅ Контроль доступа
```

---

## 🚀 РЕКОМЕНДАЦИИ АРХИТЕКТОРА

### ✅ ЧТО ОСТАВИТЬ КАК ЕСТЬ:

1. **evidence как универсальный контейнер** ✅
   - Гибко
   - Уже работает
   - Не нужна отдельная таблица documents

2. **document_versions для версионирования** ✅
   - Продуманная схема
   - Триггеры работают
   - AI-анализ готов

3. **knowledge_base_templates для шаблонов** ✅
   - Хорошая база
   - Можно расширять

### ➕ ЧТО ДОБАВИТЬ (Приоритеты):

#### 🔴 **ВЫСОКИЙ ПРИОРИТЕТ** (Stage 16-17):

**1. Создать `document_types` (специализация типов документов)**
```sql
-- Миграция 620
CREATE TABLE document_types (...);
ALTER TABLE evidence ADD COLUMN document_type_id UUID;
```

**Зачем:**
- Специализация для документов (не путать с evidence_types)
- Требования к реквизитам (номер, дата, печать)
- Сроки хранения по умолчанию
- Российская специфика (регулятор, категория)

**Время:** 1 день

---

**2. Связать шаблоны с requirements**
```sql
-- Миграция 621
CREATE TABLE requirement_document_templates (...);
```

**Зачем:**
- Рекомендации шаблонов при создании меры
- "Для КИИ-002 нужен Акт категорирования" → предложить шаблон
- Автоматизация

**Время:** 0.5 дня

---

**3. Workflow утверждения документов**
```sql
-- Миграция 622
CREATE TABLE document_approvals (...);
CREATE TABLE document_approval_steps (...);
```

**Зачем:**
- Обязательно для российского комплаенса
- Многоступенчатое согласование
- Аудит утверждений

**Время:** 2 дня

---

#### 🟡 **СРЕДНИЙ ПРИОРИТЕТ** (Stage 18):

**4. Регистрация документов**
```sql
CREATE TABLE document_registry (
  id UUID PRIMARY KEY,
  document_id UUID,
  registry_number VARCHAR(100),
  registry_date DATE,
  registry_book VARCHAR(100),  -- Какой журнал
  registered_by UUID
);
```

**5. Номенклатура дел (ГОСТ)**
```sql
CREATE TABLE nomenclature_items (
  id UUID PRIMARY KEY,
  code VARCHAR(50),
  title TEXT,
  retention_period_years INTEGER,
  note TEXT
);

ALTER TABLE evidence ADD COLUMN nomenclature_item_id UUID;
```

**6. Расширение AI-анализа**
```typescript
// Автоматический анализ соответствия НПА
// Выявление устаревших ссылок на законы
// Предложения по актуализации
```

---

#### 🟢 **НИЗКИЙ ПРИОРИТЕТ** (Stage 19+):

**7. Интеграция с внешними СЭД (1С, Directum)**
**8. Автоматическое обезличивание ПДн**
**9. Электронная подпись документов**
**10. Экспорт в форматы регуляторов**

---

## 📋 ИТОГОВАЯ ТАБЛИЦА СВЯЗЕЙ (TO-BE)

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCUMENT MANAGEMENT                       │
└─────────────────────────────────────────────────────────────┘

requirements
├─ requirement_document_templates ─→ knowledge_base_templates
│  └─ Рекомендуемые шаблоны
│
└─ compliance_records
   ├─ control_measures
   │  └─ evidence_links ─→ evidence (documents)
   │                          ├─ document_type_id ─→ document_types ⭐
   │                          ├─ template_id ─→ kb_templates ⭐
   │                          ├─ document_versions
   │                          ├─ document_analyses (AI)
   │                          └─ document_approvals ⭐
   │
   └─ evidence (generic)
      └─ evidence_type_id ─→ evidence_types

knowledge_base
├─ kb_articles (руководства)
└─ kb_templates (шаблоны .docx)
```

---

## 🎯 РЕКОМЕНДАЦИИ PRODUCT OWNER

### ✅ План на Stage 16 (текущая):

**Завершить базовую модель:**
- [x] Временные параметры мер
- [x] Жизненный цикл документов (lifecycle_status)
- [x] Исправление критичных багов
- [ ] **Создать `document_types`** (приоритет!)
- [ ] **Связать шаблоны с requirements**

**Время:** 2-3 дня  
**Ценность:** Высокая 🔥

---

### 📅 План на Stage 17:

**Workflow и автоматизация:**
- [ ] Workflow утверждения документов
- [ ] Автоматические рекомендации шаблонов
- [ ] Дашборд документов
- [ ] Уведомления об актуализации

**Время:** 1-2 недели  
**Ценность:** Критичная для enterprise 🔥🔥

---

### 🔮 План на Stage 18:

**Интеграция и расширения:**
- [ ] Регистрация документов
- [ ] Номенклатура дел
- [ ] Расширенный AI-анализ
- [ ] Интеграция с 1С

**Время:** 2-4 недели  
**Ценность:** Для крупных клиентов

---

## 💡 КЛЮЧЕВЫЕ ИНСАЙТЫ

### ✅ Что сделано правильно:

1. **evidence как универсальный контейнер** - отличное решение!
2. **Версионирование продумано** - триггеры, AI, diff
3. **Отделение шаблонов от документов** - правильная абстракция
4. **AI-ready архитектура** - готова к LLM

### ⚠️ Что нужно улучшить:

1. **Типизация документов слабая** - нужен document_types
2. **Нет связи шаблонов** - не автоматизировано
3. **Нет workflow** - критично для РФ
4. **Нет регистрации** - нужно для комплаенса

### 🎯 Приоритет #1:

**Создать `document_types` + связать с шаблонами**

Это даст:
- Правильную типизацию
- Автоматические рекомендации
- Сроки хранения
- Требования к реквизитам

**Время на реализацию:** 1 день  
**ROI:** Очень высокий 🚀

---

## 🤔 РЕШЕНИЕ

Продолжить Stage 16 с:
1. ✅ Миграция 620: создание `document_types`
2. ✅ Миграция 621: связь шаблонов с requirements
3. ✅ Обновление TypeScript типов
4. ✅ Базовый UI для выбора типа документа

**Делаем сейчас?** 🚀

