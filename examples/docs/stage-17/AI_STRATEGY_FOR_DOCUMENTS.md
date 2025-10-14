# Стратегия AI для генерации и анализа документов

**Дата:** 13 октября 2025  
**Stage:** 17  
**Хостинг:** Railway (временно, был Vercel)

---

## 🤖 ТЕКУЩАЯ РЕАЛИЗАЦИЯ

### Что уже есть:

```typescript
// lib/providers/llm/
├─ llm-factory.ts
├─ openai-provider.ts      // gpt-4o
├─ anthropic-provider.ts   // claude-sonnet-4.5 ⭐
└─ llm-provider.interface.ts

// Используется через Vercel AI SDK
import { generateText } from "ai"
```

**Функционал:**
- ✅ Анализ изменений между версиями документов
- ✅ Выявление критичных изменений
- ✅ Оценка влияния на комплаенс
- ✅ Рекомендации по действиям

---

## 🎯 ВОПРОС: OpenAI Assistant vs API vs Claude 4.5?

### Вариант 1: **OpenAI API (текущая)** 

**Плюсы:**
- ✅ Уже реализовано
- ✅ gpt-4o быстрый
- ✅ Хороший для коротких анализов
- ✅ Дешевле Assistant API

**Минусы:**
- ❌ Контекст: 128K токенов
- ❌ Нужно каждый раз передавать весь контекст
- ❌ Нет долговременной памяти
- ❌ Дороже Claude для больших документов

**Стоимость:**
- gpt-4o: $5/1M input, $15/1M output
- Для документа 50 страниц (~30K токенов): $0.15-0.45

---

### Вариант 2: **OpenAI Assistant API**

**Плюсы:**
- ✅ Векторное хранилище (можно обучить на всех шаблонах)
- ✅ Долговременная память
- ✅ Function calling
- ✅ Code interpreter
- ✅ File retrieval (загрузка .docx/.pdf)

**Минусы:**
- ❌ Дороже обычного API
- ❌ Нужна настройка Assistant
- ❌ Сложнее в использовании
- ❌ Медленнее

**Стоимость:**
- Базовая + retrieval: $0.20/GB/день хранения
- Для базы из 100 шаблонов: ~$6/месяц

**Применение:**
```typescript
// Создать Assistant один раз
const assistant = await openai.beta.assistants.create({
  name: "IB Compliance Document Generator",
  instructions: `
    Ты эксперт по российскому ИБ-комплаенсу.
    У тебя есть доступ к шаблонам документов для:
    - 187-ФЗ (КИИ)
    - 152-ФЗ (ПДн)
    - Приказы ФСТЭК №17, №21
    
    Генерируй документы строго по российским стандартам.
  `,
  model: "gpt-4o",
  tools: [{ type: "retrieval" }],  // Доступ к файлам
  file_ids: [шаблоны_file_ids]
})

// Использовать
const thread = await openai.beta.threads.create()
await openai.beta.threads.messages.create(thread.id, {
  role: "user",
  content: "Создай Политику ИБ для АО Щёкиноазот (КИИ категория 2)"
})
const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: assistant.id
})
```

---

### Вариант 3: **Claude 4.5 Sonnet (1M токенов!)** ⭐ РЕКОМЕНДУЮ

**Плюсы:**
- ✅ **1M токенов контекста!** 🔥
- ✅ Можно передать ВСЕ шаблоны сразу (100+ документов)
- ✅ Качество выше для длинных документов
- ✅ Лучше понимает структуру
- ✅ Дешевле для больших объемов

**Минусы:**
- ❌ Нет vector store (но не нужен с 1M!)
- ❌ Нет code interpreter
- ❌ Чуть медленнее gpt-4o

**Стоимость:**
- Claude Sonnet 4.5: $3/1M input, $15/1M output
- Для 100 шаблонов (500K токенов): $1.50 input
- **ДЕШЕВЛЕ** чем gpt-4o для больших контекстов!

**Применение:**
```typescript
const { generateText } = await import("ai")

// Передаем ВСЕ шаблоны в контексте
const allTemplates = await loadAllTemplates()  // 100+ документов
const templatesContext = allTemplates.map(t => 
  `[${t.code}] ${t.title}\n${t.content}`
).join('\n\n---\n\n')

const { text } = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  prompt: `
    Ты эксперт по российскому ИБ-комплаенсу.
    
    КОНТЕКСТ: У тебя есть следующие шаблоны документов:
    ${templatesContext}  // ⭐ ВСЕ 100 шаблонов в контексте!
    
    ЗАДАЧА: Создай Политику ИБ для:
    - Организация: АО Щёкиноазот
    - Категория КИИ: 2
    - Специфика: Химическое производство
    - Требования: 187-ФЗ, ФСТЭК №239
    
    Используй шаблон [policy-ib] и адаптируй под организацию.
  `,
  temperature: 0.3,
  maxTokens: 4096
})
```

---

## 🎯 РЕКОМЕНДАЦИЯ

### ✅ **Claude 4.5 Sonnet для генерации документов**

**Причины:**

1. **1M токенов = можем загрузить:**
   - Все 100+ шаблонов документов
   - Все НПА (187-ФЗ, 152-ФЗ, приказы ФСТЭК)
   - Примеры заполненных документов
   - Контекст организации
   - **В ОДНОМ запросе!**

2. **Стоимость:**
   - Input: $3/1M (дешевле gpt-4o для больших контекстов)
   - Output: $15/1M (как gpt-4o)
   - Для генерации документа: $0.50-1.00

3. **Качество:**
   - Лучше понимает длинные документы
   - Лучше структурирует
   - Лучше следует инструкциям

4. **Уже реализовано!**
   - anthropic-provider.ts готов
   - claude-sonnet-4.5 по умолчанию
   - Через Vercel AI SDK

---

### ✅ **OpenAI gpt-4o для быстрых анализов**

**Использовать для:**
- Сравнение версий (diff analysis)
- Быстрые проверки
- Валидация заполнения
- Короткие документы

**Причины:**
- Быстрее Claude
- Дешевле для коротких запросов
- Уже настроено

---

### ❌ **OpenAI Assistant - НЕ НУЖЕН**

**Причина:** С Claude 4.5 (1M токенов) можем передать весь контекст сразу. Vector store не нужен!

**Экономия:**
- Не платим за хранение ($6/мес)
- Проще в использовании
- Один запрос вместо thread/run/poll

---

## 📋 СТРАТЕГИЯ ИСПОЛЬЗОВАНИЯ

### **Генерация документов:**

```typescript
// services/document-generation-service.ts

class DocumentGenerationService {
  async generateFromTemplate(
    templateId: string,
    organizationId: string,
    customizations: any
  ) {
    // 1. Загрузить ВСЕ шаблоны для контекста
    const allTemplates = await this.loadAllTemplates()
    
    // 2. Загрузить НПА для контекста
    const regulations = await this.loadRegulations()
    
    // 3. Загрузить данные организации
    const org = await this.getOrganization(organizationId)
    
    // 4. Использовать Claude 4.5 с ПОЛНЫМ контекстом
    const llm = LLMFactory.create('anthropic', 'claude-sonnet-4.5')
    
    const result = await llm.generateDocument({
      template: currentTemplate,
      allTemplates,  // Для референсов
      regulations,   // Для точности
      organization: org,
      customizations
    })
    
    return result
  }
}
```

### **Анализ изменений:**

```typescript
// Быстрый diff - используем gpt-4o
const llm = LLMFactory.create('openai', 'gpt-4o')
const diff = await llm.analyzeDocumentChanges(...)

// Глубокий анализ - используем Claude
const llm = LLMFactory.create('anthropic', 'claude-sonnet-4.5')
const analysis = await llm.deepAnalyze(...)
```

---

## ⚙️ КОНФИГУРАЦИЯ

### .env переменные:

```bash
# AI Providers (через Vercel AI SDK)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Логирование
LOG_LEVEL=info  # trace | debug | info | warn | error

# Railway (новый хостинг)
RAILWAY_ENVIRONMENT=production
RAILWAY_PROJECT_ID=...

# По умолчанию для документов
DEFAULT_LLM_PROVIDER=anthropic  # anthropic | openai
DEFAULT_LLM_MODEL=claude-sonnet-4.5  # или gpt-4o

# Лимиты
MAX_TOKENS_PER_REQUEST=8192
DOCUMENT_GENERATION_TIMEOUT_MS=60000
```

---

## 🚀 ПЛАН ВНЕДРЕНИЯ (Stage 17)

### Фаза 1: Настройка (1 день)

1. **Добавить переменные окружения:**
   ```bash
   # .env.local
   ANTHROPIC_API_KEY=sk-ant-...
   DEFAULT_LLM_PROVIDER=anthropic
   LOG_LEVEL=info
   ```

2. **Обновить llm-factory:**
   ```typescript
   static getDefault() {
     const provider = process.env.DEFAULT_LLM_PROVIDER || 'anthropic'
     const model = process.env.DEFAULT_LLM_MODEL || 'claude-sonnet-4.5'
     return this.create(provider, model)
   }
   ```

3. **Создать DocumentGenerationService**

---

### Фаза 2: Генерация документов (2-3 дня)

1. **Загрузка контекста:**
   - Все шаблоны документов
   - НПА и регуляции
   - Примеры документов

2. **Промпт-инжиниринг:**
   - Системный промпт для российского комплаенса
   - Структурированный вывод
   - Валидация результата

3. **UI:**
   - Кнопка "Генерировать из шаблона"
   - Предпросмотр сгенерированного
   - Редактирование перед сохранением

---

### Фаза 3: Умные фичи (1-2 дня)

1. **Auto-fill полей:**
   - Подставить название организации
   - Подставить дату
   - Подставить ответственных

2. **Валидация:**
   - Проверка наличия обязательных разделов
   - Проверка ссылок на НПА
   - Проверка реквизитов

3. **Актуализация:**
   - Автообновление при изменении НПА
   - Сравнение со старой версией
   - Предложения изменений

---

## 💡 РЕКОМЕНДАЦИЯ

### ✅ **Использовать Claude 4.5 Sonnet**

**Для:**
- Генерация документов из шаблонов
- Глубокий анализ изменений
- Актуализация при изменении НПА
- Пакетная обработка документов

**Настройка:**
```typescript
const llm = LLMFactory.create('anthropic', 'claude-sonnet-4.5')

// Загружаем ВСЕ шаблоны в контекст (1M токенов!)
const context = {
  templates: allTemplates,      // 100+ документов
  regulations: allRegulations,   // 187-ФЗ, 152-ФЗ, приказы
  examples: filledDocuments,     // Примеры заполнения
  organization: orgData          // Данные организации
}

// Генерируем
const document = await llm.generate({ context, task: '...' })
```

### ✅ **Оставить OpenAI gpt-4o**

**Для:**
- Быстрый diff между версиями
- Короткие анализы
- Валидация полей
- Real-time подсказки в UI

---

## 📊 СРАВНЕНИЕ

| Критерий | OpenAI gpt-4o | OpenAI Assistant | Claude 4.5 |
|----------|---------------|------------------|------------|
| **Контекст** | 128K | 128K + retrieval | **1M** 🔥 |
| **Скорость** | ⚡⚡⚡ Быстро | ⚡ Медленно | ⚡⚡ Средне |
| **Качество (RU)** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Стоимость** | $5+$15/1M | $5+$15/1M + storage | **$3+$15/1M** 💰 |
| **Длинные док-ты** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Простота** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Уже настроено** | ✅ | ❌ | ✅ |

**Вывод:** **Claude 4.5 Sonnet** - идеален для документов! ⭐

---

## 🎯 ИТОГОВАЯ РЕКОМЕНДАЦИЯ

### **Двухуровневая стратегия:**

```typescript
// 1. Для ГЕНЕРАЦИИ и ГЛУБОКОГО АНАЛИЗА
const documentLLM = LLMFactory.create('anthropic', 'claude-sonnet-4.5')

// 2. Для БЫСТРЫХ ПРОВЕРОК
const quickLLM = LLMFactory.create('openai', 'gpt-4o')
```

### **OpenAI Assistant НЕ НУЖЕН:**
- Claude с 1M токенов покрывает все потребности
- Дешевле
- Проще в использовании
- Нет затрат на storage

---

## ⚙️ НАСТРОЙКА

### 1. Переменные окружения (.env):

```bash
# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Defaults
DEFAULT_LLM_PROVIDER=anthropic
DEFAULT_DOCUMENT_LLM_MODEL=claude-sonnet-4.5
DEFAULT_QUICK_LLM_MODEL=gpt-4o

# Logging
LOG_LEVEL=info  # trace, debug, info, warn, error

# Railway
RAILWAY_ENVIRONMENT=production
DATABASE_URL=postgresql://...
```

### 2. Логгер уже настроен! ✅

```typescript
// lib/logger.ts
private minLevel: LogLevel = (
  typeof window === "undefined" 
    ? (process.env.LOG_LEVEL as LogLevel) || "trace" 
    : "trace"
)
```

**Использование:**
```typescript
logger.info("Document generated", { documentId, model: 'claude-4.5' })
logger.debug("Prompt", { prompt })  // Только если LOG_LEVEL=debug
logger.error("Generation failed", error)
```

---

## 🚀 БЫСТРЫЙ СТАРТ

### Что делать СЕЙЧАС:

1. ✅ **Добавить ANTHROPIC_API_KEY** в Railway env
2. ✅ **Установить LOG_LEVEL=info** (для production)
3. ✅ **Использовать Claude для документов:**
   ```typescript
   const llm = LLMFactory.create('anthropic')  // claude-sonnet-4.5
   ```

### Что делать в Stage 17:

1. DocumentGenerationService с Claude
2. Промпт-инжиниринг для российских документов
3. UI для генерации
4. Тестирование на реальных шаблонах

---

**Начинаем с Claude 4.5?** 🚀

