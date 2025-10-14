# Модель целостности данных: Требования и Записи соответствия

## Обзор архитектуры

Система построена на принципе **Continuous Compliance** с поддержкой двух режимов исполнения:
- **Strict (Жёсткий)** - типовые меры и типы доказательств предопределены
- **Flexible (Гибкий)** - организация может добавлять кастомные меры и типы доказательств

---

## 1. Иерархия сущностей

\`\`\`
Tenant (Тенант)
  └── Regulatory Framework (Нормативная база)
       └── Regulatory Document (Нормативный документ)
            └── Requirement (Требование)
                 ├── Control Measure Templates (Шаблоны мер)
                 │    └── Recommended Evidence Types (Рекомендуемые типы доказательств)
                 │
                 └── Compliance Records (Записи соответствия)
                      └── Control Measures (Конкретные меры)
                           └── Evidence Links (Связи с доказательствами)
                                └── Evidence (Доказательства)
\`\`\`

---

## 2. Основные сущности

### 2.1 Requirement (Требование)

**Таблица:** `requirements`

**Ключевые поля:**
\`\`\`sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
document_id UUID REFERENCES regulatory_documents(id)
code TEXT NOT NULL
title TEXT NOT NULL
description TEXT NOT NULL
category TEXT
criticality criticality_level NOT NULL DEFAULT 'medium'
status requirement_status NOT NULL DEFAULT 'active'

-- Режимы исполнения
measure_mode execution_mode DEFAULT 'flexible'
evidence_type_mode execution_mode DEFAULT 'flexible'

-- Связи с шаблонами
suggested_control_measure_template_ids UUID[]

-- Применимость
regulatory_framework_id UUID REFERENCES regulatory_frameworks(id)
periodicity_id UUID REFERENCES periodicities(id)
verification_method_id UUID REFERENCES verification_methods(id)
responsible_role_id UUID REFERENCES responsible_roles(id)
\`\`\`

**Ограничения целостности:**
- ✅ `tenant_id` NOT NULL - каждое требование принадлежит тенанту
- ✅ `code` NOT NULL - уникальный код требования
- ✅ `title` NOT NULL - название обязательно
- ✅ `description` NOT NULL - описание обязательно
- ✅ `status` NOT NULL - статус всегда определён
- ✅ `measure_mode` DEFAULT 'flexible' - режим по умолчанию
- ⚠️ **УДАЛЕНО:** `allowed_evidence_type_ids` (миграция 400)

**Foreign Keys:**
- `document_id` → `regulatory_documents(id)` ON DELETE CASCADE
- `parent_id` → `requirements(id)` ON DELETE SET NULL
- `regulator_id` → `regulators(id)` ON DELETE SET NULL
- `regulatory_framework_id` → `regulatory_frameworks(id)` ON DELETE SET NULL
- `periodicity_id` → `periodicities(id)` ON DELETE SET NULL
- `verification_method_id` → `verification_methods(id)` ON DELETE SET NULL
- `responsible_role_id` → `responsible_roles(id)` ON DELETE SET NULL
- `created_by` → `users(id)` ON DELETE RESTRICT

**Индексы:**
\`\`\`sql
idx_requirements_tenant ON requirements(tenant_id)
idx_requirements_document ON requirements(document_id)
idx_requirements_parent ON requirements(parent_id)
idx_requirements_status ON requirements(status)
idx_requirements_regulatory_framework ON requirements(regulatory_framework_id)
\`\`\`

**RLS Policies:**
- ✅ Authenticated users can view all requirements
- ✅ Tenant isolation через JWT claims

---

### 2.2 Control Measure Templates (Шаблоны мер)

**Таблица:** `control_measure_templates`

**Ключевые поля:**
\`\`\`sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE
code VARCHAR(50) NOT NULL
title VARCHAR(500) NOT NULL
description TEXT
implementation_guide TEXT
estimated_effort VARCHAR(50)

-- Рекомендуемые типы доказательств
recommended_evidence_type_ids UUID[]

sort_order INTEGER DEFAULT 0
is_active BOOLEAN DEFAULT true
\`\`\`

**Ограничения целостности:**
- ✅ `tenant_id` NOT NULL
- ✅ `requirement_id` NOT NULL - шаблон всегда привязан к требованию
- ✅ `code` NOT NULL
- ✅ `title` NOT NULL
- ✅ UNIQUE(requirement_id, code) - уникальность кода в рамках требования
- ✅ `recommended_evidence_type_ids` - массив UUID типов доказательств

**Foreign Keys:**
- `requirement_id` → `requirements(id)` ON DELETE CASCADE
- `created_by` → `users(id)` ON DELETE SET NULL

**Индексы:**
\`\`\`sql
idx_control_measure_templates_requirement ON control_measure_templates(requirement_id)
idx_control_measure_templates_active ON control_measure_templates(is_active)
idx_control_measure_templates_recommended_evidence USING GIN (recommended_evidence_type_ids)
\`\`\`

**RLS Policies:**
- ✅ Authenticated users can view active templates
- ✅ Tenant isolation

---

### 2.3 Compliance Records (Записи соответствия)

**Таблица:** `compliance_records`

**Ключевые поля:**
\`\`\`sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE
organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE

status compliance_status NOT NULL DEFAULT 'not_started'
assigned_to UUID REFERENCES users(id)
completed_at TIMESTAMPTZ
reviewed_by UUID REFERENCES users(id)
reviewed_at TIMESTAMPTZ
comments TEXT
next_review_date DATE

-- Связи
control_measure_ids UUID[]
evidence_ids UUID[]

UNIQUE(requirement_id, organization_id)
\`\`\`

**Ограничения целостности:**
- ✅ `tenant_id` NOT NULL
- ✅ `requirement_id` NOT NULL - запись всегда привязана к требованию
- ✅ `organization_id` NOT NULL - запись всегда привязана к организации
- ✅ `status` NOT NULL - статус всегда определён
- ✅ **UNIQUE(requirement_id, organization_id)** - одна запись на пару требование-организация

**Foreign Keys:**
- `requirement_id` → `requirements(id)` ON DELETE CASCADE
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `assigned_to` → `users(id)` ON DELETE SET NULL
- `reviewed_by` → `users(id)` ON DELETE SET NULL

**Индексы:**
\`\`\`sql
idx_compliance_tenant ON compliance_records(tenant_id)
idx_compliance_requirement ON compliance_records(requirement_id)
idx_compliance_organization ON compliance_records(organization_id)
idx_compliance_status ON compliance_records(status)
\`\`\`

**RLS Policies:**
- ✅ Users can view their organization compliance records
- ✅ Tenant isolation через JWT claims

---

### 2.4 Control Measures (Конкретные меры)

**Таблица:** `control_measures`

**Ключевые поля:**
\`\`\`sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL

-- Связи
compliance_record_id UUID NOT NULL REFERENCES compliance_records(id) ON DELETE CASCADE
requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE
organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
template_id UUID REFERENCES control_measure_templates(id) ON DELETE SET NULL

-- Основная информация
title VARCHAR(500) NOT NULL
description TEXT
implementation_notes TEXT

-- Статус
status VARCHAR(50) NOT NULL DEFAULT 'planned'
implementation_date DATE
responsible_user_id UUID REFERENCES users(id)

-- Флаги для strict режима
from_template BOOLEAN DEFAULT false
is_locked BOOLEAN DEFAULT false
\`\`\`

**Ограничения целостности:**
- ✅ `tenant_id` NOT NULL
- ✅ `compliance_record_id` NOT NULL - мера всегда привязана к записи соответствия
- ✅ `requirement_id` NOT NULL - мера всегда привязана к требованию
- ✅ `organization_id` NOT NULL - мера всегда привязана к организации
- ✅ `title` NOT NULL
- ✅ `status` NOT NULL
- ✅ `from_template` - флаг, что мера создана из шаблона
- ✅ `is_locked` - флаг, что мера заблокирована для редактирования (strict режим)

**Foreign Keys:**
- `compliance_record_id` → `compliance_records(id)` ON DELETE CASCADE
- `requirement_id` → `requirements(id)` ON DELETE CASCADE
- `organization_id` → `organizations(id)` ON DELETE CASCADE
- `template_id` → `control_measure_templates(id)` ON DELETE SET NULL
- `responsible_user_id` → `users(id)` ON DELETE SET NULL
- `created_by` → `users(id)` ON DELETE SET NULL
- `updated_by` → `users(id)` ON DELETE SET NULL

**Индексы:**
\`\`\`sql
idx_control_measures_tenant ON control_measures(tenant_id)
idx_control_measures_compliance_record ON control_measures(compliance_record_id)
idx_control_measures_requirement ON control_measures(requirement_id)
idx_control_measures_organization ON control_measures(organization_id)
idx_control_measures_template ON control_measures(template_id)
idx_control_measures_status ON control_measures(status)
\`\`\`

**RLS Policies:**
- ✅ Users can view their organization measures
- ✅ Users can insert measures for their organization
- ✅ Users can update measures (if not locked or user is admin)
- ✅ Tenant isolation

---

### 2.5 Evidence Links (Связи доказательств)

**Таблица:** `evidence_links`

**Ключевые поля:**
\`\`\`sql
id UUID PRIMARY KEY
evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE
control_measure_id UUID REFERENCES control_measures(id) ON DELETE CASCADE
requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE

-- Audit
created_by UUID REFERENCES users(id)
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()

-- Metadata
link_reason TEXT
relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 5)

-- Tenant isolation
tenant_id UUID NOT NULL REFERENCES tenants(id)

-- Constraints
CONSTRAINT evidence_links_must_have_target CHECK (
  control_measure_id IS NOT NULL OR requirement_id IS NOT NULL
)
\`\`\`

**Ограничения целостности:**
- ✅ `evidence_id` NOT NULL - связь всегда имеет доказательство
- ✅ `tenant_id` NOT NULL
- ✅ **CHECK constraint:** хотя бы одна из связей (control_measure_id или requirement_id) должна быть NOT NULL
- ✅ `relevance_score` CHECK (1-5) - оценка релевантности

**Foreign Keys:**
- `evidence_id` → `evidence(id)` ON DELETE CASCADE
- `control_measure_id` → `control_measures(id)` ON DELETE CASCADE
- `requirement_id` → `requirements(id)` ON DELETE CASCADE
- `created_by` → `users(id)` ON DELETE SET NULL
- `tenant_id` → `tenants(id)` ON DELETE CASCADE

**Индексы:**
\`\`\`sql
idx_evidence_links_evidence ON evidence_links(evidence_id)
idx_evidence_links_control_measure ON evidence_links(control_measure_id)
idx_evidence_links_requirement ON evidence_links(requirement_id)
idx_evidence_links_tenant ON evidence_links(tenant_id)
\`\`\`

**RLS Policies:**
- ✅ Users can view evidence links for their organization
- ✅ Tenant isolation через JWT claims

---

### 2.6 Evidence (Доказательства)

**Таблица:** `evidence`

**Ключевые поля:**
\`\`\`sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
compliance_record_id UUID REFERENCES compliance_records(id) ON DELETE CASCADE
requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE
control_id UUID REFERENCES controls(id) ON DELETE SET NULL
evidence_type_id UUID REFERENCES evidence_types(id) ON DELETE SET NULL

-- Файл
file_name VARCHAR(500) NOT NULL
file_url TEXT NOT NULL
file_type VARCHAR(100)
file_size BIGINT
storage_path TEXT

-- Метаданные
title VARCHAR(500)
description TEXT
tags TEXT[]

-- Статус
status evidence_status DEFAULT 'pending'
review_notes TEXT
reviewed_by UUID REFERENCES users(id)
reviewed_at TIMESTAMPTZ

-- Audit
uploaded_by UUID NOT NULL REFERENCES users(id)
uploaded_at TIMESTAMPTZ DEFAULT NOW()
\`\`\`

**Ограничения целостности:**
- ✅ `tenant_id` NOT NULL
- ✅ `file_name` NOT NULL
- ✅ `file_url` NOT NULL
- ✅ `uploaded_by` NOT NULL - всегда известен загрузчик
- ✅ `status` DEFAULT 'pending'

**Foreign Keys:**
- `compliance_record_id` → `compliance_records(id)` ON DELETE CASCADE
- `requirement_id` → `requirements(id)` ON DELETE CASCADE
- `control_id` → `controls(id)` ON DELETE SET NULL
- `evidence_type_id` → `evidence_types(id)` ON DELETE SET NULL
- `uploaded_by` → `users(id)` ON DELETE RESTRICT
- `reviewed_by` → `users(id)` ON DELETE SET NULL

**Индексы:**
\`\`\`sql
idx_evidence_tenant ON evidence(tenant_id)
idx_evidence_compliance ON evidence(compliance_record_id)
idx_evidence_requirement ON evidence(requirement_id)
idx_evidence_control ON evidence(control_id)
idx_evidence_type_id ON evidence(evidence_type_id)
\`\`\`

**RLS Policies:**
- ✅ Users can view evidence for their organization
- ✅ Tenant isolation

---

## 3. Бизнес-правила и ограничения

### 3.1 Создание записи соответствия

**Процесс:**
1. Требование назначается организации
2. Создаётся `compliance_record` с UNIQUE(requirement_id, organization_id)
3. Если `requirement.measure_mode = 'strict'`:
   - Автоматически создаются `control_measures` из `suggested_control_measure_template_ids`
   - Меры помечаются `from_template = true` и `is_locked = true`
4. Если `requirement.measure_mode = 'flexible'`:
   - Меры создаются опционально
   - Организация может добавлять кастомные меры

**Функция:** `create_measures_from_templates()`

**Проверки:**
- ✅ Одна запись соответствия на пару (requirement, organization)
- ✅ Tenant isolation
- ✅ Меры создаются с правильными связями
- ✅ **Иерархический доступ:** Super admin и головные организации могут создавать записи для подведомственных организаций

### 3.1.1 Модель доступа на основе иерархии организаций

**Архитектура RLS с поддержкой иерархии:**

Система использует функцию `can_access_organization(target_org_id UUID)` для проверки прав доступа:

\`\`\`sql
CREATE OR REPLACE FUNCTION can_access_organization(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admin имеет доступ ко всем организациям
  IF (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Пользователь имеет доступ к своей организации
  IF target_org_id IN (SELECT organization_id FROM users WHERE id = auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  -- Пользователь имеет доступ к подведомственным организациям
  IF target_org_id IN (
    WITH RECURSIVE subordinates AS (
      SELECT id FROM organizations WHERE id IN (SELECT organization_id FROM users WHERE id = auth.uid())
      UNION ALL
      SELECT o.id FROM organizations o
      INNER JOIN subordinates s ON o.parent_id = s.id
    )
    SELECT id FROM subordinates
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
\`\`\`

**Правила доступа:**

1. **Super Admin (organization_id = NULL):**
   - ✅ Может создавать записи для ЛЮБОЙ организации
   - ✅ Может просматривать записи ВСЕХ организаций
   - ✅ Может редактировать записи ВСЕХ организаций
   - ✅ Может удалять записи ВСЕХ организаций

2. **Головная организация (parent_id = NULL):**
   - ✅ Может создавать записи для себя
   - ✅ Может создавать записи для подведомственных организаций (через рекурсивный запрос)
   - ✅ Может просматривать записи подведомственных
   - ✅ Может редактировать записи подведомственных

3. **Подведомственная организация:**
   - ✅ Может создавать записи только для себя
   - ✅ Может просматривать только свои записи
   - ✅ Может редактировать только свои записи
   - ❌ НЕ может создавать записи для других организаций

**Применение к таблицам:**

Все таблицы с `organization_id` используют эту модель:
- ✅ `compliance_records` - записи соответствия
- ✅ `control_measures` - меры защиты
- ✅ `evidence` - доказательства
- ✅ `evidence_links` - связи доказательств
- ✅ `control_measure_evidence` - связи мер и доказательств

**Важно:** Это критично для модели комплаенс-подведомственности, где головные организации (например, Правительство региона) управляют соответствием подведомственных организаций (например, муниципальных администраций).

---

### 3.2 Создание мер

**Strict режим:**
- ✅ Меры создаются только из шаблонов
- ✅ `is_locked = true` - нельзя редактировать/удалять
- ✅ `from_template = true`
- ⚠️ **TODO:** Валидация запрета создания кастомных мер

**Flexible режим:**
- ✅ Можно создавать кастомные меры
- ✅ Можно редактировать любые меры
- ✅ `is_locked = false`

---

### 3.3 Связывание доказательств

**Процесс:**
1. Доказательство загружается в `evidence`
2. Создаётся связь в `evidence_links` с `control_measure_id` или `requirement_id`
3. Одно доказательство может быть связано с несколькими мерами (many-to-many)

**Проверки:**
- ✅ `evidence_links.evidence_id` NOT NULL
- ✅ Хотя бы одна из связей (control_measure_id или requirement_id) NOT NULL
- ✅ Tenant isolation

---

### 3.4 Расчёт статусов

**Статус меры:**
\`\`\`
planned → in_progress → implemented → verified → failed
\`\`\`

**Статус записи соответствия:**
\`\`\`
not_started → in_progress → compliant | non_compliant | partial | not_applicable
\`\`\`

**Логика:**
- Мера `fulfilled` если есть хотя бы одна связь в `evidence_links`
- Запись соответствия `compliant` если все меры `fulfilled`
- Запись соответствия `partial` если часть мер `fulfilled`
- Запись соответствия `non_compliant` если нет `fulfilled` мер

⚠️ **TODO:** Автоматический расчёт статусов через триггеры или функции

---

## 4. Проблемы и риски

### 4.1 Текущие проблемы

1. **✅ ИСПРАВЛЕНО:** `requirements.allowed_evidence_type_ids` удалено (миграция 400)
2. **✅ ИСПРАВЛЕНО:** RLS политики для `users` (миграция 410, 420)
3. **✅ РЕАЛИЗОВАНО:** Автоматический расчёт статусов (скрипт 500)
4. **✅ РЕАЛИЗОВАНО:** Валидация strict/flexible режимов (скрипт 501)
5. **✅ РЕАЛИЗОВАНО:** Валидация типов доказательств (скрипт 502)
6. **✅ РЕАЛИЗОВАНО:** Индексы производительности (скрипт 503)
7. **✅ ИСПРАВЛЕНО:** Маппинг полей в ControlMeasureService (implementation_guide → implementation_notes)
8. **✅ РЕАЛИЗОВАНО:** Автоматическое создание мер из шаблонов при назначении требования
9. **✅ РЕАЛИЗОВАНО:** API endpoint для синхронизации мер (/api/compliance/[id]/sync-measures)
10. **✅ ИСПРАВЛЕНО:** RLS политики с поддержкой иерархии организаций (скрипт 520)
11. **⚠️ ПРОБЛЕМА:** Требования не имеют заполненного поля `suggested_control_measure_template_ids`
12. **⚠️ TODO:** UI для управления шаблонами мер в требованиях
13. **⚠️ TODO:** Bulk-операции для назначения требований организациям

### 4.2 Потенциальные риски

1. **Циклические зависимости в RLS:**
   - ✅ Исправлено для `users` (политика по `auth.uid()`)
   - ⚠️ Проверить для других таблиц

2. **Производительность:**
   - ✅ Индексы созданы для всех FK
   - ⚠️ Проверить производительность при большом количестве записей

3. **Целостность данных:**
   - ✅ Foreign keys с правильными ON DELETE
   - ✅ CHECK constraints
   - ⚠️ Нет триггеров для автоматического обновления статусов

---

## 5. Рекомендации

### 5.1 Немедленные действия

1. **Создать ComplianceStatusCalculator service:**
   \`\`\`typescript
   class ComplianceStatusCalculator {
     static async calculateMeasureStatus(measureId: string): Promise<MeasureStatus>
     static async calculateComplianceStatus(complianceRecordId: string): Promise<ComplianceStatus>
     static async onEvidenceLinkChanged(evidenceLinkId: string): Promise<void>
   }
   \`\`\`

2. **Добавить валидацию режимов в API:**
   - Запретить создание кастомных мер в strict режиме
   - Запретить редактирование locked мер

3. **Создать UI компоненты:**
   - `RequirementDetailPage` с вкладками
   - `ControlMeasureCard` с evidence_links
   - `EvidenceCard` с управлением связями

### 5.2 Долгосрочные улучшения

1. **Добавить триггеры для автоматического расчёта статусов**
2. **Добавить метрики continuous compliance**
3. **Добавить bulk-операции для evidence_links**
4. **Оптимизировать запросы с использованием materialized views**

---

## 6. Диаграмма связей

\`\`\`
┌─────────────────────┐
│   Requirement       │
│  (Требование)       │
│                     │
│ - measure_mode      │
│ - suggested_        │
│   template_ids[]    │
└──────────┬──────────┘
           │
           │ 1:N
           ▼
┌─────────────────────┐
│ Control Measure     │
│ Template            │
│ (Шаблон меры)       │
│                     │
│ - recommended_      │
│   evidence_type_    │
│   ids[]             │
└─────────────────────┘

┌─────────────────────┐
│   Requirement       │
└──────────┬──────────┘
           │
           │ 1:N
           ▼
┌─────────────────────┐       ┌─────────────────────┐
│ Compliance Record   │ 1:N   │ Control Measure     │
│ (Запись             │◄──────┤ (Конкретная мера)   │
│  соответствия)      │       │                     │
│                     │       │ - from_template     │
│ - status            │       │ - is_locked         │
└─────────────────────┘       └──────────┬──────────┘
                                         │
                                         │ N:M
                                         ▼
                              ┌─────────────────────┐
                              │ Evidence Links      │
                              │ (Связи              │
                              │  доказательств)     │
                              └──────────┬──────────┘
                                         │
                                         │ N:1
                                         ▼
                              ┌─────────────────────┐
                              │ Evidence            │
                              │ (Доказательство)    │
                              │                     │
                              │ - evidence_type_id  │
                              │ - file_url          │
                              └─────────────────────┘
\`\`\`

---

## 7. Текущее состояние системы (обновлено 2025-01-10)

### 7.1 Реализованные функции

✅ **Базовая архитектура:**
- Мультитенантность с tenant isolation через RLS
- Иерархия организаций
- Двухрежимная модель (strict/flexible)
- Many-to-many связи через evidence_links

✅ **Автоматизация:**
- Триггеры для автоматического расчёта статусов мер и записей соответствия
- Каскадное обновление статусов при изменении доказательств
- Автоматическое создание мер из шаблонов при назначении требования организации

✅ **Валидация:**
- Проверка режима мер (strict/flexible) на уровне БД
- Проверка типов доказательств при создании evidence_links
- Уникальность записей соответствия (requirement_id, organization_id)

✅ **Производительность:**
- 30+ индексов для оптимизации запросов
- GIN индексы для массивов (suggested_control_measure_template_ids, recommended_evidence_type_ids)
- Уникальные ограничения для предотвращения дубликатов

✅ **Безопасность:**
- RLS политики для всех таблиц
- Исправлена циклическая зависимость в users RLS
- Tenant isolation через JWT claims

### 7.2 Известные проблемы

⚠️ **Критичные:**
1. **Требования не содержат шаблонов мер** - поле `suggested_control_measure_template_ids` пустое у существующих требований
2. **Нет UI для управления шаблонами** - невозможно добавить шаблоны мер к требованию через интерфейс

⚠️ **Важные:**
3. **Нет bulk-операций** - назначение требований организациям происходит по одной
4. **Нет audit trail** - отсутствует история изменений критичных полей
5. **Нет уведомлений** - пользователи не получают уведомления об изменениях статусов

⚠️ **Желательные:**
6. **Нет материализованных представлений** - медленные запросы для дашбордов
7. **Нет полнотекстового поиска** - поиск по требованиям работает медленно
8. **Нет версионирования** - при изменении требования теряется история

### 7.3 Метрики целостности

**Проверено 2025-01-10:**

✅ **Структурная целостность:**
- Все Foreign Keys настроены корректно
- CHECK constraints работают
- Уникальные индексы предотвращают дубликаты

✅ **Функциональная целостность:**
- Триггеры автоматического расчёта статусов работают
- Валидация режимов мер работает
- Валидация типов доказательств работает

✅ **Безопасность и доступ:**
- RLS политики поддерживают иерархию организаций
- Super admin может управлять всеми организациями
- Головные организации могут управлять подведомственными
- Функция `can_access_organization()` работает корректно

⚠️ **Данные:**
- Требования имеют пустые `suggested_control_measure_template_ids`
- Записи соответствия созданы без мер (до реализации автоматического создания)

### 7.4 Рекомендации по исправлению

**Немедленно:**
1. Создать UI для управления шаблонами мер в требованиях
2. Заполнить `suggested_control_measure_template_ids` для существующих требований
3. Запустить синхронизацию мер для существующих записей соответствия

**В течение недели:**
4. Реализовать bulk-операции для назначения требований
5. Добавить audit trail для критичных изменений
6. Добавить систему уведомлений

**В течение месяца:**
7. Добавить материализованные представления для дашбордов
8. Реализовать полнотекстовый поиск
9. Добавить версионирование требований

---

## 8. Заключение

Модель целостности данных построена правильно с учётом:
- ✅ Мультитенантности
- ✅ Иерархии организаций
- ✅ **Иерархического контроля доступа** - головные организации управляют подведомственными
- ✅ Двух режимов исполнения (strict/flexible)
- ✅ Many-to-many связей через `evidence_links`
- ✅ Правильных Foreign Keys с ON DELETE
- ✅ RLS политик для безопасности с поддержкой иерархии
- ✅ Индексов для производительности

**Основные достижения:**
1. ✅ Реализован автоматический расчёт статусов
2. ✅ Добавлена валидация режимов в БД
3. ✅ Создана архитектура RLS с поддержкой иерархии организаций
4. ⚠️ TODO: Создать UI для работы с новой моделью
