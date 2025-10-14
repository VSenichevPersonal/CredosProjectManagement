# 📋 Итоги совещания: Продакт Оунер + Главный Архитектор

**Дата:** 13 октября 2025, 21:00  
**Тема:** План разработки MVP мастера генерации документов ПДн  
**Статус:** ✅ План утверждён

---

## 🎯 РЕШЕНИЯ СОВЕЩАНИЯ

### 1. MVP Scope

**Включаем:**
- ✅ Реальная генерация через Claude 4.5
- ✅ Пакет "152-ФЗ ПДн" (3 документа)
- ✅ Сохранение в библиотеку
- ✅ Экспорт в DOCX

**НЕ включаем:**
- ❌ Монетизация (после проверки спроса)
- ❌ Human провайдер (после отладки LLM)
- ❌ Fine-tuned модель (после накопления данных)

### 2. Сроки

**Общий срок:** 9-12 дней (+ 1-2 дня буфер)

**3 спринта:**
- Спринт 1: Backend основа (3 дня)
- Спринт 2: LLM генерация (3-4 дня)
- Спринт 3: Экспорт и полировка (2-3 дня)

**Дата релиза MVP:** 22-25 октября

### 3. Приоритеты

**#1 Качество генерации**
- Тщательный промпт-инжиниринг
- Тестирование на разных организациях
- Confidence score > 85%

**#2 Надёжность**
- Retry механизм
- Fallback на GPT-4o
- Обработка ошибок

**#3 Скорость**
- Генерация < 10 минут
- Асинхронная обработка

---

## 📊 ROADMAP

```
13 окт (сегодня)      ████ UI готов (11 файлов, ~1500 строк)
│
14-16 окт             ████ Спринт 1: Backend основа
│                          • БД и типы
│                          • API endpoints
│                          • Подключение UI
│
17-20 окт             ████ Спринт 2: LLM генерация
│                          • Промпт-инжиниринг
│                          • Claude интеграция
│                          • Сохранение результатов
│
21-23 окт             ████ Спринт 3: Экспорт + полировка
│                          • DOCX экспорт
│                          • UI полировка
│                          • Тестирование
│
22-25 окт             ✅ MVP ГОТОВ!
```

---

## 🛠️ ТЕХНИЧЕСКИЙ СТЕК

### Backend
- **БД:** PostgreSQL (Supabase)
- **API:** Next.js App Router (Route Handlers)
- **LLM:** Claude 4.5 Sonnet (Anthropic)
- **Fallback:** GPT-4o (OpenAI)
- **SDK:** Vercel AI SDK

### Frontend
- **Framework:** Next.js 14 + React
- **UI:** shadcn/ui
- **Forms:** React Hook Form + Zod (для валидации)
- **State:** React useState (локальный)

### Export
- **Library:** `docx` (npm package)
- **Format:** Markdown → DOCX

---

## 📋 АРХИТЕКТУРА

### Схема БД

```sql
document_packages
├─ id, code, title, description
├─ questionnaire (JSONB)
├─ document_template_ids (UUID[])
└─ is_available

document_generation_sessions
├─ id, tenant_id, user_id, organization_id
├─ package_id
├─ answers (JSONB)
├─ clarifications (JSONB)
├─ provider_type, provider_config
├─ status ('draft' → 'completed')
└─ generated_documents (JSONB)

session_documents
├─ session_id
├─ document_id
└─ confidence_score
```

### Сервисы

```typescript
DocumentPackageService
├─ list()
└─ getById()

DocumentGenerationWizardService
├─ startWizard()
├─ saveAnswers()
├─ generateDocuments()  ← LLM
└─ saveDocuments()      ← Document + Version

DocumentGenerationService (LLM)
└─ generateDocument()   ← Claude 4.5
```

### API Endpoints

```
GET    /api/document-packages
GET    /api/document-packages/:id
POST   /api/document-wizard
PATCH  /api/document-wizard/:id/answers
POST   /api/document-wizard/:id/generate
GET    /api/documents/:id/export/docx
```

---

## 💰 БЮДЖЕТ (оценка)

### Разработка
- **8-10 дней** × 8 часов = 64-80 часов
- Developer time

### Claude API (тестирование)
- **50 генераций** для тестирования
- ~500K токенов input × 50 = 25M токенов
- 25M × $3/1M = **$75** (~7500₽)
- **100 генераций** в первый месяц
- ~50M токенов = **$150** (~15000₽)

**Оптимизация:**
- Лимит 10 генераций/день для бета-тестеров
- Оптимизация промптов (уменьшить токены)

---

## 🎯 SUCCESS CRITERIA

**MVP считается успешным если:**

1. ✅ **50+ генераций** за первую неделю
2. ✅ **95%+ success rate** генерации
3. ✅ **85%+ confidence** score в среднем
4. ✅ **70%+ пользователей** скачивают документы
5. ✅ **NPS > 7** (Net Promoter Score)

**Если успешно → запускаем монетизацию**

---

## 📅 СЛЕДУЮЩИЕ ШАГИ

### Сегодня (13 октября, вечер)

- [x] UI MVP создан
- [ ] Закоммитить UI
- [ ] Запустить `npm run dev` и протестировать
- [ ] Подготовить plan для дня 1

### Завтра (14 октября)

**Утро:**
- [ ] Создать миграции БД (3 таблицы)
- [ ] Создать типы данных
- [ ] Создать провайдеры

**День:**
- [ ] Создать API endpoints
- [ ] Тесты API

**Вечер:**
- [ ] Начать подключение UI к API

---

## 📚 ДОКУМЕНТАЦИЯ

**Для PO:**
- 📊 **MVP_ROADMAP.md** - план по дням
- 📋 **MVP_PLANNING_MEETING.md** - детали совещания

**Для разработчиков:**
- 📄 **MVP_IMPLEMENTATION_LOG.md** - что создано
- 📖 **MVP_QUICK_START.md** - как запустить
- 🏗️ **DOCUMENT_GENERATION_WIZARD_ANALYSIS.md** - архитектура

---

## ✅ AGREEMENT & SIGN-OFF

**Продакт Оунер согласен:**
- ✅ Срок 9-12 дней приемлем
- ✅ Scope понятен (только LLM, без оплаты)
- ✅ Приоритет #1 - качество генерации
- ✅ Критерии успеха определены

**Главный Архитектор согласен:**
- ✅ Технический стек утверждён
- ✅ Архитектура спроектирована
- ✅ Риски выявлены и есть митигация
- ✅ Оценки реалистичны

**Подписи:**
- 👨‍💼 **PO:** Владимир Сеничев
- 👨‍💻 **ГА:** Claude (AI Assistant)

---

## 🎉 ИТОГИ СОВЕЩАНИЯ

### За сегодня сделано:

✅ Изучена кодовая база  
✅ Проанализированы анкеты от Олега  
✅ Создан полный UI MVP (11 файлов, ~1500 строк)  
✅ Спроектирована архитектура  
✅ Составлен план на 10 дней  
✅ Определены критерии успеха  

### Завтра начинаем:

🚀 **Спринт 1, День 1: БД и типы**

---

**Совещание закрыто. Всем спасибо за участие! 🎯**

---

## 📞 КОНТАКТЫ ДЛЯ ВОПРОСОВ

**Вопросы по продукту:**
- PO: Владимир (@vsenichev)

**Технические вопросы:**
- ГА: См. документацию в `docs/stage-17/`

---

**NEXT ACTION:** Запустить `npm run dev`, протестировать UI, закоммитить! 🚀

