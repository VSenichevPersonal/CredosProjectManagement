# План отладки загрузки доказательств

**Дата:** 13 октября 2025  
**Проблема:** evidenceTypeId не доходит до валидации  
**Подход:** Системное тестирование всех гипотез

---

## 🔍 ГИПОТЕЗЫ

### 1. FormData не передает evidenceTypeId
**Проверка:** Логи `[Evidence API] FormData received`

### 2. evidenceTypeId не сохраняется в БД
**Проверка:** SELECT evidence_type_id FROM evidence WHERE id = ...

### 3. RLS блокирует чтение evidence_type_id
**Проверка:** Суперадмин vs обычный пользователь

### 4. Маппинг теряет evidenceTypeId
**Проверка:** Логи `[EvidenceRepository] Inserting`

### 5. Валидация читает из другой таблицы
**Проверка:** SQL запрос в validateEvidenceType

---

## 🧪 ПЛАН ТЕСТОВ

### Тест 1: Проверка FormData
```typescript
console.log('[Upload Dialog] Sending:', {
  selectedEvidenceTypeId,
  formData_evidence_type_id: formData.get('evidence_type_id'),
  formData_evidenceTypeId: formData.get('evidenceTypeId')
})
```

### Тест 2: Проверка БД после вставки
```sql
SELECT 
  id, 
  title, 
  evidence_type_id,
  evidence_type_id IS NOT NULL as has_type
FROM evidence
ORDER BY created_at DESC
LIMIT 1;
```

### Тест 3: RLS проверка
```sql
-- Отключить RLS временно
ALTER TABLE evidence DISABLE ROW LEVEL SECURITY;
-- Попробовать загрузить
-- Включить обратно
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
```

### Тест 4: Прямой INSERT
```sql
-- Минуя весь код
INSERT INTO evidence (
  tenant_id,
  file_name,
  file_url,
  evidence_type_id,
  uploaded_by
) VALUES (
  '...',
  'test.pdf',
  'http://...',
  '[UUID типа]',
  '[user_id]'
);
```

---

## 📊 КОНТРОЛЬНЫЕ ТОЧКИ

1. ✅ Client отправляет
2. ❓ API получает
3. ❓ Service мапит
4. ❓ Repository вставляет
5. ❓ БД сохраняет
6. ❓ Валидация читает

Найдем где теряется!

