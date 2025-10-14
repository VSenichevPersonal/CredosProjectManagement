# Инструкция по синхронизации мер контроля

## 🔍 Проблема

При создании записей соответствия (`compliance_records`) не создавались автоматически меры контроля (`control_measures`) из шаблонов требования.

## ✅ Исправления

### 1. Исправлен API endpoint

**Файл:** `app/api/compliance/route.ts`

**Изменение:** Заменён несуществующий метод `createWithMeasures()` на `create()`

```typescript
// ДО
const compliance = await ComplianceService.createWithMeasures(ctx, { ... })

// ПОСЛЕ
const compliance = await ComplianceService.create(ctx, { ... })
```

Теперь при создании **новых** записей соответствия меры будут создаваться автоматически.

---

## 🔧 Синхронизация существующих записей

### Статистика по вашей БД:

```
✅ Всего требований: 65 (все имеют шаблоны мер)
✅ Всего шаблонов мер: 23
📊 Всего записей соответствия: 32
❌ Записей С мерами: только 3
❌ Записей БЕЗ мер: 29
```

**Итого: Нужно создать меры для 29 записей**

---

## 🚀 Способы синхронизации

### Вариант 1: Через SQL (быстро, массово)

Запустите SQL скрипт в Supabase SQL Editor:

```bash
scripts/sync-existing-measures.sql
```

**Что делает:**
- Находит все compliance_records без мер
- Создаёт меры из `suggested_control_measure_template_ids`
- Показывает статистику

**Преимущества:**
- ✅ Быстро (выполняется на сервере БД)
- ✅ Массовая операция
- ✅ Показывает детальные логи

**Недостатки:**
- ⚠️ Требует доступ к Supabase SQL Editor
- ⚠️ Не проходит через API validations

---

### Вариант 2: Через TypeScript скрипт (рекомендуется)

Запустите TypeScript скрипт:

```bash
npx tsx scripts/bulk-sync-measures.ts
```

**Что делает:**
- Проверяет каждую compliance_record
- Создаёт недостающие меры через Supabase API
- Показывает прогресс и статистику

**Преимущества:**
- ✅ Безопаснее (использует Supabase API)
- ✅ Подробные логи в консоли
- ✅ Можно запустить локально

**Требования:**
- Переменные окружения:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

### Вариант 3: Через API endpoint (для одной записи)

**Endpoint:** `POST /api/compliance/{id}/sync-measures`

**Использование в коде:**

```typescript
const response = await fetch(`/api/compliance/${complianceId}/sync-measures`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

const result = await response.json()
console.log(`Создано мер: ${result.created}`)
```

**Преимущества:**
- ✅ Можно вызвать из UI
- ✅ Проходит через все проверки прав доступа
- ✅ Работает для отдельных записей

**Недостатки:**
- ⚠️ Нужно вызывать для каждой записи отдельно

---

## 📋 Рекомендуемый порядок действий

### Шаг 1: Тест на одной записи

Проверьте, что всё работает на одной записи:

```bash
# В консоли браузера или Postman
curl -X POST https://your-api.com/api/compliance/{compliance-id}/sync-measures \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Шаг 2: Массовая синхронизация

Если тест прошёл успешно:

```bash
# Вариант A: SQL (самый быстрый)
# Запустите scripts/sync-existing-measures.sql в Supabase SQL Editor

# Вариант B: TypeScript (рекомендуется)
npx tsx scripts/bulk-sync-measures.ts
```

### Шаг 3: Проверка результатов

Запустите диагностический скрипт:

```bash
# В Supabase SQL Editor
scripts/diagnose-measures-issue.sql
```

Должны увидеть:
```json
{
  "total_compliance_records": 32,
  "total_control_measures": ~64+ (было 7),
  "compliance_records_with_measures": 32 (было 3)
}
```

---

## 🔮 Для будущих записей

После исправления API endpoint все **новые** записи соответствия будут автоматически получать меры при создании через:

1. ✅ `POST /api/compliance` - создание одной записи
2. ✅ `POST /api/requirements/{id}/compliance/bulk-create` - массовое назначение

---

## 🐛 Troubleshooting

### Ошибка: "Template not found"

**Причина:** В `suggested_control_measure_template_ids` есть ID несуществующего шаблона

**Решение:**
```sql
-- Найдите проблемные требования
SELECT 
  r.id, r.code, r.title,
  unnest(r.suggested_control_measure_template_ids) as template_id
FROM requirements r
WHERE EXISTS (
  SELECT 1 FROM unnest(r.suggested_control_measure_template_ids) tid
  WHERE NOT EXISTS (
    SELECT 1 FROM control_measure_templates WHERE id = tid
  )
);

-- Обновите требование, удалив несуществующие ID
UPDATE requirements 
SET suggested_control_measure_template_ids = array_remove(
  suggested_control_measure_template_ids, 
  'PROBLEM_TEMPLATE_ID'
)
WHERE id = 'REQUIREMENT_ID';
```

### Ошибка: "Permission denied"

**Причина:** RLS политики блокируют создание

**Решение:** Используйте `SUPABASE_SERVICE_ROLE_KEY` в скрипте (он обходит RLS)

### Меры создались, но статус не обновляется

**Причина:** Триггеры для автоматического обновления статусов могут быть не активны

**Решение:** Проверьте триггеры:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%compliance%';
```

---

## 📞 Поддержка

Если возникли проблемы:

1. Проверьте логи в консоли браузера
2. Проверьте логи сервера Next.js
3. Запустите диагностический скрипт
4. Проверьте, что все шаблоны существуют

---

**Дата создания:** 2025-01-12  
**Версия:** 1.0  
**Автор:** AI Assistant

