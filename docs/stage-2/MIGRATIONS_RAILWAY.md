# 🔄 Применение миграций на Railway Postgres

## Вариант 1: Локально через .env.local

### Шаг 1: Создай `.env.local`
```bash
# В корне проекта
touch .env.local
```

Добавь в `.env.local`:
```
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
AUTH_COOKIE_NAME=credos_session
NODE_ENV=development
```

### Шаг 2: Применить миграции
```bash
npm run db:migrate
```

## Вариант 2: Через Railway CLI

### Установка Railway CLI:
```bash
npm i -g @railway/cli
railway login
```

### Применить миграции:
```bash
# Подключиться к проекту
railway link

# Выполнить миграции
railway run npm run db:migrate
```

## Вариант 3: Вручную через psql

### Подключиться к Railway Postgres:
```bash
# Скопируй DATABASE_URL из Railway Dashboard
psql "postgresql://postgres:password@host.railway.app:5432/railway"
```

### Выполнить SQL миграции вручную:
```sql
-- Скопируй содержимое из prisma/migrations/*.sql и выполни по порядку:
-- 001_initial_schema.sql
-- 002_seed_data.sql  
-- 005_auth_schema.sql
-- 006_finance.sql
```

## ✅ Проверка применения миграций

```bash
# Подключись к БД
psql $DATABASE_URL

# Проверь наличие таблиц
\dt auth.*
\dt finance.*
\dt public.*
```

Должны быть созданы:
- `auth.user`, `auth.session`, `auth.key`
- `finance.customer_order`, `finance.revenue_manual`, `finance.salary_register`
- `public.employees`, `public.directions`, `public.projects`, `public.tasks`, `public.time_entries`

## 🚀 После миграций

Приложение готово к работе! Запускай:
```bash
npm run dev
```

И переходи на http://localhost:3000/auth/signup для регистрации первого пользователя.

