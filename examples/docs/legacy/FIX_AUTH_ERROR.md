# Исправление ошибки "Database error querying schema"

## Проблема

Ошибка `Database error querying schema` при логине означает, что структура auth схемы повреждена. Это произошло из-за прямой вставки данных в `auth.users` через SQL скрипт.

## Решение

### Шаг 1: Диагностика

Запустите скрипт `014_diagnose_auth_issue.sql` в Supabase SQL Editor, чтобы проверить структуру auth схемы.

Обратите внимание на:
- Наличие всех обязательных колонок в `auth.users` и `auth.identities`
- Корректность данных в `raw_app_meta_data` и `raw_user_meta_data`
- Наличие записей в `auth.identities` для каждого пользователя

### Шаг 2: Очистка (ОПЦИОНАЛЬНО)

Если диагностика показала проблемы, запустите скрипт `015_clean_and_recreate.sql` для удаления всех пользователей.

**ВНИМАНИЕ:** Этот скрипт удалит всех пользователей из auth.users!

### Шаг 3: Создание пользователей через Dashboard UI

Это **самый надежный** способ создания пользователей в Supabase Auth.

1. Откройте **Supabase Dashboard** → **Authentication** → **Users**
2. Нажмите **"Add user"** → **"Create new user"**
3. Заполните форму:
   - **Email:** `admin@mail.ru`
   - **Password:** `admin@mail.ru`
   - **Auto Confirm User:** ✅ (включить обязательно!)
4. Нажмите **"Create user"**
5. Повторите для остальных пользователей:
   - `regulator@mail.ru` / `regulator@mail.ru`
   - `ministry@mail.ru` / `ministry@mail.ru`
   - `institution@mail.ru` / `institution@mail.ru`
   - `ciso@mail.ru` / `ciso@mail.ru`
   - `auditor@mail.ru` / `auditor@mail.ru`

### Шаг 4: Синхронизация с public.users

После создания пользователей через Dashboard, запустите скрипт `013_sync_auth_users.sql` для синхронизации с таблицей `public.users`.

Этот скрипт:
- Найдет всех пользователей в `auth.users`
- Создаст/обновит записи в `public.users`
- Назначит правильные роли на основе email
- Свяжет с организациями

### Шаг 5: Проверка

Попробуйте войти с учетными данными `admin@mail.ru` / `admin@mail.ru`.

Если логин работает - проблема решена! ✅

## Почему это произошло?

Прямая вставка данных в `auth.users` через SQL может привести к:
- Отсутствию обязательных полей
- Неправильному формату `raw_app_meta_data` и `raw_user_meta_data`
- Проблемам с триггерами и функциями auth схемы
- Несоответствию между `auth.users` и `auth.identities`

**Рекомендация:** Всегда создавайте пользователей через:
1. Supabase Dashboard UI (самый надежный)
2. Supabase Admin API (через TypeScript/Node.js)
3. Supabase Auth API (через клиентскую библиотеку)

Никогда не вставляйте данные напрямую в `auth.users` через SQL!

## Troubleshooting

### Ошибка "Email already exists"

Если при создании пользователя через Dashboard вы получаете ошибку "Email already exists", значит пользователь уже существует в auth.users, но поврежден.

**Решение:**
1. Запустите скрипт `015_clean_and_recreate.sql` для удаления всех пользователей
2. Создайте пользователей заново через Dashboard

### Ошибка "Invalid login credentials" после создания

Если после создания пользователя через Dashboard вы получаете "Invalid login credentials", проверьте:
1. Email подтвержден (Confirmed at должен быть заполнен)
2. Пароль введен правильно
3. Пользователь активен (не заблокирован)

### Ошибка "User not found" после успешного логина

Если логин проходит успешно, но затем возникает ошибка "User not found", значит пользователь не синхронизирован с `public.users`.

**Решение:**
Запустите скрипт `013_sync_auth_users.sql` для синхронизации.
