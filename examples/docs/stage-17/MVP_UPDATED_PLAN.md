# Обновлённый план MVP с учётом изменений

**Дата:** 13 октября 2025, 22:00  
**Изменения:**
- ✅ Использовать **OpenAI ChatGPT** (не Claude)
- ✅ Рассмотреть **OpenAI Assistants API / Agent Builder**
- ✅ Полный пакет документов (не 3, а **10-15 документов**)

---

## 📋 ПОЛНЫЙ ПАКЕТ ДОКУМЕНТОВ ПО 152-ФЗ

### Обязательные документы (10-15 шт)

#### Категория А: Основные политики и положения (5 документов)

1. **Политика обработки персональных данных** 📄
   - Основной документ
   - Публикуется на сайте
   - Общие принципы

2. **Положение об обработке персональных данных** 📄
   - Детальное описание процессов
   - Внутренний документ
   - Категории ПДн, цели обработки

3. **Положение о комиссии по определению уровня защищённости ПДн** 📄
   - Состав комиссии
   - Порядок работы
   - Полномочия

4. **Положение о комиссии по уничтожению ПДн** 📄
   - Процедура уничтожения
   - Протоколы

5. **Положение о внутреннем контроле соответствия обработки ПДн** 📄
   - Процедуры контроля
   - Регулярность проверок

#### Категория Б: Инструкции и регламенты (5 документов)

6. **Инструкция по обработке персональных данных** 📄
   - Для работников
   - Пошаговые действия
   - Права и обязанности

7. **Инструкция ответственного за обработку ПДн** 📄
   - Должностная инструкция
   - Обязанности и полномочия

8. **Инструкция администратора безопасности ПДн** 📄
   - Технические меры
   - Администрирование ИСПДн

9. **Регламент обработки запросов субъектов ПДн** 📄
   - Процедура обработки обращений
   - Сроки ответов
   - Формы

10. **Регламент обработки инцидентов** 📄
    - Действия при утечке
    - Уведомление РКН
    - Комиссия

#### Категория В: Организационно-распорядительные документы (5 документов)

11. **ОРД (Общее решение по организации) ИСПДн** 📄
    - Технический документ
    - Описание системы
    - Меры защиты
    - **Для каждой ИСПДн отдельный!**

12. **Приказ о назначении ответственных лиц** 📄
    - Ответственный за обработку ПДн
    - Ответственный за безопасность ПДн
    - Члены комиссий

13. **Приказ об утверждении списка лиц, допущенных к обработке ПДн** 📄
    - Перечень должностей
    - Обязательства о неразглашении

14. **Согласие на обработку персональных данных** (шаблоны) 📄
    - Для работников
    - Для клиентов
    - Для контрагентов

15. **Уведомление об обработке ПДн** 📄
    - Для субъектов ПДн
    - Публичное

#### Категория Г: Дополнительные (опционально)

16. **Акт определения уровня защищённости ПДн**
17. **Акт классификации ИСПДн**
18. **Журнал учёта обращений субъектов ПДн**
19. **Модель угроз безопасности ПДн**

---

## 🤖 ВЫБОР: OpenAI Assistants API vs Chat Completions

### Вариант 1: Assistants API ⭐ (РЕКОМЕНДУЮ)

**Плюсы:**
- ✅ **Векторное хранилище** - можем загрузить все шаблоны документов
- ✅ **File Search** - поиск по загруженным файлам
- ✅ **Code Interpreter** - для обработки данных
- ✅ **Function Calling** - интеграция с нашей системой
- ✅ **Память** - контекст сохраняется между шагами
- ✅ **Threads** - отдельная сессия для каждого пользователя

**Минусы:**
- ⚠️ Чуть дороже обычного API
- ⚠️ Нужна настройка Assistant один раз

**Стоимость:**
- GPT-4o: $5/1M input + $15/1M output
- File Search: $0.10/GB/день
- Для 100 шаблонов (~100MB): ~$3/месяц

**Применение:**
```typescript
// 1. Создать Assistant один раз (setup)
const assistant = await openai.beta.assistants.create({
  name: "ПДн Document Generator",
  instructions: `
    Ты эксперт по 152-ФЗ "О персональных данных".
    У тебя есть доступ к шаблонам всех обязательных документов.
    Генерируй документы строго по российским стандартам.
    Адаптируй под организацию на основе ответов анкеты.
  `,
  model: "gpt-4o",
  tools: [
    { type: "file_search" },
    { type: "code_interpreter" }
  ],
})

// 2. Загрузить шаблоны в Vector Store
const vectorStore = await openai.beta.vectorStores.create({
  name: "ПДн Templates",
  file_ids: [/* ID загруженных шаблонов */]
})

await openai.beta.assistants.update(assistant.id, {
  tool_resources: {
    file_search: { vector_store_ids: [vectorStore.id] }
  }
})

// 3. Использовать для каждого пользователя
const thread = await openai.beta.threads.create()

await openai.beta.threads.messages.create(thread.id, {
  role: "user",
  content: `
    Создай Политику обработки ПДн для:
    
    ОРГАНИЗАЦИЯ:
    ${JSON.stringify(answers, null, 2)}
    
    Используй шаблон "policy-pdn" и адаптируй под организацию.
  `
})

const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: assistant.id
})

// Ждём результата
const result = await waitForRun(run)
```

### Вариант 2: Chat Completions API (обычный)

**Плюсы:**
- ✅ Проще в использовании
- ✅ Быстрее
- ✅ Дешевле (нет file search)

**Минусы:**
- ❌ Нужно передавать весь контекст каждый раз
- ❌ Лимит контекста 128K токенов (можем не вместить все шаблоны)
- ❌ Нет памяти между запросами

### Вариант 3: Agent Builder (UI инструмент)

**Что это:**
- Визуальный конструктор агентов (no-code)
- Drag-and-drop интерфейс
- Для быстрого прототипирования

**НЕ подходит для нашего случая:**
- ❌ Это UI инструмент, не API
- ❌ Нужно интегрировать в наш продукт
- ❌ Лучше использовать Assistants API программно

---

## ✅ РЕКОМЕНДАЦИЯ: OpenAI Assistants API

### Почему именно Assistants API:

1. **Можем загрузить все 15 шаблонов**
   - Vector Store вместит все документы
   - File Search найдёт нужный шаблон
   - Не нужно передавать в каждом запросе

2. **Thread для каждой сессии**
   - Память между шагами мастера
   - Можно задавать уточняющие вопросы
   - Контекст сохраняется

3. **Function Calling**
   - Можем вызывать наши функции
   - Интеграция с БД
   - Валидация данных

4. **Проще масштабировать**
   - Добавляем новые шаблоны → загружаем в Vector Store
   - Не меняем код

---

## 📊 ОБНОВЛЁННЫЙ ПЛАН

### Изменения:

**1. Увеличили количество документов:**
- Было: 3 документа
- Стало: **10-15 документов** (полный пакет)

**2. Изменили LLM провайдер:**
- Было: Claude 4.5
- Стало: **OpenAI GPT-4o + Assistants API**

**3. Оценка времени:**
- Было: 9-12 дней
- Стало: **10-14 дней** (из-за большего количества документов)

---

## 🏗️ АРХИТЕКТУРА С ASSISTANTS API

### Setup (один раз)

```typescript
// services/openai-assistant-setup.ts

export async function setupDocumentAssistant() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
  
  // 1. Создать Assistant
  const assistant = await openai.beta.assistants.create({
    name: "IB Compliance Document Generator",
    instructions: `
      Ты эксперт по российскому законодательству в области информационной безопасности.
      
      СПЕЦИАЛИЗАЦИЯ:
      - 152-ФЗ "О персональных данных"
      - Приказ Роскомнадзора №996
      - ГОСТ Р ИСО/МЭК 27001
      
      ТВОЯ ЗАДАЧА:
      Генерировать документы для организаций на основе:
      1. Шаблонов из векторного хранилища
      2. Данных организации из анкеты
      3. Требований российского законодательства
      
      ТРЕБОВАНИЯ К ДОКУМЕНТАМ:
      - Строгое соответствие 152-ФЗ
      - Адаптация под конкретную организацию
      - Использование точных юридических формулировок
      - Заполнение всех реквизитов
      - Формат: Markdown
      
      ЗАПРЕЩЕНО:
      - Использовать placeholder'ы типа [НАЗВАНИЕ ОРГАНИЗАЦИИ]
      - Выдумывать данные
      - Копировать шаблон без адаптации
    `,
    model: "gpt-4o",
    tools: [
      { type: "file_search" },
      { type: "code_interpreter" }
    ]
  })
  
  // 2. Создать Vector Store для шаблонов
  const vectorStore = await openai.beta.vectorStores.create({
    name: "ПДн Document Templates"
  })
  
  // 3. Загрузить все шаблоны документов
  const templateFiles = [
    './templates/policy-pdn.md',
    './templates/instruction-pdn.md',
    './templates/ord-ispdn.md',
    './templates/pologenie-komisii.md',
    './templates/prikaz-naznachenie.md',
    // ... все 15 шаблонов
  ]
  
  const fileIds = []
  for (const filePath of templateFiles) {
    const file = await openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: "assistants"
    })
    fileIds.push(file.id)
  }
  
  // 4. Добавить файлы в Vector Store
  await openai.beta.vectorStores.fileBatches.create(vectorStore.id, {
    file_ids: fileIds
  })
  
  // 5. Связать Assistant с Vector Store
  await openai.beta.assistants.update(assistant.id, {
    tool_resources: {
      file_search: {
        vector_store_ids: [vectorStore.id]
      }
    }
  })
  
  return {
    assistantId: assistant.id,
    vectorStoreId: vectorStore.id
  }
}
```

### Использование (для каждой сессии)

```typescript
// services/document-generation-service.ts

export class DocumentGenerationService {
  private assistantId: string
  
  async generateDocuments(
    sessionId: string,
    answers: Record<string, any>
  ): Promise<GeneratedDocument[]> {
    const openai = new OpenAI()
    
    // 1. Создать Thread для этой сессии
    const thread = await openai.beta.threads.create({
      metadata: { sessionId }
    })
    
    // 2. Получить список документов для генерации
    const documents = await this.getDocumentsForPackage('152fz-pdn-full')
    
    const generatedDocs: GeneratedDocument[] = []
    
    // 3. Генерировать каждый документ
    for (const docTemplate of documents) {
      // Создать сообщение
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: this.buildPrompt(docTemplate, answers)
      })
      
      // Запустить Assistant
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: this.assistantId,
        instructions: `Создай документ "${docTemplate.title}"`
      })
      
      // Ждать результата
      const result = await this.waitForCompletion(thread.id, run.id)
      
      generatedDocs.push({
        templateId: docTemplate.id,
        title: docTemplate.title,
        content: result.content,
        confidence: this.calculateConfidence(result)
      })
    }
    
    return generatedDocs
  }
  
  private buildPrompt(
    template: DocumentTemplate,
    answers: Record<string, any>
  ): string {
    return `
      Создай документ "${template.title}" для организации.
      
      ДАННЫЕ ОРГАНИЗАЦИИ:
      - Название: ${answers["org-name"]}
      - ИНН: ${answers["org-inn"]}
      - Адрес: ${answers["org-address"]}
      - Тип: ${answers["org-type"]}
      
      ОТВЕТСТВЕННЫЕ ЛИЦА:
      - За обработку: ${answers["responsible-processing-name"]}, ${answers["responsible-processing-position"]}
      - За безопасность: ${answers["responsible-security-name"]}, ${answers["responsible-security-position"]}
      
      ОБЪЕМ ОБРАБОТКИ:
      - Количество субъектов: ${answers["pdn-volume"]}
      - Категории: ${answers["pdn-subjects"]?.join(", ")}
      
      ИСПДн:
      - ПО: ${answers["ispdn-software"]?.join(", ")}
      - Расположение: ${answers["ispdn-location"]}
      
      Используй шаблон "${template.code}" из векторного хранилища.
      Адаптируй его под эту организацию.
      Заполни все реквизиты конкретными данными.
    `
  }
}
```

---

## 📊 СРАВНЕНИЕ: Chat Completions vs Assistants API

| Критерий | Chat Completions | Assistants API ⭐ |
|----------|------------------|-------------------|
| **Контекст** | 128K | 128K + Vector Store |
| **Память** | ❌ Нет | ✅ Thread |
| **Шаблоны** | Передавать каждый раз | ✅ В Vector Store |
| **Сложность** | Простой | Средняя |
| **Стоимость** | $5+$15/1M | $5+$15/1M + $0.10/GB/день |
| **Для 15 документов** | ⭐⭐ Сложно | ⭐⭐⭐⭐⭐ Идеально |

**Вывод:** Для 15 документов **Assistants API** намного лучше!

---

## 🚀 ОБНОВЛЁННЫЙ ROADMAP

### Спринт 1: Backend основа (3 дня)

**День 1: БД и типы**
- [ ] Миграции (3 таблицы)
- [ ] Обновить `DocumentPackage` - добавить 15 документов
- [ ] Типы данных
- [ ] Seed: полный пакет "152-ФЗ ПДн" (15 документов)

**День 2: API**
- [ ] 5 API endpoints
- [ ] Тесты

**День 3: UI → API**
- [ ] Подключить UI к Backend

### Спринт 2: OpenAI Assistants (4-5 дней)

**День 4: Setup Assistant**
- [ ] Создать setup скрипт
- [ ] Подготовить 15 шаблонов документов (Markdown)
- [ ] Загрузить в Vector Store
- [ ] Протестировать File Search

**День 5: Генерация документов**
- [ ] `DocumentGenerationService`
- [ ] Промпт для каждого типа документа
- [ ] Thread для сессии
- [ ] Генерация всех 15 документов

**День 6-7: Качество и оптимизация**
- [ ] Тестирование на 10 организациях
- [ ] Улучшение промптов
- [ ] Confidence score
- [ ] Обработка ошибок

**День 8: Интеграция**
- [ ] Подключить к API
- [ ] Сохранение документов в БД
- [ ] Обновление UI (progress для 15 документов)

### Спринт 3: Экспорт и финализация (2-3 дня)

**День 9: DOCX экспорт**
- [ ] Библиотека для экспорта
- [ ] Markdown → DOCX
- [ ] API endpoint
- [ ] Массовое скачивание (ZIP)

**День 10: Полировка**
- [ ] UI для 15 документов (tabs/список)
- [ ] Batch операции
- [ ] Тестирование

**День 11-12 (буфер):**
- [ ] Исправление багов
- [ ] Доп. тестирование

---

## 💰 СТОИМОСТЬ (оценка)

### OpenAI Assistants API

**Setup (один раз):**
- Загрузка 15 шаблонов (~10MB): бесплатно
- Storage: $0.10/GB/день = ~$0.001/день = $0.30/месяц

**Генерация 1 комплекта (15 документов):**
- Input: ~50K токенов (промпт + контекст) × 15 = 750K токенов
- Output: ~4K токенов × 15 = 60K токенов
- Стоимость: 0.75M × $5 + 0.06M × $15 = $3.75 + $0.90 = **$4.65** (~465₽)

**100 генераций в месяц:**
- $465 + $0.30 storage = **$465.30** (~46500₽)

**Оптимизация:**
- Можно кэшировать промпты
- Генерировать только выбранные документы
- Использовать gpt-4o-mini для простых документов ($0.15/$0.60)

---

## 📋 ОБНОВЛЁННАЯ СТРУКТУРА ПАКЕТА

```typescript
const package152FZ_Full = {
  id: "pkg-152fz-pdn-full",
  code: "152fz-pdn-full",
  title: "Полный пакет документов по 152-ФЗ (ПДн)",
  description: "Комплект из 15 документов для полного соответствия требованиям защиты персональных данных",
  
  documentsCount: 15,
  estimatedTime: 45, // Увеличили с 30 до 45 минут
  
  documentTemplates: [
    // Категория А: Политики и положения
    { id: "doc-01", code: "policy-pdn", title: "Политика обработки ПДн" },
    { id: "doc-02", code: "pologenie-pdn", title: "Положение об обработке ПДн" },
    { id: "doc-03", code: "pologenie-komisii-uroven", title: "Положение о комиссии по определению уровня защищённости" },
    { id: "doc-04", code: "pologenie-komisii-unichtozhenie", title: "Положение о комиссии по уничтожению ПДн" },
    { id: "doc-05", code: "pologenie-vnutr-control", title: "Положение о внутреннем контроле" },
    
    // Категория Б: Инструкции
    { id: "doc-06", code: "instruction-pdn", title: "Инструкция по обработке ПДн" },
    { id: "doc-07", code: "instruction-otvet-obrabotka", title: "Инструкция ответственного за обработку ПДн" },
    { id: "doc-08", code: "instruction-admin-bezop", title: "Инструкция администратора безопасности ПДн" },
    { id: "doc-09", code: "reglament-zaprosy", title: "Регламент обработки запросов субъектов ПДн" },
    { id: "doc-10", code: "reglament-incidenty", title: "Регламент обработки инцидентов" },
    
    // Категория В: ОРД и приказы
    { id: "doc-11", code: "ord-ispdn", title: "ОРД по ИСПДн" },
    { id: "doc-12", code: "prikaz-otvetstvennyе", title: "Приказ о назначении ответственных лиц" },
    { id: "doc-13", code: "prikaz-spisok-dopusk", title: "Приказ об утверждении списка лиц с доступом к ПДн" },
    { id: "doc-14", code: "soglasie-template", title: "Согласие на обработку ПДн (шаблон)" },
    { id: "doc-15", code: "uvedomlenie-pdn", title: "Уведомление об обработке ПДн" },
  ]
}
```

---

## 🎯 СЛЕДУЮЩИЕ ШАГИ (ОБНОВЛЕНО)

### Сегодня вечер (30 минут)

1. **Обновить UI:**
   - [ ] Изменить "3 документа" на "15 документов"
   - [ ] Обновить estimated time: 45 минут
   - [ ] Обновить описание пакета

2. **Подготовить шаблоны:**
   - [ ] Создать папку `templates/152fz-pdn/`
   - [ ] Подготовить 15 файлов .md (можно сначала заглушки)

### Завтра (День 1)

**Утро:**
- [ ] Миграции БД (обновить под 15 документов)
- [ ] Setup OpenAI Assistant
- [ ] Загрузить шаблоны в Vector Store

**День:**
- [ ] API endpoints
- [ ] Тесты

**Вечер:**
- [ ] Начать генерацию через Assistants API

---

**НАЧИНАЕМ! Сначала обновлю UI под 15 документов, потом Backend!** 🚀

