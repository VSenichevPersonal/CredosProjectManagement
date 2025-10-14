# Решение по переиспользованию мер между требованиями

**Дата:** 13 октября 2025  
**Решение:** Product Owner + Senior Architect  
**Stage:** 17

---

## ✅ ПРИНЯТОЕ РЕШЕНИЕ

### **Hybrid подход с master_control_id**

---

## 🏗️ АРХИТЕКТУРА

```
organization_controls (master - уровень организации)
├─ id, organization_id, template_id
├─ implementation_status
├─ implementation_date
├─ evidence_ids[] (массив доказательств)
└─ Одна мера на организацию + template

control_measures (instance - уровень compliance_record)
├─ id, compliance_record_id, requirement_id
├─ master_control_id ⭐ (FK to organization_controls)
├─ inherit_from_master (true/false)
├─ status (свой или от master)
└─ Наследует от master если inherit=true
```

---

## 🔄 КАК ЭТО РАБОТАЕТ

### Сценарий 1: Создание первой меры

```
Запись КИИ-002 → Создать меру "Политика ИБ"

1. Проверяем: есть ли master control?
   SELECT * FROM organization_controls
   WHERE organization_id = 'Щёкиноазот'
     AND template_id = AC-001
   
2. НЕТ → Создаем master control:
   INSERT INTO organization_controls (
     organization_id, template_id, status='not_implemented'
   )
   
3. Создаем control_measure:
   INSERT INTO control_measures (
     compliance_record_id = КИИ-002,
     master_control_id = [новый master],
     inherit_from_master = true
   )
```

### Сценарий 2: Создание второй меры (из того же template)

```
Запись ПДн-001 → Создать меру "Политика ИБ"

1. Проверяем: есть ли master control?
   ДА! (создали в сценарии 1)
   
2. Создаем control_measure:
   INSERT INTO control_measures (
     compliance_record_id = ПДн-001,
     master_control_id = [существующий master], ⭐
     inherit_from_master = true
   )
   
3. Мера автоматически наследует:
   - status от master
   - implementation_date от master
   - evidence_ids от master
```

### Сценарий 3: Загрузка доказательства

```
КИИ-002 → Мера "Политика ИБ" → Добавить доказательство

1. Загружаем доказательство:
   evidence_id = [новый evidence]
   
2. Создаем evidence_link:
   evidence_id → control_measure_id
   
3. Триггер автоматически:
   UPDATE organization_controls
   SET evidence_ids = array_append(evidence_ids, [новый evidence])
   WHERE id = master_control_id
   
4. ПДн-001 автоматически видит:
   ✅ Доказательство появляется (через master!)
   ✅ Мера считается выполненной
```

---

## 📊 ПОДДЕРЖКА STRICT/FLEXIBLE РЕЖИМОВ

### Комбинация 1: **Strict меры + Strict доказательства**

```
Requirement:
  measure_mode = strict
  evidence_type_mode = strict
  suggested_control_measure_template_ids = [AC-001, AC-002]
  allowed_evidence_type_ids = [policy, order]

Поведение:
1. Создается мера ТОЛЬКО из шаблона AC-001 или AC-002
2. Master control создается автоматически
3. Доказательство ТОЛЬКО типа policy или order
4. Evidence привязывается к master
5. Другие записи видят через master
```

### Комбинация 2: **Flexible меры + Strict доказательства**

```
Requirement:
  measure_mode = flexible
  evidence_type_mode = strict
  allowed_evidence_type_ids = [policy]

Поведение:
1. Можно создать любую меру (или из шаблона)
2. Если из шаблона → ищется/создается master
3. Доказательство ТОЛЬКО типа policy
4. Переиспользование работает
```

### Комбинация 3: **Strict меры + Flexible доказательства**

```
Requirement:
  measure_mode = strict
  evidence_type_mode = flexible

Поведение:
1. Мера ТОЛЬКО из шаблона
2. Master control обязательно
3. Любые доказательства
4. Все доказательства расшариваются через master
```

### Комбинация 4: **Flexible меры + Flexible доказательства**

```
Requirement:
  measure_mode = flexible
  evidence_type_mode = flexible

Поведение:
1. Любые меры
2. Master создается только если measure.template_id != null
3. Любые доказательства
4. Переиспользование опционально
```

---

## 🎨 UX ИНДИКАЦИЯ

### В карточке меры:

```tsx
{measure.master_control_id && (
  <Alert className="bg-blue-50 border-blue-200">
    <Info className="h-4 w-4" />
    <AlertDescription>
      🔗 Связано с организационным контролем
      
      {masterControl && (
        <div className="mt-2">
          <p>Используется в {sharedRequirementsCount} требованиях:</p>
          <ul>
            <li>КИИ-002 ✅</li>
            <li>ПДн-001 ✅</li>
            <li>ГИС-003 ⏳</li>
          </ul>
          
          <p className="mt-2">
            Доказательства ({masterControl.evidence_ids.length}):
            Загрузив доказательство здесь, оно появится во всех связанных мерах.
          </p>
        </div>
      )}
    </AlertDescription>
  </Alert>
)}
```

---

## 📋 РЕАЛИЗАЦИЯ

### Миграция 660 ✅ (создана)
- Поля в control_measures
- Поля в organization_controls
- View для наследования
- Функция find_or_create_master_control
- Триггер синхронизации evidence

### Service (следующий шаг)
```typescript
// services/master-control-service.ts
class MasterControlService {
  async findOrCreate(organizationId, templateId) { ... }
  async syncEvidence(masterId, evidenceId) { ... }
  async getSharedMeasures(masterId) { ... }
}
```

### UI (следующий шаг)
- Индикатор master control в карточке
- Список связанных требований
- Предупреждение при загрузке доказательства

---

## 🚀 ГОТОВО К РЕАЛИЗАЦИИ

**Запускай миграцию 660!** 

Затем доделаем логику и UI.

**Stage 17 - критический функционал!** 💪

