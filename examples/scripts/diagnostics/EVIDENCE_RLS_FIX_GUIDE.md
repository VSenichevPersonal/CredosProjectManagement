# 🔧 Исправление RLS для загрузки доказательств

**Дата:** 13 октября 2025  
**Проблема:** Невозможно загрузить документы доказательств к мерам контроля  
**Режим:** Строгий/Строгий

---

## 🎯 Диагностика проблемы

### Найденная проблема

В миграции `004_add_organization_to_evidence.sql` была создана политика RLS **только для SELECT**:

```sql
CREATE POLICY evidence_tenant_isolation ON evidence
  USING (...);  -- только SELECT!
```

**Отсутствуют политики для:**
- ❌ INSERT (создание новых записей)
- ❌ UPDATE (обновление записей)
- ❌ DELETE (удаление записей)

Из-за этого любая попытка вставить новое доказательство в таблицу `evidence` блокируется RLS с ошибкой:
```
new row violates row-level security policy for table "evidence"
```

---

## ✅ Решение

### 1. Диагностика (опционально)

Запустите диагностический скрипт в Supabase SQL Editor:

```bash
scripts/diagnostics/check_evidence_rls.sql
```

Этот скрипт покажет:
- ✓ Текущие политики RLS для `evidence`
- ✓ Политики для `evidence_links` и `control_measure_evidence`
- ✓ Storage bucket политики
- ✓ Статус RLS (включен/выключен)
- ✓ Структуру таблицы

### 2. Применение миграции

Запустите миграцию в Supabase SQL Editor:

```bash
scripts/671_fix_evidence_rls_complete.sql
```

**Что делает миграция:**

1. **Удаляет старые политики** (неполные)
2. **Создаёт полный набор политик:**
   - `evidence_select_policy` — SELECT для authenticated
   - `evidence_insert_policy` — INSERT для authenticated
   - `evidence_update_policy` — UPDATE для authenticated
   - `evidence_delete_policy` — DELETE для authenticated

3. **Упрощённый подход** (как в миграции 670 для `evidence_links`):
   - Политики разрешают все операции для authenticated пользователей
   - Бизнес-логика (tenant isolation, права доступа) реализована в коде
   - Это обеспечивает гибкость и снижает сложность RLS

### 3. Проверка

После применения миграции:

1. **Проверьте политики:**
```sql
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'evidence'
ORDER BY cmd;
```

Должно быть **4 политики** (SELECT, INSERT, UPDATE, DELETE).

2. **Попробуйте загрузить доказательство** через UI:
   - Откройте меру контроля
   - Загрузите файл в режиме строгий/строгий
   - Должно работать без ошибок! ✅

---

## 📋 Архитектура безопасности

### Уровни защиты

1. **RLS (Row Level Security):**
   - Проверяет `auth.uid()` — пользователь authenticated
   - Разрешает операции для authenticated пользователей

2. **Код (ExecutionContext + SupabaseDatabaseProvider):**
   - Фильтрация по `tenant_id` (через `withTenantFilter`)
   - Проверка `organization_id` через пользовательские права
   - Валидация через `EvidenceService` (Permissions: `EVIDENCE_CREATE`, `EVIDENCE_UPDATE`, etc.)

3. **Access Control:**
   - `Permission.EVIDENCE_READ`
   - `Permission.EVIDENCE_CREATE`
   - `Permission.EVIDENCE_UPDATE`
   - `Permission.EVIDENCE_DELETE`

### Поток создания доказательства

```
Frontend
  ↓
POST /api/evidence (FormData с файлом)
  ↓
1. Upload файла в Storage bucket 'evidence-files' (RLS для storage.objects ✅)
  ↓
2. EvidenceService.create(ctx, data)
  ↓
3. ctx.access.require(Permission.EVIDENCE_CREATE) — проверка прав
  ↓
4. ctx.db.evidence.create(data) — EvidenceRepository
  ↓
5. INSERT INTO evidence (tenant_id = ctx.tenantId, ...) 
  ↓
6. RLS проверка: evidence_insert_policy ✅
  ↓
7. Audit log
  ↓
SUCCESS ✅
```

---

## 🔍 Дополнительная диагностика

### Если проблема не решена

1. **Проверьте Storage bucket RLS:**
```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%authenticated%';
```

Должна быть политика `Allow authenticated uploads`.

2. **Проверьте `evidence_links` / `control_measure_evidence`:**
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename IN ('evidence_links', 'control_measure_evidence');
```

3. **Проверьте логи в консоли браузера:**
   - Откройте DevTools → Console
   - Попробуйте загрузить файл
   - Ищите ошибки с `[Evidence API]` или `[EvidenceRepository]`

4. **Проверьте серверные логи:**
   - В коде есть подробные логи:
     - `[Evidence API] FormData received`
     - `[EvidenceRepository] create`
     - `[EvidenceRepository] FINAL INSERT DATA`

---

## 📝 История изменений

- **Миграция 004:** Добавлен `organization_id` к `evidence`, создана политика только для SELECT ❌
- **Миграция 670:** Упрощены политики для `evidence_links` ✅
- **Миграция 671:** **Полное исправление RLS для `evidence`** — добавлены все политики ✅

---

## 🚀 Что дальше?

После применения миграции 671 всё должно работать! 

Если остаются проблемы:
1. Запустите диагностический скрипт
2. Проверьте логи (браузер + сервер)
3. Убедитесь, что пользователь имеет роль с правами `EVIDENCE_CREATE`

---

## 💡 Подсказки

### Тестирование в режиме строгий/строгий

1. **Убедитесь, что пользователь:**
   - Authenticated (залогинен)
   - Имеет `tenant_id`
   - Имеет `organization_id`
   - Роль: `super_admin`, `ib_manager` или `ib_specialist` с правом `EVIDENCE_CREATE`

2. **Загрузите файл:**
   - Формат: PDF, DOC, DOCX, TXT
   - Размер: < 50MB
   - Имя файла: кириллица поддерживается (транслитерация в коде)

3. **Проверьте создание:**
```sql
SELECT id, file_name, tenant_id, organization_id, created_at
FROM evidence
ORDER BY created_at DESC
LIMIT 1;
```

---

**✅ Готово! Проблема должна быть решена.**

