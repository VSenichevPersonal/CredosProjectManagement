-- =====================================================
-- МИГРАЦИЯ 640: НАСТРОЙКИ УВЕДОМЛЕНИЙ
-- =====================================================
-- Настройки toast уведомлений для пользователей
-- Stage: 17
-- Дата: 13 октября 2025

-- =====================================================
-- 1. ТАБЛИЦА: notification_settings
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = настройки тенанта
  
  -- Настройки отображения toast
  toast_duration_ms INTEGER DEFAULT 3000,  -- 3 секунды по умолчанию
  toast_position VARCHAR(50) DEFAULT 'top-right',  -- top-right, top-left, bottom-right, bottom-left
  max_toasts_visible INTEGER DEFAULT 3,    -- Максимум одновременно
  
  -- Типы уведомлений (какие показывать)
  show_success BOOLEAN DEFAULT true,
  show_info BOOLEAN DEFAULT true,
  show_warning BOOLEAN DEFAULT true,
  show_error BOOLEAN DEFAULT true,
  
  -- Звук
  play_sound BOOLEAN DEFAULT false,
  sound_on_error BOOLEAN DEFAULT true,
  
  -- Email уведомления
  email_notifications BOOLEAN DEFAULT true,
  email_digest_frequency VARCHAR(50) DEFAULT 'daily',  -- instant, daily, weekly, never
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: один набор настроек на пользователя
  UNIQUE(user_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_notification_settings_tenant ON notification_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id);

COMMENT ON TABLE notification_settings IS 'Настройки уведомлений для пользователей и тенантов';

-- Триггер
DROP TRIGGER IF EXISTS trigger_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER trigger_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. RLS POLICIES
-- =====================================================

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their notification settings" ON notification_settings;
CREATE POLICY "Users can view their notification settings" 
  ON notification_settings
  FOR SELECT TO authenticated
  USING (
    user_id = current_setting('app.current_user_id', true)::UUID OR
    (user_id IS NULL AND tenant_id = current_setting('app.current_tenant_id', true)::UUID)
  );

DROP POLICY IF EXISTS "Users can update their notification settings" ON notification_settings;
CREATE POLICY "Users can update their notification settings" 
  ON notification_settings
  FOR ALL TO authenticated
  USING (
    user_id = current_setting('app.current_user_id', true)::UUID OR
    (user_id IS NULL AND tenant_id = current_setting('app.current_tenant_id', true)::UUID)
  );

-- =====================================================
-- 3. SEED: НАСТРОЙКИ ПО УМОЛЧАНИЮ
-- =====================================================

-- Создаем глобальные настройки по умолчанию для первого тенанта
INSERT INTO notification_settings (
  tenant_id,
  user_id,
  toast_duration_ms,
  toast_position,
  max_toasts_visible,
  show_success,
  show_info,
  show_warning,
  show_error,
  play_sound,
  email_notifications
)
SELECT 
  id as tenant_id,
  NULL as user_id,
  3000,
  'top-right',
  3,
  true,
  true,
  true,
  true,
  false,
  true
FROM tenants
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 4. ФУНКЦИЯ: ПОЛУЧИТЬ НАСТРОЙКИ
-- =====================================================

CREATE OR REPLACE FUNCTION get_notification_settings(
  p_user_id UUID
)
RETURNS TABLE (
  toast_duration_ms INTEGER,
  toast_position VARCHAR,
  max_toasts_visible INTEGER,
  show_success BOOLEAN,
  show_info BOOLEAN,
  show_warning BOOLEAN,
  show_error BOOLEAN
) AS $$
BEGIN
  -- Сначала ищем настройки пользователя
  RETURN QUERY
  SELECT 
    ns.toast_duration_ms,
    ns.toast_position,
    ns.max_toasts_visible,
    ns.show_success,
    ns.show_info,
    ns.show_warning,
    ns.show_error
  FROM notification_settings ns
  WHERE ns.user_id = p_user_id
  LIMIT 1;
  
  IF FOUND THEN
    RETURN;
  END IF;
  
  -- Если нет пользовательских, берем настройки тенанта
  RETURN QUERY
  SELECT 
    ns.toast_duration_ms,
    ns.toast_position,
    ns.max_toasts_visible,
    ns.show_success,
    ns.show_info,
    ns.show_warning,
    ns.show_error
  FROM notification_settings ns
  WHERE ns.user_id IS NULL
  LIMIT 1;
  
  -- Если и тех нет, возвращаем defaults
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      3000::INTEGER,
      'top-right'::VARCHAR,
      3::INTEGER,
      true::BOOLEAN,
      true::BOOLEAN,
      true::BOOLEAN,
      true::BOOLEAN;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 5. ПРОВЕРКА
-- =====================================================

SELECT 'Notification settings created!' as status;

SELECT 
  tenant_id,
  user_id,
  toast_duration_ms,
  toast_position,
  max_toasts_visible
FROM notification_settings;

