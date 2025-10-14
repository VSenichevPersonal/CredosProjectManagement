# Известные проблемы Stage 16

**Дата:** 13 октября 2025

---

## 🐛 Критические проблемы

### 1. evidence_type_id не сохраняется в БД
**Статус:** ✅ ИСПРАВЛЕНО

**Проблема:**
- evidenceTypeId передаётся из UI ✅
- evidenceTypeId в API ✅  
- evidenceTypeId не сохраняется в evidence таблицу ❌

**Причина:**
- EvidenceMapper.toDb() не включал evidenceTypeId в маппинг
- EvidenceMapper.fromDb() не читал evidence_type_id из БД

**Решение:** ✅
- Добавлен маппинг evidenceTypeId в fromDb()
- Добавлен маппинг evidenceTypeId в toDb()
- EvidenceRepository.create() уже имел явный INSERT (было правильно)

**Файлы:** 
- `providers/supabase/mappers/evidence-mapper.ts` ✅

---

### 2. React Hooks порядок нарушен
**Статус:** ✅ ИСПРАВЛЕНО

**Ошибка:**
```
RequirementEvidenceTypesTab: 
Previous: undefined
Next: useMemo (добавлен в середине)
```

**Решение:**
- Перенесли useMemo ПЕРЕД условным return
- Переместили getDefaultInstructions наружу компонента
- Добавили проверку на пустой массив в useMemo

**Файл:** `components/requirements/requirement-evidence-types-tab.tsx` ✅

---

### 3. Карточка требования - вкладка "Типы доказательств"
**Статус:** ✅ ИСПРАВЛЕНО

**Проблема:**
Runtime Error при открытии вкладки из-за нарушения порядка hooks

**Решение:**
Исправлен порядок hooks (см. проблему #2) ✅

---

## ⏳ Задачи на следующую сессию

1. Исправить порядок hooks в RequirementEvidenceTypesTab
2. Проверить что evidenceTypeId сохраняется после перезагрузки
3. Добавить обработку ошибок в UI (toast notifications)
4. Обновить README_FOR_LLM.md с комментариями на русском
5. Продолжить типизацию мер

---

**Приоритет:** HIGH - блокирует загрузку доказательств

