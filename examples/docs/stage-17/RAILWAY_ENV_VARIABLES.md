# Railway: Переменные окружения

**Дата:** 13 октября 2025  
**Хостинг:** Railway (временно, был Vercel)  
**Stage:** 17

---

## 🔑 ОБЯЗАТЕЛЬНЫЕ ПЕРЕМЕННЫЕ

### Database (уже должна быть)
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

### Authentication (Supabase)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🤖 AI PROVIDERS (НОВОЕ в Stage 17)

### OpenAI (основной для Stage 17)
```bash
# API Key
OPENAI_API_KEY=sk-proj-...

# Модели по умолчанию
OPENAI_DEFAULT_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Лимиты
OPENAI_MAX_TOKENS=8192
OPENAI_TEMPERATURE=0.3
```

### Anthropic (опционально, для будущего)
```bash
# API Key
ANTHROPIC_API_KEY=sk-ant-...

# Модели
ANTHROPIC_DEFAULT_MODEL=claude-sonnet-4.5

# Лимиты
ANTHROPIC_MAX_TOKENS=8192
ANTHROPIC_TEMPERATURE=0.3
```

### AI Gateway (если используется)
```bash
AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/...
AI_GATEWAY_TOKEN=...
```

---

## ⚙️ SYSTEM SETTINGS

### Logging
```bash
# Уровень логирования
LOG_LEVEL=info  # trace | debug | info | warn | error

# В production обязательно:
NODE_ENV=production
```

### Railway Specific
```bash
# Автоматически устанавливаются Railway:
RAILWAY_ENVIRONMENT=production
RAILWAY_PROJECT_ID=...
RAILWAY_SERVICE_ID=...

# Можно переопределить:
PORT=3000
```

---

## 🎯 AI TASK CONFIGURATION (опционально)

Если хотите переопределить глобальные настройки из БД:

```bash
# Для генерации документов
AI_DOCUMENT_GENERATION_PROVIDER=openai
AI_DOCUMENT_GENERATION_MODEL=gpt-4o
AI_DOCUMENT_GENERATION_TEMPERATURE=0.3
AI_DOCUMENT_GENERATION_MAX_TOKENS=8192

# Для анализа документов
AI_DOCUMENT_ANALYSIS_PROVIDER=openai
AI_DOCUMENT_ANALYSIS_MODEL=gpt-4o
AI_DOCUMENT_ANALYSIS_TEMPERATURE=0.2
AI_DOCUMENT_ANALYSIS_MAX_TOKENS=4096

# Для валидации
AI_VALIDATION_PROVIDER=openai
AI_VALIDATION_MODEL=gpt-4o
AI_VALIDATION_TEMPERATURE=0.1
AI_VALIDATION_MAX_TOKENS=512
```

**НО ЛУЧШЕ:** Использовать настройки из БД (таблица `ai_settings`), а env только для API keys!

---

## 📋 МИНИМАЛЬНЫЙ НАБОР ДЛЯ СТАРТА

### Что добавить в Railway СЕЙЧАС:

```bash
# ============================================
# ОБЯЗАТЕЛЬНЫЕ (если еще нет)
# ============================================

DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ============================================
# AI (НОВОЕ)
# ============================================

# OpenAI (основной)
OPENAI_API_KEY=sk-proj-...

# Логирование
LOG_LEVEL=info
NODE_ENV=production

# ============================================
# ОПЦИОНАЛЬНО
# ============================================

# Anthropic (для будущего)
# ANTHROPIC_API_KEY=sk-ant-...

# Лимиты (можно не указывать, есть defaults)
# OPENAI_MAX_TOKENS=8192
# OPENAI_TEMPERATURE=0.3
```

---

## 🔍 КАК ПРОВЕРИТЬ

### 1. Проверка переменных в Railway:

```bash
# В Railway Dashboard:
Settings → Variables → проверить наличие всех ключей
```

### 2. Проверка в коде:

```typescript
// app/api/test-ai/route.ts
export async function GET() {
  return Response.json({
    openai_key: !!process.env.OPENAI_API_KEY,
    anthropic_key: !!process.env.ANTHROPIC_API_KEY,
    log_level: process.env.LOG_LEVEL,
    env: process.env.NODE_ENV
  })
}
```

### 3. Тестовый запрос:

```bash
curl https://your-app.railway.app/api/test-ai
```

---

## ⚠️ БЕЗОПАСНОСТЬ

### НЕ КОММИТИТЬ:
```
❌ .env
❌ .env.local  
❌ .env.production
```

### Хранить в:
```
✅ Railway Environment Variables (Dashboard)
✅ Secrets в GitHub (для CI/CD)
```

### В коде:
```typescript
// ❌ НИКОГДА
const apiKey = "sk-proj-..."

// ✅ ВСЕГДА
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  throw new Error("OPENAI_API_KEY not set")
}
```

---

## 📊 ПРИОРИТЕТЫ

### Для Stage 17 (сейчас):
```bash
✅ ОБЯЗАТЕЛЬНО:
- OPENAI_API_KEY
- LOG_LEVEL=info

⏳ ОПЦИОНАЛЬНО:
- ANTHROPIC_API_KEY (для экспериментов)
- AI task overrides
```

### Для Stage 18 (потом):
```bash
- ANTHROPIC_API_KEY (если перейдем на Claude)
- AI_GATEWAY (если нужна оптимизация стоимости)
- Sentry/LogRocket (мониторинг AI запросов)
```

---

## 🎯 ИТОГО: ЧТО ДОБАВИТЬ В RAILWAY ПРЯМО СЕЙЧАС

```bash
# В Railway Dashboard → Settings → Variables → Add Variable:

OPENAI_API_KEY=sk-proj-[ваш ключ]
LOG_LEVEL=info
NODE_ENV=production
```

**Всё!** Остальное опционально или уже есть.

После добавления нужен **redeploy** для применения переменных.

