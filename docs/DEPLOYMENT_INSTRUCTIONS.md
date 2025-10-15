# 🚀 Инструкции по деплою и тестированию

## 📋 Быстрый старт

### 1. Применить новые миграции

```bash
# На Railway или локально
npm run db:migrate
```

Это применит миграцию `007_complete_schema.sql` которая добавляет:
- Таблицы: activity_log, notifications, comments, project_members, approval_workflows, project_phases, settings
- Индексы для производительности
- Поле `code` для проектов

### 2. Установить переменную окружения на Railway

```
LOG_LEVEL=trace
```

Это включит подробное логирование для отладки.

### 3. Deploy на Railway

```bash
git add .
git commit -m "feat: complete API integration, add full CRUD, add test plans"
git push origin main
```

Railway автоматически задеплоит изменения.

---

## 🧪 Как тестировать

### Для QA тестировщика:

1. **Открыть файл:**
   ```
   docs/QA_TEST_PLAN.md
   ```

2. **Пройти по чеклисту** (340+ тестов):
   - Аутентификация
   - Направления
   - Сотрудники
   - Проекты
   - Задачи
   - Учет времени
   - Финансы
   - Аналитика
   - UI/UX
   - API
   - Performance
   - Security

3. **Логировать баги:**
   - P0 - Critical (блокирует релиз)
   - P1 - High (нужно исправить)
   - P2 - Medium (можно отложить)
   - P3 - Low (backlog)

4. **Создать отчет** через 2-3 дня

---

### Для Senior Architect:

1. **Открыть файл:**
   ```
   docs/SENIOR_ARCHITECT_TASKS.md
   ```

2. **Приоритизировать задачи:**
   - P0 - Critical (3 задачи) - начать немедленно
   - P1 - High (8 задач) - на этой неделе
   - P2 - Medium (20 задач) - следующие недели
   - P3 - Low (17 задач) - backlog

3. **Roadmap:**
   - Week 1: P0 задачи (редактирование, auth-employees, batch ops)
   - Week 2: P1 задачи (React Query, server-side search, etc)
   - Week 3-4: P2 задачи

4. **Daily sync** с Product Owner

---

## ✅ Что протестировать в первую очередь

### E2E Flow #1: Создание проекта

```
1. Открыть https://credos1.up.railway.app/projects
2. Кликнуть "Создать проект"
3. Заполнить форму:
   - Название: "Тестовый проект"
   - Направление: [выбрать из списка - они загрузятся из БД!]
   - Статус: "Планирование"
   - Дата начала: сегодня
   - Бюджет: 500000
4. Кликнуть "Создать проект"
5. ОЖИДАТЬ:
   ✅ Loader "Создание..."
   ✅ Toast "Успешно! Проект создан"
   ✅ Диалог закрывается
   ✅ Проект появляется в списке
6. Проверить в БД:
   SELECT * FROM projects WHERE name = 'Тестовый проект';
```

### E2E Flow #2: Создание направления

```
1. Открыть /admin/dictionaries/directions
2. Кликнуть "Добавить направление"
3. Заполнить:
   - Название: "Тестовое направление"
   - Описание: "Для QA тестов"
   - Бюджет: 1000000
4. Создать
5. ОЖИДАТЬ:
   ✅ Toast успешно
   ✅ Направление в списке
6. Попробовать удалить
7. ОЖИДАТЬ:
   ✅ Confirm dialog
   ✅ Toast "Удалено"
   ✅ Исчезло из списка
```

### E2E Flow #3: Создание сотрудника

```
1. Открыть /admin/dictionaries/employees
2. Кликнуть "Добавить сотрудника"
3. Заполнить:
   - ФИО: "Тестов Тест Тестович"
   - Email: "test@credos.ru"
   - Должность: "QA Engineer"
   - Направление: [выбрать]
   - Ставка: 2000
4. Создать
5. ОЖИДАТЬ:
   ✅ Сохранение в БД
   ✅ Toast успешно
   ✅ В списке
6. Попробовать создать с тем же email
7. ОЖИДАТЬ:
   ❌ Ошибка "Email уже существует"
   ✅ Toast с ошибкой
```

---

## 🔍 Проверка логов на Railway

### Как смотреть логи:

1. Railway Dashboard → Ваш проект
2. Logs tab
3. Фильтр: последние 1 час

### Что искать:

**При создании проекта:**
```
[CredosPM] [2024-10-15...] [INFO] POST /api/projects - Creating project
[CredosPM] [2024-10-15...] [INFO] Project created | Context: {"id":"uuid"}
```

**При ошибке:**
```
[CredosPM] [2024-10-15...] [ERROR] Failed to create project | Error: ...
  at ...stack trace...
```

**С LOG_LEVEL=trace видно ВСЕ:**
```
[CredosPM] [TRACE] Entering function
[CredosPM] [DEBUG] Database query executed
[CredosPM] [INFO] Operation completed
```

---

## 🗄️ Проверка БД

### Подключение к Railway PostgreSQL:

```bash
# Получить DATABASE_URL из Railway
# Variables tab → DATABASE_URL

# Подключиться:
psql $DATABASE_URL

# Или через Railway CLI:
railway connect
```

### Полезные запросы:

```sql
-- Проверить таблицы
\dt

-- Проверить схемы
\dn

-- Последние проекты
SELECT id, name, status, created_at 
FROM projects 
ORDER BY created_at DESC 
LIMIT 10;

-- Последние сотрудники
SELECT id, full_name, email, is_active 
FROM employees 
ORDER BY created_at DESC 
LIMIT 10;

-- Все направления
SELECT * FROM directions;

-- Статистика
SELECT 
  (SELECT COUNT(*) FROM projects) as projects_count,
  (SELECT COUNT(*) FROM employees WHERE is_active = true) as active_employees,
  (SELECT COUNT(*) FROM directions WHERE is_active = true) as active_directions,
  (SELECT COUNT(*) FROM tasks) as tasks_count;
```

---

## 📊 Мониторинг Production

### Метрики для отслеживания:

1. **API Performance:**
   - Response time
   - Error rate
   - Request count

2. **Database:**
   - Query performance
   - Connection count
   - Table sizes

3. **Application:**
   - Memory usage
   - CPU usage
   - Uptime

### Railway Metrics:

Railway автоматически показывает:
- CPU usage
- Memory
- Network
- Deployments

---

## 🐛 Если что-то не работает

### Проблема: API возвращает 500

**Решение:**
1. Проверить логи в Railway
2. Найти stack trace
3. Проверить DATABASE_URL
4. Проверить что миграции применены

### Проблема: Данные не загружаются

**Решение:**
1. Открыть Browser DevTools → Network
2. Найти failed request
3. Посмотреть response
4. Проверить CORS
5. Проверить authentication

### Проблема: 404 на странице

**Решение:**
1. Проверить что файл существует в `src/app/(dashboard)/`
2. Проверить роутинг
3. Перезапустить dev server

### Проблема: TypeScript ошибки

**Решение:**
```bash
npm run build
# Посмотреть ошибки
# Исправить
```

---

## 📝 Чеклист перед тестированием

- [x] Все миграции применены
- [x] DATABASE_URL установлен
- [x] LOG_LEVEL=trace установлен
- [x] Приложение задеплоено
- [ ] QA team имеет доступ к Railway
- [ ] Senior Architect ознакомлен с задачами
- [ ] Product Owner готов к demo

---

## 🎯 Expected Timeline

### Today:
- ✅ Deployment complete
- ✅ Migrations applied
- ✅ Documentation ready

### This Week:
- ⏳ QA testing
- ⏳ Bug fixes
- ⏳ P0 features implementation

### Next Week:
- ⏳ Production deploy
- ⏳ User acceptance
- ⏳ Launch! 🚀

---

## 📞 Контакты для вопросов

**Product Owner:** [Ваше имя]  
**Senior Architect:** [Имя]  
**QA Lead:** [Имя]

---

**ГОТОВЫ К ТЕСТИРОВАНИЮ! ��🚀**

