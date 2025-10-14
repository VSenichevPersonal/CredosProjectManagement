# Аудит справочников в админке

**Дата:** 12 октября 2025  
**Анализ:** Product Owner + Architect  
**Цель:** Определить устаревшие справочники после перехода на Stage 14

---

## 📋 Все справочники в системе

### 1. **evidence_types** (Типы доказательств)
- **Статус:** ✅ **АКТУАЛЬНЫЙ** - ключевой справочник Stage 14
- **Использование:** 
  - `control_measure_templates.recommended_evidence_type_ids`
  - `control_measures.allowed_evidence_type_ids`
  - `evidence.evidence_type_id`
  - `evidence_links` validation
- **Назначение:** Определяет типы документов (Политика, Приказ, Журнал и т.д.)
- **Критичность:** 🔴 HIGH

---

### 2. **verification_methods** (Методы проверки)
- **Статус:** ⚠️ **ЧАСТИЧНО УСТАРЕЛ**
- **Использование:**
  - `requirements.verification_method_id` (FK существует)
  - В UI требований показывается, но не обязательно
- **Назначение:** Как проверяется выполнение (Документ, Интервью, Наблюдение, Тестирование)

**Анализ:**
- В Stage 13: Определял способ проверки требования
- В Stage 14: Способ проверки определяется типом доказательства (evidence_type)
- **Дублирует** функционал `evidence_types`

**Примеры:**
```
verification_methods:
- Проверка документов  ← Дублирует evidence_type = "Документ"
- Скриншот             ← Дублирует evidence_type = "Скриншот"  
- Тестирование         ← Неясно, как связано с доказательствами
```

**Рекомендация:** 
- ⚠️ DEPRECATE - оставить в БД для обратной совместимости
- ❌ СКРЫТЬ из меню админки
- 💡 Мигрировать данные в `evidence_types` если нужно

---

### 3. **periodicities** (Периодичность)
- **Статус:** ✅ **АКТУАЛЬНЫЙ**
- **Использование:**
  - `requirements.periodicity_id`
  - Определяет частоту проверки (Однократно, Ежегодно, Ежеквартально)
- **Назначение:** Расписание для проверок
- **Критичность:** 🟡 MEDIUM
- **Примечание:** Полезно для планирования, но не обязательно в Continuous Compliance

---

### 4. **responsible_roles** (Ответственные роли)
- **Статус:** ⚠️ **ЧАСТИЧНО АКТУАЛЬНЫЙ**
- **Использование:**
  - `requirements.responsible_role_id`
  - Определяет, кто отвечает за выполнение
- **Назначение:** Роли ответственных (CISO, Админ ИБ, Сис.админ)

**Проблема:**
- Дублирует системные роли из `roles` таблицы (RBAC)
- Не привязано к реальным пользователям
- В compliance_records используется `assigned_to` (конкретный user_id)

**Рекомендация:**
- ⚠️ ЧАСТИЧНО УСТАРЕЛ
- 💡 Заменить на `assigned_to` (конкретный пользователь)
- Или использовать как "рекомендуемую роль" в шаблоне

---

### 5. **regulators** (Регуляторы)
- **Статус:** ✅ **АКТУАЛЬНЫЙ** 
- **Использование:**
  - `requirements.regulator_id`
  - `regulatory_frameworks.regulator_id` (если есть)
- **Назначение:** ФСТЭК, ФСБ, Роскомнадзор и т.д.
- **Критичность:** 🟡 MEDIUM

---

### 6. **requirement_categories** (Категории требований)
- **Статус:** ⚠️ **СОМНИТЕЛЬНЫЙ**
- **Использование:**
  - `requirements.category_id` (если есть)
  - Альтернатива: `requirements.category` (VARCHAR)
- **Назначение:** Техническая, Организационная, Физическая

**Проблема:**
- В БД есть поле `category` типа VARCHAR (не FK)
- Справочник может быть не используется
- Категоризация может делаться через `regulatory_framework`

**Рекомендация:**
- ❓ ПРОВЕРИТЬ использование
- 💡 Если не используется - удалить

---

### 7. **organization_types** (Типы организаций)
- **Статус:** ✅ **АКТУАЛЬНЫЙ**
- **Использование:**
  - `organizations.type_id`
  - Определяет тип (Министерство, Учреждение, Школа, Больница)
- **Назначение:** Классификация организаций
- **Критичность:** 🟡 MEDIUM

---

### 8. **regulatory_frameworks** (Нормативные базы)
- **Статус:** ✅ **АКТУАЛЬНЫЙ**
- **Использование:**
  - `requirements.regulatory_framework_id`
  - ФСТЭК, ФСБ, 152-ФЗ и т.д.
- **Назначение:** Группировка требований по регуляторам
- **Критичность:** 🔴 HIGH

---

### 9. **regulatory_document_types** (Типы нормативных документов)
- **Статус:** ✅ **АКТУАЛЬНЫЙ**
- **Использование:**
  - `regulatory_frameworks.document_type_id`
  - Законодательные, Внутренние, СМК
- **Назначение:** Классификация документов
- **Критичность:** 🟡 MEDIUM

---

## 📊 Итоговая таблица

| Справочник | Статус | Критичность | Рекомендация |
|------------|--------|-------------|--------------|
| evidence_types | ✅ Актуальный | 🔴 HIGH | Оставить |
| control_measure_templates | ✅ Актуальный | 🔴 HIGH | Оставить |
| regulatory_frameworks | ✅ Актуальный | 🔴 HIGH | Оставить |
| organization_types | ✅ Актуальный | 🟡 MEDIUM | Оставить |
| regulators | ✅ Актуальный | 🟡 MEDIUM | Оставить |
| periodicities | ✅ Актуальный | 🟡 MEDIUM | Оставить |
| **verification_methods** | ⚠️ **Устарел** | 🟢 LOW | **Скрыть/Удалить** |
| **responsible_roles** | ⚠️ **Частично устарел** | 🟢 LOW | **Пересмотреть** |
| **requirement_categories** | ❓ **Неясно** | 🟢 LOW | **Проверить** |
| regulatory_document_types | ✅ Актуальный | 🟡 MEDIUM | Оставить |

---

## 🎯 Рекомендации

### Немедленно (Quick Fix)

1. **Скрыть verification_methods из меню**
   - Убрать из `app-sidebar.tsx`
   - Оставить API для обратной совместимости
   - Добавить deprecation notice

2. **Проверить использование requirement_categories**
   - SQL запрос: `SELECT COUNT(*) FROM requirements WHERE category_id IS NOT NULL`
   - Если 0 - скрыть из меню

### В течение недели

3. **Пересмотреть responsible_roles**
   - Либо удалить (использовать только `assigned_to`)
   - Либо использовать как "рекомендуемая роль" в шаблоне требования

4. **Добавить deprecation notices**
   - В UI показывать: "⚠️ Этот справочник устарел и будет удалён"
   - В API добавлять header: `X-Deprecated: true`

### В течение месяца

5. **Миграция данных**
   - Если verification_methods используется - мигрировать в evidence_types
   - Если responsible_roles используется - мигрировать в assigned_to
   - Cleanup неиспользуемых таблиц

---

## 📝 SQL для проверки использования

```sql
-- Проверить использование verification_methods
SELECT 
  'verification_methods' as dictionary,
  COUNT(*) as requirements_using
FROM requirements 
WHERE verification_method_id IS NOT NULL;

-- Проверить использование responsible_roles
SELECT 
  'responsible_roles' as dictionary,
  COUNT(*) as requirements_using
FROM requirements 
WHERE responsible_role_id IS NOT NULL;

-- Проверить использование requirement_categories
SELECT 
  'requirement_categories' as dictionary,
  COUNT(*) FILTER (WHERE category_id IS NOT NULL) as using_fk,
  COUNT(*) FILTER (WHERE category IS NOT NULL) as using_varchar
FROM requirements;
```

---

## 🔄 План миграции

### Phase 1: Скрыть устаревшие (сегодня)

```typescript
// app-sidebar.tsx - убрать из меню:
❌ /admin/dictionaries/verification-methods
❌ /admin/dictionaries/requirement-categories (если не используется)
```

### Phase 2: Deprecation notices (неделя)

```typescript
// На страницах устаревших справочников:
<Alert variant="warning">
  ⚠️ Этот справочник устарел в Stage 14. 
  Используйте "Типы доказательств" вместо "Методов проверки".
</Alert>
```

### Phase 3: Data migration (месяц)

```sql
-- Мигрировать verification_methods → evidence_types (если нужно)
-- Удалить FK constraint
-- Архивировать таблицу
```

---

## ✅ Актуальные справочники (оставить в меню)

**Основные:**
1. Типы доказательств (evidence_types) 🔴
2. Шаблоны мер (control_measure_templates) 🔴
3. Нормативные базы (regulatory_frameworks) 🔴
4. Типы организаций (organization_types) 🟡

**Вспомогательные:**
5. Регуляторы (regulators) 🟡
6. Периодичность (periodicities) 🟡
7. Типы нормативных документов (regulatory_document_types) 🟡

---

**Автор:** AI Assistant (Product Owner + Architect)

