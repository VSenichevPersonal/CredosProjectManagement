# Настройка базы данных с Supabase Auth

## Обзор

База данных создана с правильной интеграцией Supabase Auth:

- ✅ Автоматическая синхронизация `auth.users` → `public.users` через триггер
- ✅ Правильные RLS политики без циклических зависимостей
- ✅ Безопасное использование `auth.uid()`
- ✅ Immutable audit log
- ✅ Полная типизация через ENUM

## Шаги установки

### 1. Создайте схему БД

Запустите скрипты в следующем порядке:

\`\`\`sql
-- Основная схема (таблицы, триггеры, RLS)
scripts/100_init_database.sql

-- Seed данные - организации
scripts/101_seed_organizations.sql

-- Seed данные - нормативные документы
scripts/102_seed_regulatory_documents.sql
\`\`\`

### 2. Создайте пользователей через Supabase Dashboard

Перейдите в **Supabase Dashboard → Authentication → Users → Add user**

Создайте пользователей с метаданными:

#### Super Admin
- Email: `admin@mail.ru`
- Password: `admin@mail.ru`
- User Metadata (JSON):
\`\`\`json
{
  "name": "Системный администратор",
  "role": "super_admin"
}
\`\`\`
- Auto Confirm User: ✅

#### Regulator Admin
- Email: `regulator@mail.ru`
- Password: `regulator@mail.ru`
- User Metadata (JSON):
\`\`\`json
{
  "name": "Администратор ФСТЭК",
  "role": "regulator_admin"
}
\`\`\`
- Auto Confirm User: ✅

#### Ministry User
- Email: `ministry@mail.ru`
- Password: `ministry@mail.ru`
- User Metadata (JSON):
\`\`\`json
{
  "name": "Сотрудник министерства",
  "role": "ministry_user"
}
\`\`\`
- Auto Confirm User: ✅

#### Institution User
- Email: `institution@mail.ru`
- Password: `institution@mail.ru`
- User Metadata (JSON):
\`\`\`json
{
  "name": "Сотрудник учреждения",
  "role": "institution_user"
}
\`\`\`
- Auto Confirm User: ✅

#### IB Manager
- Email: `ciso@mail.ru`
- Password: `ciso@mail.ru`
- User Metadata (JSON):
\`\`\`json
{
  "name": "Руководитель ИБ",
  "role": "ib_manager"
}
\`\`\`
- Auto Confirm User: ✅

#### Auditor
- Email: `auditor@mail.ru`
- Password: `auditor@mail.ru`
- User Metadata (JSON):
\`\`\`json
{
  "name": "Аудитор",
  "role": "auditor"
}
\`\`\`
- Auto Confirm User: ✅

### 3. Назначьте организации пользователям

После создания пользователей через Dashboard, триггер автоматически создаст записи в `public.users`. Теперь назначьте организации:

\`\`\`sql
-- Super Admin (без организации)
UPDATE users SET organization_id = NULL WHERE email = 'admin@mail.ru';

-- Regulator Admin (ФСТЭК)
UPDATE users SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE email = 'regulator@mail.ru';

-- Ministry User (Министерство здравоохранения)
UPDATE users SET organization_id = '00000000-0000-0000-0000-000000000002' WHERE email = 'ministry@mail.ru';

-- Institution User (Городская больница №1)
UPDATE users SET organization_id = '00000000-0000-0000-0000-000000000004' WHERE email = 'institution@mail.ru';

-- IB Manager (Городская больница №1)
UPDATE users SET organization_id = '00000000-0000-0000-0000-000000000004' WHERE email = 'ciso@mail.ru';

-- Auditor (без организации)
UPDATE users SET organization_id = NULL WHERE email = 'auditor@mail.ru';
\`\`\`

## Как работает Supabase Auth интеграция

### Триггер handle_new_user()

При создании пользователя в `auth.users` через Dashboard UI:

1. Supabase Auth создает запись в `auth.users`
2. Триггер `on_auth_user_created` автоматически вызывает функцию `handle_new_user()`
3. Функция создает запись в `public.users` с данными из `raw_user_meta_data`
4. Пользователь готов к работе

### RLS Политики

Все RLS политики используют `auth.uid()` безопасно:

- **users**: Пользователи видят себя, super_admin видит всех
- **organizations**: Все аутентифицированные пользователи могут читать
- **requirements**: Все аутентифицированные пользователи могут читать
- **compliance_records**: Пользователи видят записи своей организации
- **audit_log**: Только super_admin может читать
- **notifications**: Пользователи видят только свои уведомления

### Helper Functions

- `get_current_user_role()` - получить роль текущего пользователя
- `is_super_admin()` - проверить, является ли пользователь super_admin

## Troubleshooting

### Пользователь не создается в public.users

Проверьте, что триггер существует:

\`\`\`sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
\`\`\`

### RLS блокирует доступ

Временно отключите RLS для отладки:

\`\`\`sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
\`\`\`

Не забудьте включить обратно после отладки!

### Ошибка "Database error querying schema"

Это означает проблему с RLS политиками. Проверьте, что все политики созданы правильно и не создают циклических зависимостей.
