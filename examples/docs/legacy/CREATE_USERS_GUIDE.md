# Создание пользователей в Supabase

## Шаг 1: Откройте Supabase Dashboard

1. Перейдите в **Authentication** → **Users**
2. Нажмите **Add user** → **Create new user**

## Шаг 2: Создайте пользователей с metadata

Для каждого пользователя заполните:

### 1. Системный администратор (Super Admin)

- **Email:** `admin@mail.ru`
- **Password:** `admin@mail.ru`
- **Auto Confirm User:** ✅ (включить)
- **User Metadata (JSON):**
\`\`\`json
{
  "name": "Системный администратор",
  "role": "super_admin"
}
\`\`\`

### 2. Администратор ФСТЭК (Regulator Admin)

- **Email:** `regulator@mail.ru`
- **Password:** `regulator@mail.ru`
- **Auto Confirm User:** ✅
- **User Metadata (JSON):**
\`\`\`json
{
  "name": "Администратор ФСТЭК",
  "role": "regulator_admin"
}
\`\`\`

### 3. Сотрудник министерства (Ministry User)

- **Email:** `ministry@mail.ru`
- **Password:** `ministry@mail.ru`
- **Auto Confirm User:** ✅
- **User Metadata (JSON):**
\`\`\`json
{
  "name": "Сотрудник министерства",
  "role": "ministry_user"
}
\`\`\`

### 4. Сотрудник учреждения (Institution User)

- **Email:** `institution@mail.ru`
- **Password:** `institution@mail.ru`
- **Auto Confirm User:** ✅
- **User Metadata (JSON):**
\`\`\`json
{
  "name": "Сотрудник учреждения",
  "role": "institution_user"
}
\`\`\`

### 5. Руководитель ИБ (CISO)

- **Email:** `ciso@mail.ru`
- **Password:** `ciso@mail.ru`
- **Auto Confirm User:** ✅
- **User Metadata (JSON):**
\`\`\`json
{
  "name": "Руководитель ИБ",
  "role": "ciso"
}
\`\`\`

### 6. Аудитор (Auditor)

- **Email:** `auditor@mail.ru`
- **Password:** `auditor@mail.ru`
- **Auto Confirm User:** ✅
- **User Metadata (JSON):**
\`\`\`json
{
  "name": "Аудитор",
  "role": "auditor"
}
\`\`\`

## Шаг 3: Проверка

После создания всех пользователей запустите проверку:

\`\`\`sql
-- Проверить, что пользователи созданы в auth.users
SELECT id, email, raw_user_meta_data FROM auth.users;

-- Проверить, что триггер создал записи в public.users
SELECT id, email, name, role, is_active FROM public.users;
\`\`\`

Должно быть 6 пользователей в обеих таблицах с одинаковыми ID.

## Шаг 4: Назначение организаций

После создания пользователей нужно назначить их организациям:

\`\`\`sql
-- Получить ID организаций
SELECT id, name FROM organizations;

-- Назначить пользователей организациям (замените UUID на реальные ID)
UPDATE users SET organization_id = (SELECT id FROM organizations WHERE name = 'ФСТЭК России')
WHERE email = 'regulator@mail.ru';

UPDATE users SET organization_id = (SELECT id FROM organizations WHERE name = 'Министерство здравоохранения')
WHERE email = 'ministry@mail.ru';

UPDATE users SET organization_id = (SELECT id FROM organizations WHERE name = 'Городская больница №1')
WHERE email IN ('institution@mail.ru', 'ciso@mail.ru');

UPDATE users SET organization_id = (SELECT id FROM organizations WHERE name = 'Аудиторская компания "Безопасность"')
WHERE email = 'auditor@mail.ru';
\`\`\`

## Шаг 5: Тестирование логина

Попробуйте войти с любым пользователем:
- Email: `admin@mail.ru`
- Password: `admin@mail.ru`

Триггер автоматически создал запись в `public.users`, и логин должен работать!

## Troubleshooting

### Ошибка "Invalid login credentials"
- Проверьте, что пользователь создан в auth.users
- Проверьте, что Auto Confirm User включен
- Проверьте правильность пароля

### Ошибка "Database error querying schema"
- Проверьте, что триггер `on_auth_user_created` существует
- Проверьте, что функция `handle_new_user` работает
- Запустите диагностику: `scripts/103_check_auth_setup.sql`

### Пользователь не появился в public.users
- Проверьте логи Supabase Dashboard → Database → Logs
- Проверьте, что триггер не упал с ошибкой
- Проверьте формат metadata (должен быть валидный JSON)
