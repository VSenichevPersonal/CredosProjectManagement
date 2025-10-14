# Типизация и классификация мер контроля

**Дата:** 13 октября 2025  
**Роль:** Product Owner + Architect + UI Engineer  
**Цель:** Определить типизацию мер на основе Drata, Vanta и российского ИБ

---

## 🌍 Анализ международных практик

### Drata (США, SOC 2)
```
Control Categories:
- Access Control (Контроль доступа)
- System Operations (Системные операции)  
- Change Management (Управление изменениями)
- Risk Assessment (Оценка рисков)
- Vendor Management (Управление поставщиками)
- Incident Response (Реагирование на инциденты)
- Data Protection (Защита данных)

Control Types:
- Technical (Технические)
- Administrative (Административные)
- Physical (Физические)

Automation Level:
- Automated (Автоматизировано)
- Manual (Ручное)
- Hybrid (Гибридное)
```

### Vanta (США, множественные фреймворки)
```
Control Families (по SOC 2):
- CC1: Control Environment
- CC2: Communication  
- CC3: Risk Assessment
- CC4: Monitoring
- CC5: Control Activities
- CC6: Logical Access
- CC7: System Operations
- CC8: Change Management
- CC9: Risk Mitigation

Implementation Status:
- Not Started
- In Progress
- Implemented
- Validated
```

---

## 🇷🇺 Российские требования

### ФСТЭК (Приказ №17, №21)
```
Классы мер (по уровням):
1. Идентификация и аутентификация (ИАА)
2. Управление доступом (УД)
3. Ограничение программной среды (ОПС)
4. Защита машинных носителей (ЗНИ)
5. Регистрация событий (РСБ)
6. Антивирусная защита (АНЗ)
7. Обнаружение вторжений (ОВ)
8. Контроль целостности (КЦ)

Типы по природе:
- Организационные
- Технические
```

### 152-ФЗ (Персональные данные)
```
Уровни защищённости (УЗ):
- УЗ-1 (высокий)
- УЗ-2 (средний)
- УЗ-3 (низкий)
- УЗ-4 (базовый)

Типы мер:
- Правовые
- Организационные
- Технические
```

---

## 🎯 Рекомендуемая типизация для нашей системы

### 1. Категория (Category) - Главная группировка

**Основано на ФСТЭК + SOC 2:**

```typescript
type MeasureCategory = 
  | "AC"  // Access Control - Контроль доступа (ИАА + УД)
  | "NS"  // Network Security - Сетевая безопасность
  | "DP"  // Data Protection - Защита данных (ЗНИ + КЦ)
  | "VM"  // Vulnerability Management - Управление уязвимостями (АНЗ + ОВ)
  | "IR"  // Incident Response - Реагирование на инциденты (РСБ)
  | "CM"  // Change Management - Управление изменениями
  | "CA"  // Compliance & Audit - Комплаенс и аудит
  | "RM"  // Risk Management - Управление рисками
  | "BC"  // Business Continuity - Непрерывность бизнеса
```

**UI отображение:**
```
AC-001  [🔐 Контроль доступа]
NS-003  [🌐 Сетевая безопасность]
DP-002  [🛡️ Защита данных]
```

### 2. Тип меры (Control Type) - По природе реализации

```typescript
type ControlType =
  | "technical"       // Технические (ПО, железо, настройки)
  | "administrative"  // Административные (политики, процедуры)
  | "physical"        // Физические (охрана, замки, камеры)
```

**UI badges:**
```
⚙️ Технические
📋 Административные  
🏢 Физические
```

### 3. Тип по назначению (Measure Type) - Когда применяется

```typescript
type MeasureType =
  | "preventive"   // Превентивные (предотвращают)
  | "detective"    // Детективные (обнаруживают)
  | "corrective"   // Корректирующие (исправляют)
  | "compensating" // Компенсирующие (заменяют)
```

**UI badges:**
```
🛡️ Превентивные
🔍 Детективные
🔧 Корректирующие
↔️ Компенсирующие
```

### 4. Частота проверки (Frequency)

```typescript
type Frequency =
  | "continuous"  // Постоянно (автоматический мониторинг)
  | "daily"       // Ежедневно
  | "weekly"      // Еженедельно
  | "monthly"     // Ежемесячно
  | "quarterly"   // Ежеквартально
  | "annually"    // Ежегодно
  | "on_demand"   // По требованию
```

**UI:**
```
⏱️ Ежедневно
📅 Ежемесячно
📆 Ежегодно
```

### 5. Автоматизация (Automation)

```typescript
type AutomationLevel =
  | "automated"  // Полностью автоматизировано
  | "manual"     // Полностью ручное
  | "hybrid"     // Частично автоматизировано
```

**UI:**
```
🤖 Ручное
⚙️ Автоматизировано
🔄 Гибридное
```

### 6. Видимость (Visibility) - Новое!

```typescript
type Visibility =
  | "private"    // Приватная (только для создателя)
  | "tenant"     // Для тенанта (все организации видят)
  | "public"     // Публичная (маркетплейс, все тенанты)
```

**UI:**
```
🔒 Приватная
🏢 Принятая
🌐 Публичная
```

---

## 🎨 Рекомендуемые badges для UI

### На карточке меры (как на скриншоте):

```
┌─────────────────────────────────────────────┐
│ AC-001   [🔐 Контроль доступа]              │
│                                              │
│ Настройка парольной политики                │
│                                              │
│ ТИП МЕРЫ:           [⚙️ Технические]        │
│ НАЗНАЧЕНИЕ:         [🛡️ Превентивные]       │
│ ЧАСТОТА ПРОВЕРКИ:   [📅 Ежемесячно]         │
│ АВТОМАТИЗАЦИЯ:      [🤖 Ручное]             │
│ ВИДИМОСТЬ:          [🏢 Принятая]           │
└─────────────────────────────────────────────┘
```

### В таблице типовых мер:

| Код | Название | Категория | Тип | Назначение | Частота | Авто |
|-----|----------|-----------|-----|------------|---------|------|
| AC-001 | Парольная политика | 🔐 КД | ⚙️ Техн | 🛡️ Прев | 📅 Мес | 🤖 |
| NS-001 | Firewall | 🌐 СБ | ⚙️ Техн | 🛡️ Прев | ⏱️ Пост | ⚙️ |

---

## 🗄️ Структура БД

```sql
ALTER TABLE control_measure_templates ADD COLUMN IF NOT EXISTS
  category VARCHAR(10),              -- AC, NS, DP, VM, etc
  control_type VARCHAR(20),          -- technical, administrative, physical
  measure_type VARCHAR(20),          -- preventive, detective, corrective
  frequency VARCHAR(20),             -- continuous, daily, monthly, etc
  is_automated BOOLEAN,              -- true/false
  automation_level VARCHAR(20),      -- automated, manual, hybrid
  visibility VARCHAR(20);            -- private, tenant, public
```

---

## 📊 Mapping: International ↔ Russian

| Drata/Vanta | ФСТЭК | Наша система |
|-------------|-------|--------------|
| Access Control | ИАА + УД | AC (Контроль доступа) |
| System Operations | РСБ + КЦ | NS + DP |
| Data Protection | ЗНИ | DP (Защита данных) |
| Incident Response | - | IR (Реагирование) |

---

## 🎯 Рекомендации Product Owner

### Must Have (текущая реализация):
- ✅ Category (AC, NS, DP...) - уже есть
- ✅ Control Type - уже есть  
- ✅ Frequency - уже есть
- ✅ Is Automated - уже есть

### Should Add:
- ⏳ Measure Type (preventive/detective/corrective)
- ⏳ Automation Level (вместо boolean)
- ⏳ Visibility (private/tenant/public)

### Nice to Have:
- 💡 Compliance Framework mapping (SOC2, ISO27001, ФСТЭК)
- 💡 Risk Level (low/medium/high/critical)
- 💡 Implementation Complexity (simple/medium/complex)

---

**Следующий шаг:** Обновить БД и UI с новой типизацией?
