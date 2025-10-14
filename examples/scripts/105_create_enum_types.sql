-- Создание ENUM типов для базы данных
-- Эти типы должны быть созданы ДО создания таблиц

-- Роли пользователей
CREATE TYPE user_role AS ENUM (
  'Super Admin',
  'Regulator Admin',
  'Ministry Employee',
  'Institution Employee',
  'CISO',
  'Auditor'
);

-- Статусы требований
CREATE TYPE requirement_status AS ENUM (
  'draft',
  'active',
  'archived'
);

-- Статусы соответствия
CREATE TYPE compliance_status AS ENUM (
  'compliant',
  'non_compliant',
  'partially_compliant',
  'not_applicable',
  'pending'
);

-- Типы уведомлений
CREATE TYPE notification_type AS ENUM (
  'requirement_assigned',
  'compliance_updated',
  'deadline_approaching',
  'system_alert'
);

-- Комментарий для документации
COMMENT ON TYPE user_role IS 'Роли пользователей в системе';
COMMENT ON TYPE requirement_status IS 'Статусы требований';
COMMENT ON TYPE compliance_status IS 'Статусы соответствия требованиям';
COMMENT ON TYPE notification_type IS 'Типы уведомлений';
