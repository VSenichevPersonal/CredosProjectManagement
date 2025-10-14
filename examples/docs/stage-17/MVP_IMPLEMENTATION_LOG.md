# MVP Мастера генерации документов - Лог реализации

**Дата:** 13 октября 2025  
**Статус:** ✅ Базовая структура создана (не закоммичено)

---

## 📦 ЧТО СОЗДАНО

### 1. Навигация (Sidebar)

**Файл:** `components/layout/app-sidebar.tsx`

**Изменения:**
- Добавлен импорт иконки `FilePlus2`
- Убран пункт "Документы" из группы "Управление соответствием"
- Создана новая группа "ДОКУМЕНТЫ" с двумя пунктами:
  - "Библиотека документов" → `/documents`
  - "Создание документов" → `/documents/wizard/new`

---

### 2. Страница выбора категории

**Файл:** `app/(dashboard)/documents/wizard/new/page.tsx`

**Функционал:**
- Отображение доступных пакетов документов (карточки)
- Пакет "152-ФЗ ПДн" - доступен
- Остальные пакеты - "В разработке"
- AI баннер с информацией
- Инструкция "Как это работает" (4 шага)

**Компоненты UI:**
- Card, Badge, Button
- Метаданные для SEO

---

### 3. Страница мастера

**Файл:** `app/(dashboard)/documents/wizard/[id]/page.tsx`

**Функционал:**
- Динамический роут `[id]` для packageId
- Валидация существования пакета
- Редирект на `/documents/wizard/new` если пакет не существует
- Рендер компонента `DocumentWizardComponent`

---

### 4. Основной компонент мастера

**Файл:** `components/documents/document-wizard.tsx`

**Структура:**
- 5 шагов мастера (конфигурируемые)
- Прогресс-бар
- Визуальные индикаторы шагов
- Навигация (Назад/Далее)
- Управление состоянием wizardData

**Шаги:**
1. Заполнение анкеты
2. Уточняющие вопросы
3. Выбор провайдера
4. Генерация документов
5. Просмотр и редактирование

---

### 5. Компоненты шагов

#### 5.1 QuestionnaireStep
**Файл:** `components/documents/wizard-steps/questionnaire-step.tsx`

**Функционал:**
- Анкета для 152-ФЗ (4 раздела, ~15 вопросов)
- Типы вопросов: text, select, multiselect
- Валидация обязательных полей
- Состояние answers
- Разделы:
  1. Информация об организации
  2. Объем обработки ПДн
  3. Ответственные лица
  4. Информационные системы

#### 5.2 ClarificationStep
**Файл:** `components/documents/wizard-steps/clarification-step.tsx`

**Функционал:**
- 3 уточняющих вопроса (mock data)
- Предложенные варианты ответов (кнопки)
- Свободное текстовое поле
- Кнопка "Пропустить"

#### 5.3 ProviderSelectionStep
**Файл:** `components/documents/wizard-steps/provider-selection-step.tsx`

**Функционал:**
- 3 провайдера (карточки):
  - **LLM (Claude 4.5)** - 500₽, 5-10 мин (доступен, рекомендуем)
  - **Fine-tuned** - 1500₽, 15-20 мин (скоро)
  - **Human Expert** - 15000₽, 2-3 дня (скоро)
- Характеристики: скорость, качество, цена
- Список возможностей
- Выбор провайдера (radio-style)

#### 5.4 GenerationProgressStep
**Файл:** `components/documents/wizard-steps/generation-progress-step.tsx`

**Функционал:**
- 7 этапов генерации (анимированные)
- Прогресс-бар
- Статусы: pending, in_progress, completed
- Автоматический переход к следующему шагу
- Имитация процесса генерации (~6 секунд)

**Этапы:**
1. Подготовка контекста
2. Анализ ответов
3-5. Генерация 3х документов
6. Проверка качества
7. Финализация

#### 5.5 DocumentReviewStep
**Файл:** `components/documents/wizard-steps/document-review-step.tsx`

**Функционал:**
- Табы для каждого документа
- Просмотр содержимого
- Редактирование (inline textarea)
- Badge с уверенностью (confidence)
- Предупреждения при confidence < 90%
- Кнопки: "Редактировать", "Скачать DOCX"
- Финальная кнопка "Сохранить все документы"
- Редирект на `/documents` после сохранения

---

### 6. Индексные файлы

**Файлы:**
- `components/documents/wizard-steps/index.ts` - экспорт всех шагов
- `components/documents/index.ts` - экспорт всех компонентов документов

---

## 📊 СТАТИСТИКА

### Созданные файлы

```
✅ 1 файл обновлен:
   - components/layout/app-sidebar.tsx

✅ 10 новых файлов:
   - app/(dashboard)/documents/wizard/new/page.tsx
   - app/(dashboard)/documents/wizard/[id]/page.tsx
   - components/documents/document-wizard.tsx
   - components/documents/wizard-steps/questionnaire-step.tsx
   - components/documents/wizard-steps/clarification-step.tsx
   - components/documents/wizard-steps/provider-selection-step.tsx
   - components/documents/wizard-steps/generation-progress-step.tsx
   - components/documents/wizard-steps/document-review-step.tsx
   - components/documents/wizard-steps/index.ts
   - components/documents/index.ts

📝 Всего: 11 файлов
📏 Строк кода: ~1500
```

### Использованные компоненты UI

```typescript
// shadcn/ui компоненты:
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Button
- Badge
- Input, Label
- Select, SelectTrigger, SelectValue, SelectContent, SelectItem
- Checkbox
- Textarea
- Progress
- Alert, AlertDescription
- Tabs, TabsList, TabsTrigger, TabsContent

// lucide-react иконки:
- Sparkles, FileStack, Shield, Scale, Factory, ShieldCheck
- FilePlus2, Files
- ChevronRight, ChevronLeft, ChevronDown
- Check, Loader2, AlertCircle, AlertTriangle
- FileText, Brain, User, Clock, DollarSign
- Edit, Save, Download
```

---

## 🎨 ДИЗАЙН И UX

### Цветовая схема

```
- Primary: зеленый (#22aa7d, #4ab994)
- Провайдеры:
  - LLM: синий (blue-600)
  - Fine-tuned: фиолетовый (purple-600)
  - Human: оранжевый (orange-600)
- Статусы:
  - Успех: зеленый (green-500)
  - Предупреждение: желтый (yellow-100)
  - Ошибка: красный (red-500)
```

### Анимации

```
- Loader2 spin (генерация)
- Progress bar (прогресс)
- Плавные переходы между шагами
- Hover эффекты на карточках
```

---

## 🔄 ПОТОК ДАННЫХ

### WizardData Structure

```typescript
{
  packageId: string
  
  // Шаг 1: Анкета
  answers: {
    "org-name": string
    "org-inn": string
    "org-address": string
    "org-type": string
    "employee-count": string
    "pdn-volume": string
    "pdn-subjects": string[]
    "responsible-processing-name": string
    "responsible-processing-position": string
    "responsible-security-name": string
    "responsible-security-position": string
    "ispdn-software": string[]
    "ispdn-location": string
  }
  
  // Шаг 2: Уточнения
  clarifications: {
    "clarify-1": string
    "clarify-2": string
    "clarify-3": string
  }
  
  // Шаг 3: Провайдер
  selectedProvider: {
    id: string
    type: "llm" | "finetuned" | "human"
    name: string
    price: string
    priceAmount: number
    estimatedTime: string
  }
  
  // Шаг 4: Сгенерированные документы
  generatedDocuments: Array<{
    id: string
    title: string
    content: string
    confidence: number
  }>
}
```

---

## ✅ ГОТОВО

- [x] Навигация (sidebar)
- [x] Страница выбора категории
- [x] Страница мастера
- [x] Основной компонент мастера
- [x] Шаг 1: Анкета
- [x] Шаг 2: Уточняющие вопросы
- [x] Шаг 3: Выбор провайдера
- [x] Шаг 4: Прогресс генерации
- [x] Шаг 5: Просмотр и редактирование
- [x] Индексные файлы
- [x] Проверка линтера (0 ошибок)

---

## 🚧 ЧТО ДАЛЬШЕ (Backend)

### Следующие шаги для полноценного MVP:

1. **Типы данных (БД)**
   - [ ] `document_packages` таблица
   - [ ] `document_generation_wizards` таблица
   - [ ] `questionnaire_definitions` (JSON в БД или отдельная таблица)

2. **API Endpoints**
   - [ ] `GET /api/document-packages` - список пакетов
   - [ ] `GET /api/document-packages/:id` - пакет по ID
   - [ ] `POST /api/document-wizard` - создать сессию мастера
   - [ ] `PATCH /api/document-wizard/:id` - обновить сессию
   - [ ] `POST /api/document-wizard/:id/generate` - запустить генерацию

3. **Сервисы**
   - [ ] `DocumentPackageService`
   - [ ] `DocumentGenerationWizardService`
   - [ ] `DocumentGenerationService` (LLM)

4. **LLM Интеграция**
   - [ ] Промпты для генерации уточняющих вопросов
   - [ ] Промпты для генерации документов
   - [ ] Интеграция с Claude 4.5

5. **Генерация документов**
   - [ ] Загрузка шаблонов в контекст
   - [ ] Маппинг answers → документ
   - [ ] Сохранение как Document + DocumentVersion

---

## 📝 ЗАМЕТКИ

### Временные данные (mock)

- Пакеты: захардкожены в `new/page.tsx`
- Анкета: захардкожена в `questionnaire-step.tsx`
- Уточняющие вопросы: mock в `clarification-step.tsx`
- Провайдеры: захардкожены в `provider-selection-step.tsx`
- Генерация: имитация с таймерами

### Что заменить на реальное

1. `documentPackages` → API `GET /api/document-packages`
2. `questionnaire152FZ` → API `GET /api/document-packages/:id` (с questionnaire)
3. `mockClarifications` → API `POST /api/llm/clarifications` (LLM)
4. Генерация → API `POST /api/document-wizard/:id/generate`
5. Сохранение → API `POST /api/documents/batch-create`

---

**Статус:** Готово к тестированию UI. Backend следующий! 🚀

