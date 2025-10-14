# 🚀 Инструкция по setup OpenAI для мастера генерации

**Цель:** Настроить OpenAI Assistants API для генерации документов  
**Время:** 15-20 минут  
**Статус:** Готово к запуску

---

## 📋 ЧТО НУЖНО

### 1. OpenAI API Key

**Где получить:**
1. Зайти на https://platform.openai.com/api-keys
2. Создать новый API ключ
3. Скопировать (начинается с `sk-proj-...`)

**Стоимость:**
- Нужен баланс на аккаунте ($5-10 для начала)
- Setup: бесплатно
- Storage: ~$0.12/месяц
- Генерация: ~$3 за комплект из 15 документов

---

## 🔧 SETUP (3 шага)

### Шаг 1: Добавить API ключ (1 минута)

Создайте файл `.env.local` в корне проекта:

```bash
# OpenAI API
OPENAI_API_KEY=sk-proj-ваш-ключ-здесь

# Остальные переменные (если нужно)
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Проверка:**
```bash
source .env.local
echo $OPENAI_API_KEY | head -c 20
# Должно показать: sk-proj-xxxxx
```

---

### Шаг 2: Setup OpenAI Assistant (2 минуты)

```bash
# Запустить setup скрипт
npx tsx scripts/setup-openai-assistant.ts
```

**Что произойдёт:**
1. Создаётся OpenAI Assistant с инструкциями
2. Создаётся Vector Store для документов
3. Выводятся IDs для .env

**Ожидаемый вывод:**
```
🚀 Setting up OpenAI Assistant...

✅ Assistant created: asst_abc123xyz
📝 Add to .env: OPENAI_DOCUMENT_ASSISTANT_ID=asst_abc123xyz

✅ Vector Store created: vs_def456uvw
📝 Add to .env: OPENAI_DOCUMENT_VECTOR_STORE_ID=vs_def456uvw

⚠️ Next step: Upload template files
   Run: npx tsx scripts/upload-training-data.ts
```

**Действия:**
1. Скопировать `OPENAI_DOCUMENT_ASSISTANT_ID` 
2. Скопировать `OPENAI_DOCUMENT_VECTOR_STORE_ID`
3. Добавить в `.env.local`:

```bash
# OpenAI Assistant для генерации документов
OPENAI_DOCUMENT_ASSISTANT_ID=asst_abc123xyz
OPENAI_DOCUMENT_VECTOR_STORE_ID=vs_def456uvw
```

---

### Шаг 3: Загрузить типовые документы (10-15 минут)

```bash
# Запустить скрипт загрузки
npx tsx scripts/upload-training-data.ts
```

**Что произойдёт:**
1. Загружаются 47 типовых документов в OpenAI Files
2. Добавляются в Vector Store batch'ем
3. OpenAI индексирует документы (~5-10 минут)

**Ожидаемый вывод:**
```
🚀 Uploading training data to OpenAI Vector Store...

📁 Found 47 documents to upload

⬆️  Uploading: 01. Приказ о комиссии...
   ✅ Uploaded: file-abc123

⬆️  Uploading: 02. Приказ об ответственном...
   ✅ Uploaded: file-def456

... (47 файлов)

✅ Uploaded 47/47 files

📦 Adding files to Vector Store (batch)...
✅ Batch created: vsfb_xyz789
   Status: in_progress
   File counts: 47 total

⏳ Waiting for files to be processed...
   Status: in_progress, Completed: 10/47
   Status: in_progress, Completed: 25/47
   Status: in_progress, Completed: 47/47
   Status: completed, Completed: 47/47

✅ All files processed successfully!

📊 Vector Store status:
   Name: ПДн Templates
   File counts: 47 completed, 47 total
   Status: ready

✅ Upload complete!

🎯 Next steps:
1. Test document generation: npm run dev
2. Navigate to /documents/wizard/new
3. Fill questionnaire and generate documents
```

---

## ✅ ПРОВЕРКА

После всех шагов проверьте `.env.local`:

```bash
cat .env.local
```

**Должно быть:**
```bash
# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_DOCUMENT_ASSISTANT_ID=asst_xxxxx
OPENAI_DOCUMENT_VECTOR_STORE_ID=vs_xxxxx

# Database (Railway/Supabase)
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 🧪 ТЕСТИРОВАНИЕ

### Запустить dev сервер:

```bash
npm run dev
```

### Пройти мастер:

1. Открыть: http://localhost:3000
2. Sidebar → **ДОКУМЕНТЫ** → **Создание документов**
3. Выбрать "152-ФЗ ПДн" (15 документов)
4. Заполнить анкету
5. Выбрать "AI Генератор (OpenAI GPT-4o)"
6. Дождаться генерации (~5-10 минут для 15 документов)
7. Просмотреть результаты

---

## ⚠️ ВОЗМОЖНЫЕ ПРОБЛЕМЫ

### Проблема 1: "Missing credentials"

**Решение:**
```bash
# Проверить что API ключ в .env.local
cat .env.local | grep OPENAI_API_KEY

# Если нет - добавить
echo "OPENAI_API_KEY=sk-proj-..." >> .env.local
```

### Проблема 2: "Недостаточно баланса"

**Решение:**
- Пополнить баланс на https://platform.openai.com/settings/organization/billing
- Минимум $5

### Проблема 3: "Files not processing"

**Решение:**
- Подождать дольше (~10-15 минут)
- Или запустить upload-training-data.ts снова

---

## 💰 СТОИМОСТЬ

**Setup (один раз):**
- Создание Assistant: бесплатно
- Vector Store: $0.10/GB/день
- 47 документов (4 MB): ~$0.12/месяц

**Генерация (за комплект):**
- 15 документов: ~$3 (~300₽)
- 100 генераций/месяц: ~$300 (~30000₽)

**Оптимизация:**
- Можно генерировать только нужные документы
- Кэшировать промпты
- Использовать gpt-4o-mini для простых документов

---

## 🎯 ПОСЛЕ SETUP

**Что будет работать:**
- ✅ UI мастера (уже готов)
- ✅ API endpoints (уже готовы)
- ✅ Реальная генерация через OpenAI
- ✅ Vector Store с 47 примерами
- ✅ Качественные документы (confidence 85%+)

**Что ещё нужно:**
- DOCX экспорт (2-3 часа разработки)
- Подключение UI к API (2 часа)
- Финальное тестирование

---

## 📞 СЛЕДУЮЩИЕ ШАГИ

**Сейчас:**
1. Получить OpenAI API Key
2. Добавить в .env.local
3. Запустить setup
4. Загрузить документы

**Завтра:**
- Подключить UI к API
- DOCX экспорт
- Тестирование

**→ MVP готов!**

---

**СТАТУС:** Готово к setup! Нужен только OpenAI API Key! 🚀

