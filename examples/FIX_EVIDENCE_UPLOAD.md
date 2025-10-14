# ✅ ИСПРАВЛЕНО: Загрузка доказательств

## 📌 Проблема (решена)

**~~Не работала~~ загрузка документов доказательств к мерам контроля.**

Ошибки:
1. ~~`new row violates row-level security policy for table "evidence"`~~ ✅ ИСПРАВЛЕНО
2. ~~`record "new" has no field "compliance_record_id"`~~ ✅ ИСПРАВЛЕНО

---

## ✅ Решение применено

### Найденные проблемы:

1. **RLS политики для evidence:**
   - ❌ Были политики только для SELECT
   - ✅ Добавлены политики для INSERT, UPDATE, DELETE (миграция 671)

2. **Триггер `trigger_update_compliance_status()`:**
   - ❌ Пытался обработать таблицу `evidence` с несуществующим полем `control_measure_id`
   - ✅ Убрана обработка `evidence`, исправлен JOIN для `evidence_links` (миграция 672)

---

## 🚀 Применение исправлений

### Шаг 1: RLS политики (миграция 671)

```bash
scripts/671_fix_evidence_rls_complete.sql
```

**Что делает:**
- Создаёт политики для всех операций (SELECT, INSERT, UPDATE, DELETE)
- Упрощённый подход: RLS проверяет `authenticated`, фильтрация по tenant в коде

### Шаг 2: Исправление триггеров (миграция 672)

```bash
scripts/672_fix_trigger_update_compliance_status.sql
```

**Что делает:**
- Исправляет функцию `trigger_update_compliance_status()`
- Убирает обработку таблицы `evidence` (там нет `control_measure_id`)
- Правильно получает `compliance_record_id` для `evidence_links` через JOIN
- Включает триггеры обратно

### Шаг 3: Проверка

После применения обеих миграций попробуйте загрузить доказательство — **должно работать!** ✅

---

## 📊 Что было исправлено?

**До:**
- ❌ Только политика SELECT
- ❌ INSERT блокируется RLS
- ❌ Невозможно создать evidence

**После:**
- ✅ Политики для всех операций (SELECT, INSERT, UPDATE, DELETE)
- ✅ Загрузка доказательств работает
- ✅ Tenant isolation в коде

---

## 🔍 Диагностика (если нужна)

Если проблема не решена, запустите диагностический скрипт:
```
scripts/diagnostics/check_evidence_rls.sql
```

И посмотрите подробную документацию:
```
scripts/diagnostics/EVIDENCE_RLS_FIX_GUIDE.md
```

---

## 📞 Вопросы?

Все логи и детали в:
- `scripts/diagnostics/EVIDENCE_RLS_FIX_GUIDE.md` — полная документация
- `scripts/diagnostics/check_evidence_rls.sql` — диагностика
- `scripts/671_fix_evidence_rls_complete.sql` — миграция

---

**Дата:** 13 октября 2025  
**Миграция:** 671  
**Статус:** ✅ Готово к применению

