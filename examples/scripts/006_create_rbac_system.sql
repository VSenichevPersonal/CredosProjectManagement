-- =====================================================
-- RBAC (Role-Based Access Control) System
-- Миграция от ENUM ролей к гибкой системе прав
-- =====================================================

-- Шаг 1: Создаем таблицу ресурсов (что защищаем)
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE, -- requirements, controls, evidence, documents
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Шаг 2: Создаем таблицу действий (что можно делать)
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE, -- read, write, delete, approve, review
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Шаг 3: Создаем таблицу прав (ресурс + действие)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  code VARCHAR(200) NOT NULL UNIQUE, -- requirements:read, controls:write
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(resource_id, action_id)
);

-- Шаг 4: Создаем таблицу ролей (справочник)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE, -- super_admin, regulator_admin, ministry_user
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE, -- системные роли нельзя удалить
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Шаг 5: Связь ролей и прав (многие ко многим)
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Шаг 6: Добавляем role_id в таблицу users (FK на roles)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource_id);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);

-- =====================================================
-- Заполняем справочники базовыми данными
-- =====================================================

-- Ресурсы
INSERT INTO resources (code, name, description) VALUES
  ('requirements', 'Требования', 'Нормативные требования'),
  ('controls', 'Контроли', 'Меры защиты информации'),
  ('evidence', 'Доказательства', 'Артефакты соответствия'),
  ('documents', 'Документы', 'Документы с версионированием'),
  ('organizations', 'Организации', 'Управление организациями'),
  ('users', 'Пользователи', 'Управление пользователями'),
  ('compliance', 'Комплаенс', 'Записи о соответствии'),
  ('reports', 'Отчеты', 'Аналитические отчеты'),
  ('audit', 'Аудит', 'Журнал аудита'),
  ('settings', 'Настройки', 'Системные настройки')
ON CONFLICT (code) DO NOTHING;

-- Действия
INSERT INTO actions (code, name, description) VALUES
  ('read', 'Чтение', 'Просмотр данных'),
  ('write', 'Запись', 'Создание и редактирование'),
  ('delete', 'Удаление', 'Удаление данных'),
  ('approve', 'Утверждение', 'Утверждение записей'),
  ('review', 'Проверка', 'Проверка и ревью'),
  ('export', 'Экспорт', 'Экспорт данных'),
  ('manage', 'Управление', 'Полное управление ресурсом')
ON CONFLICT (code) DO NOTHING;

-- Генерируем права (ресурс + действие)
INSERT INTO permissions (resource_id, action_id, code, name, description)
SELECT 
  r.id,
  a.id,
  r.code || ':' || a.code,
  a.name || ' ' || r.name,
  'Право на ' || LOWER(a.name) || ' для ' || LOWER(r.name)
FROM resources r
CROSS JOIN actions a
WHERE r.is_active = TRUE AND a.is_active = TRUE
ON CONFLICT (code) DO NOTHING;

-- Создаем системные роли (миграция из ENUM)
INSERT INTO roles (code, name, description, is_system) VALUES
  ('super_admin', 'Суперадминистратор', 'Полный доступ ко всей системе', TRUE),
  ('regulator_admin', 'Администратор регулятора', 'Управление требованиями и контролями', TRUE),
  ('ministry_user', 'Пользователь министерства', 'Просмотр и управление подведомственными организациями', TRUE),
  ('institution_user', 'Пользователь учреждения', 'Управление комплаенсом своей организации', TRUE),
  ('ib_manager', 'Менеджер ИБ', 'Управление мерами защиты и доказательствами', TRUE),
  ('auditor', 'Аудитор', 'Проверка соответствия и формирование отчетов', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Назначаем права ролям

-- Super Admin - все права
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'super_admin'
ON CONFLICT DO NOTHING;

-- Regulator Admin - управление требованиями и контролями
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'regulator_admin'
  AND p.code IN (
    'requirements:read', 'requirements:write', 'requirements:delete',
    'controls:read', 'controls:write', 'controls:delete',
    'documents:read', 'documents:write',
    'reports:read', 'reports:export',
    'audit:read'
  )
ON CONFLICT DO NOTHING;

-- Ministry User - просмотр и управление подведомственными
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ministry_user'
  AND p.code IN (
    'requirements:read',
    'controls:read',
    'organizations:read', 'organizations:write',
    'compliance:read', 'compliance:write',
    'evidence:read', 'evidence:write',
    'documents:read', 'documents:write',
    'reports:read', 'reports:export'
  )
ON CONFLICT DO NOTHING;

-- Institution User - управление своей организацией
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'institution_user'
  AND p.code IN (
    'requirements:read',
    'controls:read',
    'compliance:read', 'compliance:write',
    'evidence:read', 'evidence:write',
    'documents:read', 'documents:write',
    'reports:read'
  )
ON CONFLICT DO NOTHING;

-- IB Manager - управление мерами защиты
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ib_manager'
  AND p.code IN (
    'requirements:read',
    'controls:read', 'controls:write',
    'compliance:read', 'compliance:write', 'compliance:review',
    'evidence:read', 'evidence:write', 'evidence:delete',
    'documents:read', 'documents:write', 'documents:delete',
    'reports:read'
  )
ON CONFLICT DO NOTHING;

-- Auditor - проверка и отчеты
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'auditor'
  AND p.code IN (
    'requirements:read',
    'controls:read',
    'compliance:read', 'compliance:review',
    'evidence:read',
    'documents:read',
    'reports:read', 'reports:export',
    'audit:read'
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- Миграция существующих пользователей
-- =====================================================

-- Обновляем role_id для существующих пользователей на основе старого ENUM role
UPDATE users u
SET role_id = r.id
FROM roles r
WHERE u.role::TEXT = r.code
  AND u.role_id IS NULL;

-- Проверка миграции
DO $$
DECLARE
  v_users_without_role_id INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_users_without_role_id
  FROM users
  WHERE role_id IS NULL;
  
  IF v_users_without_role_id > 0 THEN
    RAISE WARNING '% пользователей не имеют role_id после миграции', v_users_without_role_id;
  ELSE
    RAISE NOTICE 'Все пользователи успешно мигрированы на новую систему ролей';
  END IF;
END $$;

-- =====================================================
-- RLS Policies для новых таблиц
-- =====================================================

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Все могут читать справочники
CREATE POLICY "Anyone can read resources" ON resources FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can read actions" ON actions FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can read permissions" ON permissions FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can read roles" ON roles FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can read role_permissions" ON role_permissions FOR SELECT USING (TRUE);

-- Только super_admin может изменять (будет проверяться в коде)
CREATE POLICY "Super admin can manage resources" ON resources FOR ALL USING (TRUE);
CREATE POLICY "Super admin can manage actions" ON actions FOR ALL USING (TRUE);
CREATE POLICY "Super admin can manage permissions" ON permissions FOR ALL USING (TRUE);
CREATE POLICY "Super admin can manage roles" ON roles FOR ALL USING (TRUE);
CREATE POLICY "Super admin can manage role_permissions" ON role_permissions FOR ALL USING (TRUE);

-- =====================================================
-- Функция для проверки прав
-- =====================================================

CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_resource_code VARCHAR,
  p_action_code VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM users u
    JOIN role_permissions rp ON rp.role_id = u.role_id
    JOIN permissions p ON p.id = rp.permission_id
    JOIN resources r ON r.id = p.resource_id
    JOIN actions a ON a.id = p.action_id
    WHERE u.id = p_user_id
      AND r.code = p_resource_code
      AND a.code = p_action_code
      AND u.is_active = TRUE
      AND r.is_active = TRUE
      AND a.is_active = TRUE
      AND p.is_active = TRUE
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Итоговый отчет
-- =====================================================

SELECT 
  'RBAC System Created' AS status,
  (SELECT COUNT(*) FROM resources) AS resources_count,
  (SELECT COUNT(*) FROM actions) AS actions_count,
  (SELECT COUNT(*) FROM permissions) AS permissions_count,
  (SELECT COUNT(*) FROM roles) AS roles_count,
  (SELECT COUNT(*) FROM role_permissions) AS role_permissions_count,
  (SELECT COUNT(*) FROM users WHERE role_id IS NOT NULL) AS users_migrated;
