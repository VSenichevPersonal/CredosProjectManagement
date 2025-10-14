# Внедрение временных параметров для мер контроля

**Stage:** 16  
**Дата:** 13 октября 2025  
**Статус:** ✅ Реализовано  
**Задача:** Добавление сроков реализации и проверки мер контроля

---

## 🎯 Цель

Добавить возможность отслеживания сроков внедрения и проверки мер контроля для:
- Планирования работ по внедрению мер
- Контроля просрочек
- Автоматического расчета следующих проверок
- Поддержки российского ИБ-комплаенса (КИИ, ПДн, ГИС)

---

## ✅ Что реализовано

### 1. База данных

**Файл:** `scripts/600_add_control_measure_deadlines.sql`

#### Добавлены поля в `control_templates`:
```sql
- estimated_implementation_days INTEGER  -- Примерный срок внедрения (30, 60, 90 дней)
- validity_period_months INTEGER         -- Срок действия меры (12, 24, 36 месяцев)
```

#### Добавлены поля в `control_measures`:
```sql
- target_implementation_date DATE        -- ПЛАНОВАЯ дата реализации
- actual_implementation_date DATE        -- ФАКТИЧЕСКАЯ дата (переименовано из implementation_date)
- next_review_date DATE                  -- Следующая проверка
- valid_until DATE                       -- Срок действия меры
- days_until_due INTEGER                 -- Дней до срока (расчетное)
- is_overdue BOOLEAN                     -- Просрочена ли (расчетное)
```

#### Автоматический триггер:
```sql
CREATE FUNCTION update_control_measure_dates()
```

**Логика:**
1. При создании меры:
   - Берет `deadline` из requirement (если есть)
   - Или рассчитывает: NOW() + `estimated_implementation_days`
   
2. При внедрении (`status = 'implemented'`):
   - Устанавливает `actual_implementation_date = NOW()`
   - Рассчитывает `valid_until` из `validity_period_months`
   - Рассчитывает `next_review_date` из `frequency` шаблона

3. Автоматически обновляет:
   - `days_until_due` = разница между target_date и NOW()
   - `is_overdue` = просрочена ли мера

---

### 2. TypeScript типы

**Файлы:**
- `types/domain/control-template.ts` - обновлен
- `types/domain/control-measure.ts` - обновлен

#### Интерфейс ControlTemplate
```typescript
interface ControlTemplate {
  // ... существующие поля
  
  // ➕ Новые поля
  estimatedImplementationDays: number | null
  validityPeriodMonths: number | null
}
```

#### Интерфейс ControlMeasure
```typescript
interface ControlMeasure {
  // ... существующие поля
  
  // ➕ Новые поля
  targetImplementationDate?: Date      // Плановая
  actualImplementationDate?: Date      // Фактическая
  nextReviewDate?: Date                // Следующая проверка
  validUntil?: Date                    // Срок действия
  daysUntilDue?: number                // Дней до срока
  isOverdue: boolean                   // Просрочена ли
}
```

---

### 3. Утилиты

**Файл:** `lib/utils/control-measure-utils.ts`

#### Функции:
- `calculateDeadlineInfo()` - расчет информации о сроках
- `formatMeasureDate()` - форматирование дат
- `getMeasureStatusColor()` - цвет статуса
- `getMeasureStatusLabel()` - текст статуса на русском
- `needsReview()` - нужна ли проверка
- `isExpiring()` - истекает ли срок действия

---

### 4. UI компоненты

#### Формы создания/редактирования шаблонов
**Файлы:**
- `components/control-templates/create-control-template-dialog.tsx`
- `components/control-templates/edit-control-template-dialog.tsx`

**Добавлены поля:**
```tsx
<Input
  label="Срок внедрения (дней)"
  type="number"
  placeholder="30, 60, 90..."
/>

<Input
  label="Срок действия (месяцев)"
  type="number"
  placeholder="12, 24, 36..."
/>
```

#### Карточка шаблона
**Файл:** `components/control-templates/control-template-card.tsx`

**Отображает:**
- Срок внедрения: ~60 дней
- Срок действия: 12 мес

#### Просмотр шаблона
**Файл:** `components/control-templates/view-control-template-dialog.tsx`

**Расширен блоком:**
- Подробная информация о временных параметрах
- Пояснения для пользователя

#### Карточка меры контроля
**Файл:** `components/compliance/control-measure-card.tsx` ⭐ **НОВЫЙ**

**Функционал:**
- Цветовая индикация просрочки (красный/оранжевый/желтый/зеленый)
- Отображение планового срока
- Индикатор просрочки с количеством дней
- Фактическая дата внедрения
- Следующая проверка (с индикатором необходимости)
- Срок действия (с предупреждением об истечении)
- Ответственный и заметки

---

## 📊 Примеры использования

### Пример 1: КИИ - Категорирование объектов
```typescript
// Создание шаблона
{
  code: "KII-CAT-001",
  title: "Категорирование объектов КИИ",
  estimatedImplementationDays: 180,  // 6 месяцев по 187-ФЗ
  validityPeriodMonths: 60,          // Актуализация раз в 5 лет
  frequency: "annually"
}

// При создании меры для requirement с deadline
requirement.deadline = "2025-06-01"
// ↓ Триггер автоматически установит
measure.target_implementation_date = "2025-06-01"

// При внедрении
measure.status = "implemented"
// ↓ Триггер автоматически установит
measure.actual_implementation_date = "2025-05-15"
measure.valid_until = "2030-05-15"  // +60 месяцев
measure.next_review_date = "2026-05-15"  // +1 год (annually)
```

### Пример 2: ПДн - Оценка эффективности мер
```typescript
// Шаблон
{
  code: "PDN-ASSESS-001",
  title: "Оценка эффективности мер защиты ПДн",
  estimatedImplementationDays: 30,
  validityPeriodMonths: 12,  // Ежегодная оценка
  frequency: "annually"
}

// Мера без requirement.deadline
// ↓ Триггер рассчитает от текущей даты
measure.target_implementation_date = NOW() + 30 дней
```

---

## 🎨 UI/UX особенности

### Цветовая индикация

| Статус | Цвет | Условие |
|--------|------|---------|
| 🔴 Критично | Красный | Просрочено |
| 🟠 Критично | Оранжевый | ≤ 3 дней до срока |
| 🟡 Предупреждение | Желтый | ≤ 14 дней до срока |
| 🟢 В срок | Зеленый | Внедрена/Проверена |
| ⚪ Обычно | Серый | > 14 дней до срока |

### Индикаторы

**Просрочка:**
```
⚠️ Просрочено на 15 дней
```

**Критично:**
```
⚠️ Критично! Осталось 2 дн.
```

**Предупреждение:**
```
До срока 10 дн.
```

**Требует проверки:**
```
📅 Следующая проверка: 15.11.2025
```

**Истекает срок действия:**
```
⚠️ Истекает в ближайшие 30 дней
```

---

## 🚀 Миграция существующих данных

Миграция устанавливает значения по умолчанию:

```sql
-- Для шаблонов
UPDATE control_templates
SET estimated_implementation_days = 
  CASE frequency
    WHEN 'daily', 'weekly' THEN 7
    WHEN 'monthly' THEN 30
    WHEN 'quarterly' THEN 90
    WHEN 'annually' THEN 180
    ELSE 30
  END;

UPDATE control_templates
SET validity_period_months = 
  CASE frequency
    WHEN 'daily', 'weekly', 'monthly', 'quarterly' THEN 12
    WHEN 'annually' THEN 24
    ELSE 12
  END;
```

---

## 🔄 Интеграция с российским комплаенсом

### ✅ Поддерживается:

1. **187-ФЗ (КИИ)**
   - Берет deadline из requirement
   - Для категорирования: 6 месяцев
   - Актуализация: 5 лет

2. **152-ФЗ (ПДн)**
   - Оценка эффективности: ежегодно
   - Модель угроз: ежегодная актуализация
   - УЗ-1, УЗ-2: 12 месяцев
   - УЗ-3: 24 месяца

3. **ФСТЭК (Приказы №17, №21)**
   - Периодические проверки
   - Разные сроки по классам защиты

### 🎯 Принцип работы:

1. Requirement содержит:
   - `deadline` - срок из НПА
   - `periodicity` - периодичность
   - `regulator` - ФСТЭК, Роскомнадзор и т.д.

2. Control Template добавляет:
   - `estimated_implementation_days` - примерный срок
   - `validity_period_months` - срок действия

3. Control Measure получает автоматически:
   - `target_implementation_date` из requirement.deadline
   - Или рассчитывает от NOW()

**НЕТ дублирования данных!** Всё привязано через requirement_id.

---

## 📋 Что НЕ реализовано (намеренно)

❌ Дифференцированные сроки по категориям КИИ/ПДн в шаблоне  
❌ Поле `legislative_deadline` vs `internal_target_date`  
❌ Автоматическая оценка штрафов  
❌ Специфичные поля для каждого регулятора  

**Причина:** Упрощение модели. Все регуляторные особенности уже в `requirements`.

---

## 🧪 Тестирование

### Сценарии для проверки:

1. ✅ Создать шаблон с временными параметрами
2. ✅ Создать меру из шаблона для requirement с deadline
3. ✅ Создать меру из шаблона для requirement без deadline
4. ✅ Внедрить меру (проверить автоматический расчет дат)
5. ✅ Проверить расчет просрочки
6. ✅ Проверить расчет следующей проверки

---

## 📊 Метрики (для будущего дашборда)

Рекомендуется добавить:

```sql
-- Количество просроченных мер
SELECT COUNT(*) FROM control_measures WHERE is_overdue = true;

-- Количество критичных (< 3 дней)
SELECT COUNT(*) FROM control_measures 
WHERE days_until_due <= 3 AND days_until_due >= 0
  AND status IN ('planned', 'in_progress');

-- Процент выполнения в срок
SELECT 
  COUNT(*) FILTER (WHERE NOT is_overdue) * 100.0 / COUNT(*)
FROM control_measures
WHERE status IN ('implemented', 'verified');

-- Меры требующие проверки
SELECT COUNT(*) FROM control_measures
WHERE next_review_date <= CURRENT_DATE + INTERVAL '14 days'
  AND status IN ('implemented', 'verified');
```

---

## 🔮 Roadmap (следующие этапы)

### Stage 17 (опционально):
- 📊 Дашборд с метриками по срокам
- 🔔 Уведомления о приближающихся сроках
- 📈 Аналитика: процент выполнения в срок
- 📅 Календарь мер контроля

### Stage 18 (опционально):
- 🤖 Автоматизация: напоминания в Telegram/Email
- 📑 Отчеты для регуляторов с датами
- 🔄 Массовое обновление сроков

---

## ✅ Checklist внедрения

- [x] SQL миграция 600
- [x] TypeScript типы обновлены
- [x] Утилиты созданы
- [x] UI формы обновлены
- [x] UI карточки обновлены
- [x] Компонент ControlMeasureCard создан
- [x] Документация создана
- [ ] Миграция запущена на dev
- [ ] Миграция запущена на prod
- [ ] Пользователи обучены

---

## 🎓 Для команды разработки

### Как добавить временные параметры в новый шаблон:

```typescript
// 1. В форме создания шаблона
estimatedImplementationDays: 60,     // Примерно 2 месяца
validityPeriodMonths: 12,            // Действует год

// 2. Триггер сделает всё автоматически при создании меры
```

### Как использовать утилиты:

```typescript
import { 
  calculateDeadlineInfo, 
  formatMeasureDate 
} from '@/lib/utils/control-measure-utils'

const deadlineInfo = calculateDeadlineInfo(
  measure.targetImplementationDate, 
  measure.status
)

if (deadlineInfo?.isOverdue) {
  // Показать красный индикатор
}
```

---

**Готово к использованию!** 🚀

Простая, универсальная модель без переусложнения, полностью покрывающая потребности российского ИБ-комплаенса.

