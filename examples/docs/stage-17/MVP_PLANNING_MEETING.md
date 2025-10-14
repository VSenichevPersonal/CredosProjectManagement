# Совещание: План разработки MVP мастера генерации документов ПДн

**Дата:** 13 октября 2025, 21:00  
**Участники:**
- **Продакт Оунер (PO)** - отвечает за бизнес-ценность, приоритеты
- **Главный Архитектор (ГА)** - отвечает за технические решения, архитектуру

---

## 📋 ПОВЕСТКА

1. Обзор текущего состояния (UI MVP)
2. Определение минимально жизнеспособного продукта
3. Приоритизация функций
4. Технические решения и архитектура
5. План разработки с оценками
6. Риски и митигация

---

## 1️⃣ ОБЗОР ТЕКУЩЕГО СОСТОЯНИЯ

### ГА: Что мы имеем сейчас?

**Готово (100%):**
- ✅ UI мастера (5 шагов)
- ✅ Навигация в sidebar
- ✅ Анкета для 152-ФЗ (~15 вопросов)
- ✅ Выбор провайдера (LLM/Human/Fine-tuned)
- ✅ Анимация процесса генерации
- ✅ Просмотр и редактирование документов
- ✅ Валидация форм

**Mock данные:**
- ⚠️ Пакеты документов (захардкожены)
- ⚠️ Уточняющие вопросы (статичные)
- ⚠️ Генерация (имитация)
- ⚠️ Сохранение (не пишется в БД)

### PO: Какую ценность это даёт пользователю?

**Сейчас:**
- 😕 Можно "поиграться" с интерфейсом
- 😕 Увидеть как это будет работать
- ❌ НЕ получить реальные документы

**Чтобы дать ценность:**
- ✅ Пользователь должен получить **настоящие документы**
- ✅ Документы должны быть **качественными** (не абстрактные)
- ✅ Процесс должен быть **быстрым** (обещали 5-10 минут)

---

## 2️⃣ ОПРЕДЕЛЕНИЕ MVP

### PO: Что такое минимально жизнеспособный продукт?

**Критерии MVP:**
1. ✅ Пользователь заходит в систему
2. ✅ Выбирает пакет "152-ФЗ ПДн"
3. ✅ Заполняет анкету
4. ✅ **Получает реальные документы (DOCX/PDF)**
5. ✅ Может скачать документы
6. ✅ Документы сохраняются в библиотеке

**НЕ обязательно для MVP:**
- ❌ Оплата (сделаем позже)
- ❌ Human провайдер (сначала только LLM)
- ❌ Fine-tuned модель (пока только Claude)
- ❌ Уточняющие вопросы от LLM (можно пропустить)
- ❌ Редактирование в браузере (можно потом)

### ГА: Технически это означает:

**Минимум:**
1. БД схема для пакетов и сессий
2. API для создания сессии мастера
3. API для генерации через Claude 4.5
4. Сохранение результатов в Document + DocumentVersion
5. Экспорт в DOCX

**Можно отложить:**
- Монетизация
- Уточняющие вопросы через LLM
- Human провайдер
- База знаний

---

## 3️⃣ ПРИОРИТИЗАЦИЯ (MoSCoW)

### Must Have (Обязательно для MVP)

**M1. Схема БД и типы**
- `document_packages` (пакеты документов)
- `document_generation_sessions` (сессии мастера)
- Типы: `DocumentPackage`, `GenerationSession`
- **Оценка:** 1 день

**M2. API для мастера**
- `GET /api/document-packages` - список пакетов
- `POST /api/document-wizard` - создать сессию
- `PATCH /api/document-wizard/:id` - сохранить ответы
- `POST /api/document-wizard/:id/generate` - запустить генерацию
- **Оценка:** 1 день

**M3. Интеграция Claude 4.5**
- Промпт для генерации Политики ПДн
- Промпт для генерации Инструкции ПДн
- Промпт для генерации ОРД
- Маппинг answers → промпт
- **Оценка:** 2-3 дня

**M4. Сохранение документов**
- Создание Document + DocumentVersion
- Связь с templateId
- Связь с organizationId
- **Оценка:** 1 день

**M5. Экспорт в DOCX**
- Markdown → DOCX конвертер
- Или использовать библиотеку (mammoth, docx)
- **Оценка:** 1 день

**M6. Подключение UI к API**
- Заменить mock данные на API вызовы
- Обработка ошибок
- Loading states
- **Оценка:** 1 день

**ИТОГО Must Have:** **7-8 дней**

---

### Should Have (Желательно)

**S1. Уточняющие вопросы от LLM**
- Генерация вопросов на основе ответов
- API endpoint для генерации
- **Оценка:** 1 день

**S2. Качество документов**
- Проверка полноты документа
- Валидация структуры
- Confidence score
- **Оценка:** 1 день

**S3. Шаблоны документов в БД**
- Таблица `document_templates`
- Загрузка шаблонов в контекст LLM
- **Оценка:** 1 день

**ИТОГО Should Have:** **3 дня**

---

### Could Have (Можно добавить)

**C1. База знаний**
- Структурированные статьи
- Интеграция с LLM
- **Оценка:** 2-3 дня

**C2. Редактирование в браузере**
- Rich text editor
- Сохранение изменений
- **Оценка:** 2 дня

**C3. Предпросмотр PDF**
- Генерация PDF
- Встроенный viewer
- **Оценка:** 1 день

---

### Won't Have (Не в этой версии)

**W1. Монетизация**
- Интеграция с YooKassa
- Billing
- **Когда:** После проверки спроса

**W2. Human провайдер**
- Интерфейс для экспертов
- Управление заказами
- **Когда:** После отладки LLM

**W3. Fine-tuned модель**
- Дообучение модели
- **Когда:** После накопления данных

---

## 4️⃣ ТЕХНИЧЕСКИЕ РЕШЕНИЯ

### ГА: Архитектурные решения

#### 4.1 БД Схема

```sql
-- Пакеты документов
CREATE TABLE document_packages (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Классификация
  regulatory_framework_ids UUID[],
  regulators TEXT[],
  
  -- Документы в пакете
  document_template_ids UUID[],
  
  -- Анкета (JSON)
  questionnaire JSONB NOT NULL,
  
  -- Метаданные
  documents_count INT NOT NULL,
  estimated_time_minutes INT,
  complexity VARCHAR(20), -- 'simple' | 'medium' | 'complex'
  
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Сессии мастера
CREATE TABLE document_generation_sessions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  package_id UUID NOT NULL REFERENCES document_packages(id),
  
  -- Ответы на анкету (JSON)
  answers JSONB NOT NULL DEFAULT '{}',
  
  -- Уточнения (опционально)
  clarifications JSONB DEFAULT '{}',
  
  -- Выбранный провайдер
  provider_type VARCHAR(20), -- 'llm' | 'finetuned' | 'human'
  provider_config JSONB,
  
  -- Статус
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  -- 'draft' | 'clarifying' | 'pending' | 'processing' | 'completed' | 'failed'
  
  current_step INT DEFAULT 1,
  
  -- Результаты (JSON массив документов)
  generated_documents JSONB,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Связь сессии с созданными документами
CREATE TABLE session_documents (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES document_generation_sessions(id),
  document_id UUID NOT NULL REFERENCES evidence(id),
  
  template_id UUID,
  confidence_score INT, -- 0-100
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.2 Сервисы

```typescript
// services/document-package-service.ts
class DocumentPackageService {
  static async list(ctx: ExecutionContext): Promise<DocumentPackage[]>
  static async getById(ctx: ExecutionContext, id: string): Promise<DocumentPackage>
}

// services/document-generation-wizard-service.ts
class DocumentGenerationWizardService {
  static async startWizard(
    ctx: ExecutionContext,
    packageId: string,
    organizationId: string
  ): Promise<GenerationSession>
  
  static async saveAnswers(
    ctx: ExecutionContext,
    sessionId: string,
    answers: Record<string, any>
  ): Promise<GenerationSession>
  
  static async generateDocuments(
    ctx: ExecutionContext,
    sessionId: string
  ): Promise<GeneratedDocument[]>
  
  static async saveDocuments(
    ctx: ExecutionContext,
    sessionId: string
  ): Promise<Document[]>
}

// services/document-generation-service.ts (LLM)
class DocumentGenerationService {
  static async generateDocument(
    template: DocumentTemplate,
    answers: Record<string, any>,
    context: GenerationContext
  ): Promise<GeneratedDocument>
}
```

#### 4.3 LLM Промпт-инжиниринг

**Системный промпт:**
```typescript
const SYSTEM_PROMPT = `
Ты эксперт по российскому законодательству в области защиты персональных данных (152-ФЗ).

ТВОЯ ЗАДАЧА:
Создать документ "${template.title}" для организации на основе данных анкеты.

ТРЕБОВАНИЯ:
1. Документ должен строго соответствовать 152-ФЗ
2. Используй точные формулировки из законодательства
3. Адаптируй документ под специфику организации
4. Включи все обязательные разделы
5. Используй реквизиты организации
6. Формат: Markdown с заголовками

ЗАПРЕЩЕНО:
- Выдумывать данные
- Использовать placeholder'ы типа "[НАЗВАНИЕ]"
- Копировать шаблон без адаптации
`

const USER_PROMPT = `
ДАННЫЕ ОРГАНИЗАЦИИ:
Название: ${answers["org-name"]}
ИНН: ${answers["org-inn"]}
Адрес: ${answers["org-address"]}

ОТВЕТСТВЕННЫЕ ЛИЦА:
За обработку ПДн: ${answers["responsible-processing-name"]}, ${answers["responsible-processing-position"]}
За безопасность ПДн: ${answers["responsible-security-name"]}, ${answers["responsible-security-position"]}

ОБЪЕМ ОБРАБОТКИ:
Количество субъектов: ${answers["pdn-volume"]}
Категории субъектов: ${answers["pdn-subjects"].join(", ")}

ИНФОРМАЦИОННЫЕ СИСТЕМЫ:
Используемое ПО: ${answers["ispdn-software"].join(", ")}
Расположение: ${answers["ispdn-location"]}

---

Создай документ "${template.title}".
`
```

#### 4.4 Экспорт в DOCX

**Библиотеки:**
- `docx` - создание DOCX из JS объектов
- Или `markdown-to-docx` - конвертация из Markdown

```typescript
import { Document, Packer, Paragraph, TextRun } from "docx"

async function exportToDocx(content: string, title: string): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: title,
              bold: true,
              size: 32,
            }),
          ],
        }),
        // ... парсинг markdown и создание параграфов
      ],
    }],
  })
  
  return await Packer.toBuffer(doc)
}
```

---

## 5️⃣ ПЛАН РАЗРАБОТКИ

### PO: Разбиваем на спринты

#### 🏃 Спринт 1: Backend Основа (3 дня)

**День 1: БД и типы**
- [ ] Миграция: `document_packages`, `document_generation_sessions`, `session_documents`
- [ ] Типы: `DocumentPackage`, `GenerationSession`
- [ ] Провайдеры: CRUD для пакетов и сессий
- [ ] Seed данные: пакет "152-ФЗ ПДн"

**День 2: API endpoints**
- [ ] `GET /api/document-packages`
- [ ] `GET /api/document-packages/:id`
- [ ] `POST /api/document-wizard` - создать сессию
- [ ] `PATCH /api/document-wizard/:id/answers` - сохранить ответы
- [ ] `POST /api/document-wizard/:id/generate` - запустить генерацию

**День 3: Подключение UI к API**
- [ ] Заменить mock пакетов на API
- [ ] Заменить mock сессии на API
- [ ] Обработка ошибок
- [ ] Loading states

**Результат Спринта 1:**
✅ UI работает с реальной БД
✅ Сессии сохраняются
✅ Генерация пока не работает (заглушка)

---

#### 🏃 Спринт 2: LLM Генерация (3-4 дня)

**День 4: Промпт-инжиниринг**
- [ ] Системный промпт для 152-ФЗ
- [ ] Промпт для Политики ПДн
- [ ] Промпт для Инструкции ПДн
- [ ] Промпт для ОРД
- [ ] Тестирование промптов в Claude Playground

**День 5: Интеграция Claude 4.5**
- [ ] `DocumentGenerationService.generateDocument()`
- [ ] Маппинг answers → промпт
- [ ] Вызов Claude API
- [ ] Парсинг ответа
- [ ] Обработка ошибок

**День 6: Сохранение результатов**
- [ ] Создание Document в таблице evidence
- [ ] Создание DocumentVersion
- [ ] Связь session → documents
- [ ] Обновление статуса сессии

**День 7 (опционально): Качество**
- [ ] Расчёт confidence score
- [ ] Валидация структуры документа
- [ ] Повторная генерация при низком качестве

**Результат Спринта 2:**
✅ Реальная генерация через Claude
✅ Документы сохраняются в БД
✅ Можно просмотреть в библиотеке

---

#### 🏃 Спринт 3: Экспорт и полировка (2-3 дня)

**День 8: Экспорт в DOCX**
- [ ] Интеграция библиотеки `docx`
- [ ] Парсинг Markdown → DOCX
- [ ] API endpoint: `GET /api/documents/:id/export/docx`
- [ ] Кнопка скачивания в UI

**День 9: UI полировка**
- [ ] Улучшение UX (тултипы, подсказки)
- [ ] Обработка edge cases
- [ ] Мобильная версия
- [ ] Исправление багов

**День 10 (опционально): Тестирование**
- [ ] E2E тест мастера
- [ ] Тестирование на реальных данных
- [ ] Проверка качества документов
- [ ] Исправление найденных проблем

**Результат Спринта 3:**
✅ Полноценный рабочий MVP
✅ Можно скачать DOCX
✅ Всё протестировано

---

### 📊 ИТОГОВАЯ ОЦЕНКА

| Этап | Дней | Статус |
|------|------|--------|
| Спринт 1: Backend основа | 3 | 📋 Ожидает |
| Спринт 2: LLM генерация | 3-4 | 📋 Ожидает |
| Спринт 3: Экспорт и полировка | 2-3 | 📋 Ожидает |
| **ИТОГО** | **8-10 дней** | |

**+ 1-2 дня буфер на непредвиденное**

**ВСЕГО: 9-12 дней до рабочего MVP**

---

## 6️⃣ РИСКИ И МИТИГАЦИЯ

### Технические риски

**Р1. Claude API может быть нестабильным**
- **Вероятность:** Средняя
- **Влияние:** Высокое
- **Митигация:**
  - Retry механизм (3 попытки)
  - Fallback на OpenAI gpt-4o
  - Очередь для запросов

**Р2. Качество генерации может быть низким**
- **Вероятность:** Средняя
- **Влияние:** Критическое
- **Митигация:**
  - Тщательный промпт-инжиниринг
  - Тестирование на 10+ вариантах анкет
  - Ручная проверка первых 20 генераций
  - Возможность редактирования в UI

**Р3. Экспорт в DOCX может быть сложным**
- **Вероятность:** Низкая
- **Влияние:** Среднее
- **Митигация:**
  - Использовать проверенную библиотеку (docx)
  - Простой формат (без сложных таблиц)
  - Fallback: экспорт в PDF

### Бизнес риски

**Р4. Пользователи могут быть недовольны качеством**
- **Вероятность:** Средняя
- **Влияние:** Высокое
- **Митигация:**
  - Четко обозначить что это AI (бета)
  - Возможность редактирования
  - Сбор обратной связи
  - Быстрые итерации улучшения

**Р5. Высокая стоимость Claude API**
- **Вероятность:** Высокая
- **Влияние:** Среднее
- **Митигация:**
  - Отслеживать стоимость запросов
  - Лимиты на количество генераций (10/день для бета)
  - Оптимизация промптов (уменьшение токенов)
  - Планировать монетизацию

---

## 7️⃣ МЕТРИКИ УСПЕХА MVP

### PO: Как мы поймём что MVP успешен?

**Функциональные метрики:**
- ✅ 100% пользователей завершают мастер без ошибок
- ✅ Генерация работает в 95%+ случаев
- ✅ Среднее время генерации < 10 минут
- ✅ 0 критических багов

**Качественные метрики:**
- ✅ Средний confidence score > 85%
- ✅ 80%+ пользователей довольны качеством документов
- ✅ < 20% документов требуют значительного редактирования

**Бизнес метрики:**
- ✅ 50+ генераций за первую неделю
- ✅ 70%+ пользователей скачивают документы
- ✅ 50%+ пользователей сохраняют в библиотеку
- ✅ NPS > 7

---

## 8️⃣ РЕШЕНИЯ СОВЕЩАНИЯ

### ✅ Что решили:

1. **MVP фокус:** Только LLM генерация, без оплаты и Human провайдера
2. **Срок:** 9-12 дней до рабочего MVP
3. **3 спринта:**
   - Спринт 1: Backend основа (3 дня)
   - Спринт 2: LLM генерация (3-4 дня)
   - Спринт 3: Экспорт и полировка (2-3 дня)
4. **Приоритет #1:** Качество генерации (промпт-инжиниринг)
5. **Буфер:** +1-2 дня на непредвиденное

### 📋 Действия:

**Сегодня (13 октября):**
- [x] UI готов и закоммичен
- [ ] Создать Jira tasks / Issues

**Завтра (14 октября):**
- [ ] Старт Спринта 1: Миграция БД
- [ ] Создание типов и провайдеров

**Через 3 дня (17 октября):**
- [ ] UI работает с реальной БД
- [ ] Старт Спринта 2: LLM

**Через 9-12 дней (22-25 октября):**
- [ ] Рабочий MVP
- [ ] Тестирование с реальными пользователями

---

## 9️⃣ NEXT STEPS

### ГА: Что делаю завтра?

**Утро (2-3 часа):**
1. Создать миграцию для 3х таблиц
2. Добавить типы в `types/domain/`
3. Создать провайдеры в `providers/supabase/`

**День (3-4 часа):**
4. API endpoints (5 штук)
5. Тесты API

**Вечер (2 часа):**
6. Подключить UI к API (заменить mock)

### PO: Что мне делать?

**Завтра:**
- [ ] Подготовить тестовые сценарии (5 разных организаций)
- [ ] Начать собирать примеры хороших документов (референс)

**Через 7 дней:**
- [ ] Протестировать первые генерации
- [ ] Дать фидбек по качеству

---

## 📊 ИТОГОВАЯ ROADMAP

```
Сегодня (13 окт):     ████ UI MVP готов
│
├─ Спринт 1 (14-16):  ████ Backend основа
│  ├─ День 1: БД и типы
│  ├─ День 2: API endpoints
│  └─ День 3: Подключение UI
│
├─ Спринт 2 (17-20):  ████ LLM генерация
│  ├─ День 4: Промпты
│  ├─ День 5: Claude интеграция
│  ├─ День 6: Сохранение
│  └─ День 7: Качество (опц.)
│
└─ Спринт 3 (21-23):  ████ Экспорт и полировка
   ├─ День 8: DOCX экспорт
   ├─ День 9: UI полировка
   └─ День 10: Тестирование (опц.)
   
Результат (22-25):    ✅ Рабочий MVP!
```

---

## ✅ AGREEMENT

**Мы согласны:**
- ✅ MVP = Реальная генерация документов через Claude 4.5
- ✅ Срок: 9-12 дней
- ✅ Без монетизации в первой версии
- ✅ Фокус на качестве генерации
- ✅ Экспорт в DOCX обязателен

**Подписи:**
- 👨‍💼 Продакт Оунер: Владимир
- 👨‍💻 Главный Архитектор: Claude (AI Assistant)

---

**Совещание завершено. Начинаем разработку! 🚀**

