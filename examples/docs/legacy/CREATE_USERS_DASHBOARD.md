# Создание пользователей через Supabase Dashboard

## Проблема

SQL скрипт для создания пользователей в `auth.users` вызывает ошибку "Database error querying schema". Это происходит из-за сложной структуры Supabase Auth и защищенных триггеров.

## Решение: Создание через Dashboard UI

Самый надежный способ создать пользователей - использовать Supabase Dashboard UI.

---

## Шаг 1: Откройте Supabase Dashboard

1. Перейдите на https://supabase.com/dashboard
2. Выберите ваш проект
3. В левом меню выберите **Authentication** → **Users**

---

## Шаг 2: Создайте пользователей

Нажмите кнопку **"Add User"** и создайте следующих пользователей:

### 1. Super Admin
- **Email:** `admin@mail.ru`
- **Password:** `admin@mail.ru`
- **Auto Confirm User:** ✅ (включить)
- **User Metadata (optional):**
  \`\`\`json
  {
    "full_name": "Системный администратор"
  }
  \`\`\`

### 2. Regulator Admin (ФСТЭК)
- **Email:** `regulator@mail.ru`
- **Password:** `regulator@mail.ru`
- **Auto Confirm User:** ✅
- **User Metadata:**
  \`\`\`json
  {
    "full_name": "Администратор ФСТЭК"
  }
  \`\`\`

### 3. Ministry User
- **Email:** `ministry@mail.ru`
- **Password:** `ministry@mail.ru`
- **Auto Confirm User:** ✅
- **User Metadata:**
  \`\`\`json
  {
    "full_name": "Сотрудник министерства"
  }
  \`\`\`

### 4. Institution User
- **Email:** `institution@mail.ru`
- **Password:** `institution@mail.ru`
- **Auto Confirm User:** ✅
- **User Metadata:**
  \`\`\`json
  {
    "full_name": "Сотрудник учреждения"
  }
  \`\`\`

### 5. CISO
- **Email:** `ciso@mail.ru`
- **Password:** `ciso@mail.ru`
- **Auto Confirm User:** ✅
- **User Metadata:**
  \`\`\`json
  {
    "full_name": "Руководитель ИБ"
  }
  \`\`\`

### 6. Auditor
- **Email:** `auditor@mail.ru`
- **Password:** `auditor@mail.ru`
- **Auto Confirm User:** ✅
- **User Metadata:**
  \`\`\`json
  {
    "full_name": "Аудитор"
  }
  \`\`\`

---

## Шаг 3: Синхронизируйте с public.users

После создания всех пользователей в Dashboard, запустите SQL скрипт для синхронизации:

\`\`\`sql
-- Запустите в Supabase SQL Editor
\i scripts/013_sync_auth_users.sql
\`\`\`

Или выполните скрипт через v0:

\`\`\`
Run script: scripts/013_sync_auth_users.sql
\`\`\`

---

## Шаг 4: Проверьте результат

1. Откройте страницу логина вашего приложения
2. Попробуйте войти с учетными данными:
   - Email: `admin@mail.ru`
   - Password: `admin@mail.ru`
3. Если вход успешен - все работает! ✅

---

## Troubleshooting

### Ошибка: "Invalid login credentials"

**Причина:** Пользователь не создан в Supabase Auth или email не подтвержден.

**Решение:**
1. Проверьте, что пользователь существует в Dashboard (Authentication > Users)
2. Убедитесь, что **Email Confirmed At** заполнено (не пустое)
3. Если пустое - нажмите на пользователя и выберите "Confirm Email"

### Ошибка: "Database error querying schema"

**Причина:** Проблема с синхронизацией между auth.users и public.users.

**Решение:**
1. Запустите скрипт `013_sync_auth_users.sql`
2. Проверьте, что в таблице `public.users` есть записи с правильными `id` (должны совпадать с `auth.users.id`)

### Ошибка: "User not found in public.users"

**Причина:** Пользователь создан в auth.users, но не синхронизирован с public.users.

**Решение:**
1. Запустите скрипт `013_sync_auth_users.sql`
2. Проверьте логи скрипта на наличие ошибок

---

## Альтернатива: Массовое создание через SQL

Если вы хотите создать всех пользователей одной командой, используйте Supabase Admin API:

\`\`\`bash
# Установите Supabase CLI
npm install -g supabase

# Создайте пользователей
supabase auth users create admin@mail.ru --password admin@mail.ru
supabase auth users create regulator@mail.ru --password regulator@mail.ru
# ... и т.д.
\`\`\`

Но это требует локальной установки CLI и не работает в v0 preview.

---

## Итого

1. ✅ Создайте 6 пользователей через Supabase Dashboard UI
2. ✅ Запустите скрипт `013_sync_auth_users.sql` для синхронизации
3. ✅ Войдите в систему с учетными данными `admin@mail.ru` / `admin@mail.ru`

**Время выполнения:** ~5-10 минут
