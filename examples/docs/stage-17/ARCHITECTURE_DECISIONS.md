# Архитектурные решения: MVP мастер генерации документов

**Дата:** 13 октября 2025  
**Вопросы:** Vector Store, Agent Builder, архитектурные принципы

---

## 1️⃣ КАК РАБОТАЕМ С VECTOR STORE

### Что это такое простыми словами:

**Vector Store** = Умное хранилище документов для AI

```
Вы загружаете файлы → OpenAI автоматически:
├─ Разбивает на куски (chunks)
├─ Создаёт векторные представления (embeddings)
├─ Индексирует для быстрого поиска
└─ Даёт Assistant инструмент "File Search"
```

**Преимущества:**
- ✅ Не нужно самим делать RAG (Retrieval Augmented Generation)
- ✅ Автоматическая индексация
- ✅ Быстрый поиск по смыслу
- ✅ Обновляем документы - индекс обновляется автоматически

---

### Как это работает в нашем случае:

#### Шаг 1: Setup (один раз)

```typescript
// scripts/setup-openai-assistant.ts

const openai = new OpenAI()

// 1. Создать Assistant
const assistant = await openai.beta.assistants.create({
  name: "IB Compliance Doc Generator",
  instructions: "Ты эксперт по 152-ФЗ...",
  model: "gpt-4o",
  tools: [{ type: "file_search" }]  // ← Включаем File Search
})

// 2. Создать Vector Store
const vectorStore = await openai.beta.vectorStores.create({
  name: "ПДн Templates"
})

// 3. Связать Assistant с Vector Store
await openai.beta.assistants.update(assistant.id, {
  tool_resources: {
    file_search: {
      vector_store_ids: [vectorStore.id]
    }
  }
})

// Готово! Assistant теперь может искать в документах
```

#### Шаг 2: Загрузка документов (один раз или при обновлении)

```typescript
// scripts/upload-training-data.ts

// 1. Загружаем файлы в OpenAI
const fileIds = []
for (const file of files) {
  const uploaded = await openai.files.create({
    file: fs.createReadStream(file),
    purpose: "assistants"
  })
  fileIds.push(uploaded.id)
}

// 2. Добавляем batch'ем в Vector Store
await openai.beta.vectorStores.fileBatches.create(vectorStoreId, {
  file_ids: fileIds
})

// OpenAI автоматически:
// - разобьёт на chunks
// - создаст embeddings
// - проиндексирует
// (~5-10 минут для 47 файлов)
```

#### Шаг 3: Использование при генерации

```typescript
// services/document-generation-service.ts

// Создаём Thread
const thread = await openai.beta.threads.create()

// Отправляем запрос
await openai.beta.threads.messages.create(thread.id, {
  role: "user",
  content: `
    Создай Политику обработки ПДн для организации ${orgName}.
    
    Используй шаблон "policy-pdn" из векторного хранилища.
    Адаптируй под данные: ${JSON.stringify(answers)}
  `
})

// Запускаем Assistant
const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: ASSISTANT_ID
})

// Assistant автоматически:
// 1. Использует File Search для поиска "policy-pdn"
// 2. Находит похожие документы в Vector Store
// 3. Использует их как контекст
// 4. Генерирует документ с подстановкой данных

// Результат будет качественным, т.к. AI видел реальные примеры!
```

**Магия:** Вам НЕ нужно передавать контекст вручную! AI сам найдёт нужные документы через File Search!

---

## 2️⃣ AGENT BUILDER vs ASSISTANTS API

### Сравнение подходов:

```
┌──────────────────────────────────────────────┐
│ Agent Builder (визуальный no-code)           │
├──────────────────────────────────────────────┤
│ ✅ Плюсы:                                    │
│   • Быстрое прототипирование (drag&drop)     │
│   • Не нужно писать код                      │
│   • Встроенные Evals                         │
│   • Визуальная отладка                       │
│                                              │
│ ❌ Минусы:                                   │
│   • НЕ подходит для интеграции в продукт!   │
│   • Нет контроля над UI/UX                   │
│   • Нельзя вызвать из Next.js               │
│   • Vendor lock-in                           │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Assistants API (программный)                 │
├──────────────────────────────────────────────┤
│ ✅ Плюсы:                                    │
│   • Полная интеграция в наш продукт          │
│   • Наш кастомный UI (уже готов!)           │
│   • Программный контроль                     │
│   • Vector Store + File Search               │
│   • Function Calling                         │
│                                              │
│ ⚠️ Минусы:                                   │
│   • Нужно писать код (но у нас уже есть!)   │
│   • Чуть сложнее setup                       │
└──────────────────────────────────────────────┘
```

### ✅ НАШ ВЫБОР: Assistants API

**Почему:**
- У нас уже готов кастомный UI (11 файлов!)
- Нужна интеграция в существующий продукт
- Нужен контроль над UX
- Agent Builder - отдельный интерфейс, не подходит

**Что проще для разработки?**
- На старте Agent Builder кажется проще (no-code)
- Но для интеграции в продукт Assistants API проще!
- У нас уже написан весь код - осталось только setup

---

## 3️⃣ СОХРАНЯЕМ ЛИ АРХИТЕКТУРНЫЕ ПРИНЦИПЫ?

### ✅ ДА! Всё сохраняем!

#### 1. Thin Services ✅

```typescript
// ❌ НЕПРАВИЛЬНО: Сервис содержит OpenAI код
class DocumentGenerationService {
  async generate(answers) {
    const openai = new OpenAI()
    const thread = await openai.beta.threads.create()
    // ... куча OpenAI кода
  }
}

// ✅ ПРАВИЛЬНО: Сервис делегирует провайдеру
class DocumentGenerationService {
  constructor(private llmProvider: LLMProvider) {}
  
  async generate(ctx: ExecutionContext, answers) {
    // Бизнес-логика
    this.validateAnswers(answers)
    
    // Делегируем провайдеру
    return this.llmProvider.generateDocuments(ctx, answers)
  }
}
```

**Наша реализация:**

```typescript
// lib/providers/llm/openai-assistants-provider.ts ← Провайдер

export class OpenAIAssistantsProvider implements DocumentGenerationProvider {
  async generateDocuments(ctx, answers) {
    // Весь OpenAI код здесь
    const openai = new OpenAI()
    // ...
  }
}

// services/document-generation-service.ts ← Сервис

export class DocumentGenerationService {
  static async generateForSession(ctx, sessionId) {
    // Бизнес-логика
    const session = await getSession(sessionId)
    validateSession(session)
    
    // Выбираем провайдера
    const provider = ProviderFactory.create('openai-assistants')
    
    // Делегируем
    return provider.generateDocuments(ctx, session.answers)
  }
}
```

✅ **Принцип соблюдён!**

---

#### 2. ExecutionContext (ctx) ✅

```typescript
// Все наши API endpoints

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const ctx = await createExecutionContext(supabase) // ← ctx!
  
  // Передаём ctx во все сервисы
  const session = await DocumentGenerationWizardService.startWizard(ctx, data)
  
  return NextResponse.json({ data: session })
}

// Все сервисы

class DocumentGenerationWizardService {
  static async startWizard(
    ctx: ExecutionContext,  // ← ctx первым параметром!
    data: StartWizardDTO
  ) {
    // Проверка прав через ctx
    await ctx.access.require(Permission.DOCUMENT_CREATE)
    
    // Логирование через ctx
    ctx.logger.info("Starting wizard", { data })
    
    // БД через ctx
    const session = await ctx.db.supabase.from('document_generation_sessions')...
    
    // Аудит через ctx
    await ctx.audit.log(...)
  }
}
```

✅ **Принцип соблюдён!**

---

#### 3. Провайдерная архитектура ✅

```typescript
// lib/providers/document-generation/generation-provider.interface.ts

export interface DocumentGenerationProvider {
  name: string
  type: 'llm' | 'finetuned' | 'human'
  
  generateDocuments(ctx, answers): Promise<GeneratedDocument[]>
  estimateCost(ctx, answers): Promise<number>
  isAvailable(): Promise<boolean>
}

// Реализации:

// lib/providers/document-generation/openai-assistants-provider.ts
export class OpenAIAssistantsProvider implements DocumentGenerationProvider {
  name = "OpenAI GPT-4o (Assistants)"
  type = "llm"
  
  async generateDocuments(ctx, answers) {
    // OpenAI Assistants API код
  }
}

// lib/providers/document-generation/human-provider.ts
export class HumanGenerationProvider implements DocumentGenerationProvider {
  name = "Эксперт-интегратор"
  type = "human"
  
  async generateDocuments(ctx, answers) {
    // Создаём задачу для эксперта
  }
}

// Фабрика

class GenerationProviderFactory {
  static create(type: 'llm' | 'human'): DocumentGenerationProvider {
    switch(type) {
      case 'llm': return new OpenAIAssistantsProvider()
      case 'human': return new HumanGenerationProvider()
    }
  }
}
```

✅ **Принцип соблюдён!**

---

## 4️⃣ ФИНАЛЬНАЯ АРХИТЕКТУРА

### Полная картина:

```
┌─────────────────────────────────────────────┐
│ UI Layer (Next.js React)                    │
│ ├─ DocumentWizardComponent                  │
│ ├─ QuestionnaireStep                        │
│ └─ DocumentReviewStep                       │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ API Layer (Next.js Route Handlers)          │
│ ├─ POST /api/document-wizard                │
│ ├─ PATCH /api/document-wizard/:id/answers   │
│ └─ POST /api/document-wizard/:id/generate   │
│                                             │
│ • createExecutionContext(supabase) → ctx    │
│ • ctx передаётся во все сервисы             │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ Service Layer (Thin Services)               │
│ ├─ DocumentPackageService                   │
│ │  └─ list(), getById()                     │
│ ├─ DocumentGenerationWizardService          │
│ │  └─ startWizard(), saveAnswers()          │
│ └─ DocumentGenerationService                │
│    └─ generateForSession() ← делегирует!    │
│                                             │
│ • Бизнес-логика и валидация                 │
│ • Делегирование провайдерам                 │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ Provider Layer (модульная архитектура)      │
│                                             │
│ ProviderFactory.create(type) →              │
│ ├─ OpenAIAssistantsProvider (LLM)          │
│ │  • Vector Store + File Search            │
│ │  • Thread для каждой сессии              │
│ │  • Автоматический поиск шаблонов         │
│ │                                           │
│ ├─ HumanGenerationProvider (Human)         │
│ │  • Создание задачи для эксперта          │
│ │  • Уведомления                            │
│ │                                           │
│ └─ FineTunedProvider (будущее)             │
│    • Дообученная модель                     │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ External Services                           │
│ ├─ OpenAI Assistants API                    │
│ │  └─ Vector Store (47 документов)         │
│ ├─ Database (Supabase)                      │
│ └─ Storage (файлы)                          │
└─────────────────────────────────────────────┘
```

---

## 5️⃣ КОНКРЕТНЫЙ ПРИМЕР: Генерация документа

### Полный flow с нашей архитектурой:

```typescript
// 1. UI отправляет запрос
const response = await fetch('/api/document-wizard/abc123/generate', {
  method: 'POST'
})

// ──────────────────────────────────────────

// 2. API Route Handler
// app/api/document-wizard/[id]/generate/route.ts

export async function POST(request, { params }) {
  // Создаём ExecutionContext ← принцип ctx!
  const supabase = await createClient()
  const ctx = await createExecutionContext(supabase)
  
  // Тонкий сервис ← принцип thin service!
  const session = await DocumentGenerationWizardService.generateDocuments(
    ctx,      // ← ctx первый параметр
    params.id
  )
  
  return NextResponse.json({ data: session })
}

// ──────────────────────────────────────────

// 3. Service (бизнес-логика)
// services/document-generation-wizard-service.ts

class DocumentGenerationWizardService {
  static async generateDocuments(ctx, sessionId) {
    // Бизнес-логика
    const session = await this.getById(ctx, sessionId)
    
    if (!session.provider_type) {
      throw new ValidationError("Provider not selected")
    }
    
    // Обновляем статус
    await ctx.db.supabase
      .from('document_generation_sessions')
      .update({ status: 'processing' })
      .eq('id', sessionId)
    
    // Делегируем провайдеру ← провайдерная архитектура!
    const provider = ProviderFactory.create(session.provider_type)
    const docs = await provider.generateDocuments(ctx, session)
    
    // Сохраняем результат
    await this.saveResults(ctx, sessionId, docs)
    
    // Аудит
    await ctx.audit.log({
      eventType: 'documents_generated',
      userId: ctx.user.id,
      ...
    })
    
    return session
  }
}

// ──────────────────────────────────────────

// 4. Provider (реализация LLM)
// lib/providers/document-generation/openai-assistants-provider.ts

class OpenAIAssistantsProvider implements DocumentGenerationProvider {
  async generateDocuments(ctx, session) {
    const openai = new OpenAI()
    
    // Создать или получить Thread
    let threadId = session.openai_thread_id
    if (!threadId) {
      const thread = await openai.beta.threads.create()
      threadId = thread.id
    }
    
    const generatedDocs = []
    
    // Генерируем каждый документ
    for (const template of TEMPLATES) {
      // Создаём message
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: this.buildPrompt(template, session.answers)
      })
      
      // Запускаем Assistant (с File Search!)
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: ASSISTANT_ID
        // File Search автоматически ищет нужный шаблон!
      })
      
      // Ждём результата
      const result = await this.waitForCompletion(openai, threadId, run.id)
      
      // Извлекаем content
      const messages = await openai.beta.threads.messages.list(threadId)
      const content = messages.data[0].content[0].text.value
      
      generatedDocs.push({
        title: template.title,
        content: content,
        confidence: this.calculateConfidence(content)
      })
    }
    
    return generatedDocs
  }
}
```

**Видите?** Все принципы соблюдены:
- ✅ ctx передаётся везде
- ✅ Thin services (делегируют провайдерам)
- ✅ Провайдерная архитектура (легко заменить)
- ✅ Аудит, логирование, права доступа

---

## 6️⃣ ЧТО ПРОЩЕ ДЛЯ РАЗРАБОТКИ?

### Вариант А: Agent Builder (кажется проще)

```
1. Открыть UI Agent Builder
2. Перетащить блоки
3. Соединить стрелками
4. Нажать "Deploy"
```

**НО:**
- ❌ Потом нельзя интегрировать в наш UI
- ❌ Нет контроля
- ❌ Придётся переписывать на Assistants API

---

### Вариант Б: Assistants API (правильный путь) ✅

```
1. Один раз setup (10 минут):
   npx tsx scripts/setup-openai-assistant.ts
   
2. Загрузить документы (10 минут):
   npx tsx scripts/upload-training-data.ts
   
3. Использовать в коде (уже готово!):
   • У нас уже есть UI
   • У нас уже есть Backend
   • Осталось только подключить
```

**Преимущества:**
- ✅ Сразу интегрировано
- ✅ Полный контроль
- ✅ Не нужно переписывать

---

## 7️⃣ КАК УПРОСТИТЬ РАЗРАБОТКУ?

### 💡 Используем гибридный подход:

#### Фаза 1: Прототип в Agent Builder (1 день, опционально)

**Для чего:**
- Быстро протестировать промпты
- Проверить качество File Search
- Понять какие вопросы задавать

**Как:**
1. Создать агента в Agent Builder
2. Загрузить те же документы
3. Протестировать разные промпты
4. Записать лучшие результаты

**Результат:** 
- Знаем какие промпты работают лучше
- Копируем их в код Assistants API

---

#### Фаза 2: Production с Assistants API (текущая)

**Используем:**
- Лучшие промпты из прототипа
- Тот же Vector Store
- Программную интеграцию

**Преимущества:**
- ✅ Быстрое прототипирование (Agent Builder)
- ✅ Production-ready код (Assistants API)
- ✅ Лучшее из двух миров

---

## 8️⃣ ИТОГОВОЕ РЕШЕНИЕ

### ✅ Продолжаем с Assistants API!

**Архитектура:**
```
UI (Next.js React)
    ↓ ctx
API (Route Handlers)
    ↓ ctx
Thin Services (бизнес-логика)
    ↓ ctx
Providers (OpenAI/Human/FineTuned)
    ↓
External (OpenAI API, БД, Storage)
```

**Все принципы сохранены:**
- ✅ ExecutionContext (ctx) везде
- ✅ Thin Services (делегируют)
- ✅ Провайдерная архитектура
- ✅ DDD (domain types)
- ✅ Аудит и логирование

**Vector Store:**
- ✅ Используем через OpenAI Assistants API
- ✅ File Search автоматически
- ✅ Не нужно самим делать RAG

**Что проще:**
- Agent Builder - для прототипов и демо
- Assistants API - для production (наш случай)
- У нас уже всё готово - осталось setup!

---

## 🚀 ПЛАН ДЕЙСТВИЙ

### Прямо сейчас (30 мин):

```bash
# 1. Setup OpenAI Assistant + Vector Store
npx tsx scripts/setup-openai-assistant.ts
# → Получите ASSISTANT_ID и VECTOR_STORE_ID
# → Добавьте в .env.local

# 2. Загрузить 47 типовых документов
npx tsx scripts/upload-training-data.ts
# → Документы проиндексируются (~5-10 мин)

# 3. Готово! Можно тестировать
npm run dev
```

### Завтра (5-6 часов):

1. Подключить UI к API (реальные данные)
2. Протестировать генерацию
3. DOCX экспорт
4. Финальное тестирование

**→ MVP готов!**

---

**ИТОГО:**

✅ **Сохраняем ВСЕ архитектурные принципы**  
✅ **Vector Store через Assistants API**  
✅ **Провайдерная модель (легко расширять)**  
✅ **Agent Builder НЕ используем (не подходит)**  

Продолжаем с текущим подходом! 🚀

