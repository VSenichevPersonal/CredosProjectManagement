# Механизм предотвращения дублей записей соответствия

**Дата:** 13 октября 2025  
**Роль:** Product Owner + Senior Architect  
**Stage:** 17

---

## 🎯 ПРОБЛЕМА

**Сценарий:**
Пользователь создает запись соответствия для:
- Организация: "АО Щёкиноазот"
- Требование: "КИИ-002 Категорирование"

**Вопрос:** Что если такая запись уже существует?

---

## 📊 ТИПЫ ДУБЛЕЙ

### 1. **Полный дубль** (100% совпадение)
```
Существующая запись:
  requirement_id: КИИ-002
  organization_id: Щёкиноазот
  
Новая попытка:
  requirement_id: КИИ-002
  organization_id: Щёкиноазот
```

**Решение:** ❌ ЗАПРЕТИТЬ создание

---

### 2. **Частичный дубль** (разный статус/период)
```
Существующая:
  requirement_id: КИИ-002
  organization_id: Щёкиноазот
  status: approved
  period: 2024
  
Новая попытка:
  requirement_id: КИИ-002
  organization_id: Щёкиноазот
  status: pending
  period: 2025
```

**Решение:** ✅ РАЗРЕШИТЬ (новый период/цикл проверки)

---

### 3. **Повторная попытка** (была удалена/отклонена)
```
Существующая:
  requirement_id: КИИ-002
  organization_id: Щёкиноазот
  status: rejected
  
Новая попытка:
  requirement_id: КИИ-002
  organization_id: Щёкиноазот
```

**Решение:** ❓ СПРОСИТЬ "Создать новую или открыть существующую?"

---

## 🏗️ АРХИТЕКТУРНОЕ РЕШЕНИЕ

### Уровень 1: **Constraint в БД**

```sql
-- Уникальность пары requirement + organization
ALTER TABLE compliance_records 
  ADD CONSTRAINT unique_requirement_organization 
  UNIQUE (requirement_id, organization_id);
```

**Но!** Это слишком жестко - не учитывает периоды и статусы.

---

### Уровень 2: **Partial Unique Index** (рекомендую!)

```sql
-- Разрешить дубли только для определенных статусов
CREATE UNIQUE INDEX unique_active_compliance
  ON compliance_records (requirement_id, organization_id)
  WHERE status NOT IN ('rejected', 'cancelled', 'archived');
```

**Логика:**
- ✅ Можно иметь только ОДНУ активную запись
- ✅ Можно создать новую если старая rejected/cancelled/archived
- ✅ Автоматически через БД

---

### Уровень 3: **Проверка на клиенте + UX** (самое правильное!)

**При создании записи:**

```typescript
// 1. Проверка существующих
const existing = await checkExistingCompliance(
  requirementId,
  organizationId
)

if (existing.length > 0) {
  // 2. Анализ ситуации
  const hasActive = existing.some(r => 
    !['rejected', 'cancelled', 'archived'].includes(r.status)
  )
  
  if (hasActive) {
    // 3. Показать диалог выбора
    showDuplicateDialog({
      existing: existing,
      options: [
        'Открыть существующую запись',
        'Создать новую (архивировать старую)',
        'Отмена'
      ]
    })
  } else {
    // 4. Можно создать (старые неактивны)
    createCompliance()
  }
}
```

---

## 🎨 UX РЕШЕНИЕ

### Диалог при обнаружении дубля:

```
┌──────────────────────────────────────────────────────────┐
│ ⚠️ Обнаружена существующая запись                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Для этой организации уже есть запись по этому требованию:│
│                                                          │
│ 📋 Требование: КИИ-002 Категорирование                   │
│ 🏢 Организация: АО Щёкиноазот                            │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Существующая запись:                               │   │
│ │                                                    │   │
│ │ Статус: ✅ Утверждена                              │   │
│ │ Создана: 15.09.2025                                │   │
│ │ Меры: 5 из 5 выполнено                             │   │
│ │ Доказательства: 12 загружено                       │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ Что вы хотите сделать?                                   │
│                                                          │
│ [Открыть существующую]  [Создать новую]  [Отмена]       │
│                                                          │
│ ⚠️ При создании новой, старая будет архивирована         │
└──────────────────────────────────────────────────────────┘
```

---

## 📋 РЕКОМЕНДАЦИЯ PRODUCT OWNER

### ✅ Комбинированный подход:

**1. Constraint в БД** (защита от race conditions):
```sql
CREATE UNIQUE INDEX unique_active_compliance_per_org
  ON compliance_records (requirement_id, organization_id)
  WHERE status NOT IN ('rejected', 'cancelled', 'archived');
```

**2. Проверка на клиенте** (UX):
```typescript
// При создании compliance_record
// → Проверяем существующие
// → Показываем диалог если нашли
// → Даем выбор: открыть или создать новую
```

**3. API endpoint для проверки:**
```typescript
GET /api/compliance/check-duplicate?requirementId=...&organizationId=...

Response: {
  exists: true,
  records: [{ id, status, createdAt, ... }]
}
```

---

## 🚀 РЕАЛИЗАЦИЯ

### Фаза 1: Constraint (сейчас)
- Миграция 650: partial unique index
- Защита на уровне БД

### Фаза 2: UX (следующая)
- DuplicateComplianceDialog компонент
- API endpoint для проверки
- Логика при создании

---

**Делать сейчас миграцию 650?** 🎯

