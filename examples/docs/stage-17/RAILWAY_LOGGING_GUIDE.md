# Логирование в Railway: Полное руководство

**Дата:** 13 октября 2025  
**Stage:** 17  
**Хостинг:** Railway

---

## 🔍 ГДЕ СМОТРЕТЬ ЛОГИ В RAILWAY

### 1. **Deployment Logs** (HTTP логи)

```
Railway Dashboard → Your Service → Deployments → Latest Deployment → Logs
```

**Показывают:**
- ✅ HTTP запросы (GET, POST, etc)
- ✅ Статус коды (200, 404, 500)
- ✅ Время ответа
- ❌ **НЕ показывают** console.log и детальные trace!

---

### 2. **Service Logs** (Подробные логи) ⭐

```
Railway Dashboard → Your Service → View Logs (кнопка справа вверху)
```

**ИЛИ в командной строке:**

```
Railway Dashboard → Три точки → Connect → Railway CLI

railway logs --service your-service-name
```

**Показывают:**
- ✅ console.log, console.error
- ✅ Trace логи (если LOG_LEVEL=debug)
- ✅ Все наши logger.debug/info/error
- ✅ SQL запросы (если включено)
- ✅ Детали ошибок со stack trace

---

## ⚙️ НАСТРОЙКА ЛОГИРОВАНИЯ

### У нас используется:

```typescript
// lib/logger.ts
private minLevel: LogLevel = (
  typeof window === "undefined" 
    ? (process.env.LOG_LEVEL as LogLevel) || "trace" 
    : "trace"
)
```

### Уровни логирования:

```typescript
trace  // Самый подробный (все!)
debug  // Подробности для разработки
info   // Важная информация
warn   // Предупреждения
error  // Только ошибки
```

---

## 🎯 РЕКОМЕНДУЕМЫЕ НАСТРОЙКИ

### Development (сейчас у тебя):
```bash
LOG_LEVEL=debug
```

**Показывает:**
- ✅ Все logger.debug()
- ✅ Все logger.info()
- ✅ Все logger.warn()
- ✅ Все logger.error()
- ✅ SQL запросы
- ✅ AI промпты и ответы

### Production (когда запустим):
```bash
LOG_LEVEL=info
```

**Показывает:**
- ❌ НЕТ logger.debug() (убирает шум)
- ✅ logger.info()
- ✅ logger.warn()
- ✅ logger.error()

---

## 📊 КАК СМОТРЕТЬ ЛОГИ

### Вариант 1: Railway Dashboard (GUI)

```
1. Railway Dashboard → Your Service
2. Кнопка "View Logs" (справа вверху)
3. Фильтры:
   - По времени
   - По уровню (info, error, warn)
   - По тексту (поиск)
```

**Плюсы:**
- ✅ Красивый UI
- ✅ Фильтры
- ✅ Автообновление

**Минусы:**
- ❌ Ограничен последними N строками
- ❌ Нет сохранения в файл

---

### Вариант 2: Railway CLI (рекомендую!) ⭐

```bash
# Установка
npm install -g @railway/cli

# Логин
railway login

# Связать с проектом
railway link

# Смотреть логи в реальном времени
railway logs --follow

# Фильтр по уровню
railway logs --level error

# Последние 100 строк
railway logs --lines 100

# Сохранить в файл
railway logs --lines 1000 > logs.txt
```

**Плюсы:**
- ✅ Real-time stream
- ✅ Неограниченная история
- ✅ Grep, фильтры
- ✅ Сохранение в файл

---

### Вариант 3: External Logging (для production)

**Подключить:**
- Sentry (ошибки)
- LogRocket (user sessions)
- Datadog (метрики + логи)
- Better Stack (логи + мониторинг)

```bash
# .env
SENTRY_DSN=https://...
LOGROCKET_APP_ID=...
```

---

## 🎯 ТВОЙ СЛУЧАЙ

### Сейчас у тебя LOG_LEVEL=debug

**Логи доступны:**

1. **В Railway Dashboard:**
   ```
   Your Service → View Logs
   ```

2. **Фильтруй по:**
   - "[Upload" - все про загрузку
   - "[AI" - все про AI
   - "ERROR" - только ошибки

3. **Ищи:**
   ```
   [Upload Error] Response:  // Детали ошибок загрузки
   [v0] Document created:    // Успешная загрузка
   [DocumentService]         // Логи сервиса
   ```

---

## 🐛 ОТЛАДКА КОНКРЕТНОЙ ПРОБЛЕМЫ

### Проблема: "Invalid uuid complianceRecordId"

**Как найти:**

```bash
# В Railway CLI:
railway logs --follow | grep "complianceRecordId"

# Или в Dashboard:
View Logs → поиск "complianceRecordId"
```

**Что искать:**
```
[Upload Error] Response: { validation: "uuid", code: "invalid_string" }
[v0] complianceId: undefined  // Если не передан
[v0] Uploading file to storage...  // Начало процесса
```

---

## ✅ ИТОГО

**Для подробных логов:**

```
Railway Dashboard → Your Service → View Logs (справа вверху)

ИЛИ

railway logs --follow
```

**У тебя LOG_LEVEL=debug** - видишь ВСЁ! 🔍

**HTTP логи** (GET/POST/200/404) - это упрощенный вид, для детального - в Service Logs!

---

**Проверь сейчас Service Logs - там будут все детали!** 📊

