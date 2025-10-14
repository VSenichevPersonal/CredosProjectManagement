# Создание пользователей в системе

## Проблема

Если при попытке входа вы видите ошибку `Invalid login credentials`, это означает, что пользователи не созданы в Supabase Auth.

## Решение

### Шаг 1: Запустите скрипт создания пользователей

\`\`\`bash
npx tsx scripts/create-test-users.ts
\`\`\`

Этот скрипт создаст 6 пользователей в Supabase Auth с автоматически подтвержденными email:

1. **Super Admin** - `admin@mail.ru` / `admin@mail.ru`
2. **Regulator Admin** - `regulator@mail.ru` / `regulator@mail.ru`
3. **Ministry User** - `ministry@mail.ru` / `ministry@mail.ru`
4. **Institution User** - `institution@mail.ru` / `institution@mail.ru`
5. **CISO** - `ciso@mail.ru` / `ciso@mail.ru`
6. **Auditor** - `auditor@mail.ru` / `auditor@mail.ru`

### Шаг 2: Запустите SQL скрипт для создания записей в таблице users

\`\`\`sql
-- Выполните в Supabase SQL Editor или через скрипт
-- scripts/010_seed_test_users.sql
\`\`\`

### Шаг 3: Войдите в систему

Теперь вы можете войти в систему используя любой из созданных аккаунтов.

## Проверка

Чтобы проверить, что пользователи созданы:

1. Откройте Supabase Dashboard
2. Перейдите в Authentication → Users
3. Вы должны увидеть 6 пользователей с подтвержденными email

## Важно

- Пароли совпадают с email для удобства тестирования
- Все пользователи имеют подтвержденные email (`email_confirm: true`)
- Пользователи привязаны к организациям через таблицу `users`

## Troubleshooting

### Ошибка "User already exists"

Если пользователь уже существует в Supabase Auth, скрипт пропустит его создание. Это нормально.

### Ошибка "SUPABASE_SERVICE_ROLE_KEY not found"

Убедитесь, что в вашем проекте настроены environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Вы можете найти их в Supabase Dashboard → Project Settings → API.
