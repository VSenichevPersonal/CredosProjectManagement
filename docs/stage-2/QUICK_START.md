# 🚀 Quick Start Guide

## 1️⃣ Настройка Railway Postgres

### Получить DATABASE_URL:
1. Открой Railway Dashboard → твой проект
2. Кликни на Postgres сервис
3. Вкладка **Variables** → скопируй `DATABASE_URL`

### Локальная настройка:
```bash
# Создай .env.local в корне проекта
echo "DATABASE_URL=postgresql://postgres:pass@host.railway.app:5432/railway" > .env.local
echo "AUTH_COOKIE_NAME=credos_session" >> .env.local
echo "NODE_ENV=development" >> .env.local
```

## 2️⃣ Применить миграции

```bash
# Установить зависимости
npm install

# Применить миграции на Railway Postgres
npm run db:migrate
```

Миграции создадут:
- ✅ Схему `auth` (users, sessions)
- ✅ Основные таблицы (employees, directions, projects, tasks, time_entries)
- ✅ Схему `finance` (orders, revenues, salary_register, allocation_rules)

## 3️⃣ Запустить локально

```bash
npm run dev
```

Открой http://localhost:3000

## 4️⃣ Первый вход

1. Перейди на `/auth/signup`
2. Зарегистрируй первого пользователя
3. Войди через `/auth/login`
4. Откроется главный дашборд

## 📋 Основные страницы

- `/` — Главный дашборд
- `/my-time` — Учёт времени
- `/projects` — Проекты
- `/employees` — Сотрудники
- `/analytics/profitability` — Рентабельность
- `/admin/finance/revenues` — Ручные доходы
- `/admin/finance/salary` — Реестр зарплат

## 🔧 Troubleshooting

### Ошибка подключения к БД:
```bash
# Проверь DATABASE_URL
echo $DATABASE_URL

# Проверь доступность Railway Postgres
psql $DATABASE_URL -c "SELECT 1"
```

### Миграции не применяются:
```bash
# Проверь лог
npm run db:migrate

# Если нужно пересоздать таблицы - подключись к psql и удали вручную
```

## 🚀 Деплой на Railway

Railway автоматически подхватит изменения из GitHub:
1. Push в main → Railway автоматически деплоит
2. Миграции применяются автоматически (если добавить в build команду)
3. Приложение доступно по URL из Railway Dashboard

**Готово к работе!** 🎉

