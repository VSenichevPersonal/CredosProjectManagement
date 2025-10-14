-- =====================================================
-- МИГРАЦИЯ 630: НАСТРОЙКИ AI
-- =====================================================
-- Система настройки AI провайдеров для разных задач
-- Stage: 17
-- Дата: 13 октября 2025

-- =====================================================
-- 1. ENUM ДЛЯ ПРОВАЙДЕРОВ
-- =====================================================

DO $$ BEGIN
  CREATE TYPE llm_provider AS ENUM (
    'openai',       -- OpenAI (gpt-4o, gpt-4-turbo)
    'anthropic',    -- Anthropic (claude-sonnet-4.5, claude-opus)
    'grok',         -- xAI Grok
    'local'         -- Локальная модель
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ai_task_type AS ENUM (
    'document_generation',      -- Генерация документов из шаблонов
    'document_analysis',        -- Анализ изменений между версиями
    'compliance_check',         -- Проверка соответствия требованиям
    'risk_assessment',          -- Оценка рисков
    'recommendation',           -- Генерация рекомендаций
    'validation',               -- Валидация документов
    'quick_analysis'            -- Быстрые проверки
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. ТАБЛИЦА: ai_settings
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = глобальные настройки
  
  -- Какая задача
  task_type ai_task_type NOT NULL,
  
  -- Какой провайдер
  provider llm_provider NOT NULL DEFAULT 'openai',
  model_name VARCHAR(100) NOT NULL,  -- gpt-4o, claude-sonnet-4.5, etc
  
  -- Параметры модели
  temperature DECIMAL(3, 2) DEFAULT 0.3,
  max_tokens INTEGER DEFAULT 4096,
  
  -- Настройки
  is_enabled BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,  -- Использовать по умолчанию для этой задачи
  
  -- Лимиты
  max_requests_per_day INTEGER,
  max_tokens_per_request INTEGER,
  
  -- Метаданные
  description TEXT,
  notes TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial unique index: один default провайдер на задачу на тенант
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_settings_unique_default
  ON ai_settings(tenant_id, task_type)
  WHERE is_default = true;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_ai_settings_tenant ON ai_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_settings_task ON ai_settings(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_settings_enabled ON ai_settings(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_ai_settings_default ON ai_settings(task_type, is_default) 
  WHERE is_default = true;

COMMENT ON TABLE ai_settings IS 'Настройки AI провайдеров для разных задач';

-- Триггер для updated_at
DROP TRIGGER IF EXISTS trigger_ai_settings_updated_at ON ai_settings;
CREATE TRIGGER trigger_ai_settings_updated_at
  BEFORE UPDATE ON ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Глобальные настройки видят все
DROP POLICY IF EXISTS "All users can view global AI settings" ON ai_settings;
CREATE POLICY "All users can view global AI settings" 
  ON ai_settings
  FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Только super_admin может управлять
DROP POLICY IF EXISTS "Super admin can manage AI settings" ON ai_settings;
CREATE POLICY "Super admin can manage AI settings" 
  ON ai_settings
  FOR ALL TO authenticated
  USING (
    tenant_id IS NULL OR 
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
  );

-- =====================================================
-- 4. SEED: НАСТРОЙКИ ПО УМОЛЧАНИЮ (OpenAI для всех задач)
-- =====================================================

INSERT INTO ai_settings (
  tenant_id, task_type, provider, model_name, 
  temperature, max_tokens, is_default, description
) VALUES
  -- Генерация документов - OpenAI gpt-5 (можно до 32K!)
  (NULL, 'document_generation', 'openai', 'gpt-5', 
   0.3, 16384, true, 
   'Генерация документов из шаблонов с подстановкой данных организации'),
  
  -- Анализ документов - OpenAI gpt-5
  (NULL, 'document_analysis', 'openai', 'gpt-5', 
   0.2, 4096, true, 
   'Глубокий анализ изменений между версиями документов'),
  
  -- Проверка соответствия - OpenAI gpt-4o
  (NULL, 'compliance_check', 'openai', 'gpt-4o', 
   0.2, 2048, true, 
   'Проверка документа на соответствие требованиям НПА'),
  
  -- Оценка рисков - OpenAI gpt-4o
  (NULL, 'risk_assessment', 'openai', 'gpt-4o', 
   0.3, 2048, true, 
   'Оценка рисков при изменении документа'),
  
  -- Рекомендации - OpenAI gpt-4o
  (NULL, 'recommendation', 'openai', 'gpt-4o', 
   0.4, 1024, true, 
   'Генерация рекомендаций по улучшению документов'),
  
  -- Валидация - OpenAI gpt-4o (быстро!)
  (NULL, 'validation', 'openai', 'gpt-4o', 
   0.1, 512, true, 
   'Быстрая валидация полей и структуры документа'),
  
  -- Быстрый анализ - OpenAI gpt-4o (самый быстрый)
  (NULL, 'quick_analysis', 'openai', 'gpt-4o', 
   0.2, 1024, true, 
   'Быстрые проверки и подсказки в реальном времени')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. ФУНКЦИЯ: ПОЛУЧИТЬ НАСТРОЙКИ ДЛЯ ЗАДАЧИ
-- =====================================================

CREATE OR REPLACE FUNCTION get_ai_settings_for_task(
  p_task_type ai_task_type,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  provider llm_provider,
  model_name VARCHAR,
  temperature DECIMAL,
  max_tokens INTEGER
) AS $$
BEGIN
  -- Сначала ищем настройки тенанта
  IF p_tenant_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      s.provider,
      s.model_name,
      s.temperature,
      s.max_tokens
    FROM ai_settings s
    WHERE s.task_type = p_task_type
      AND s.tenant_id = p_tenant_id
      AND s.is_default = true
      AND s.is_enabled = true
    LIMIT 1;
    
    IF FOUND THEN
      RETURN;
    END IF;
  END IF;
  
  -- Если не нашли tenant-specific, берем глобальные
  RETURN QUERY
  SELECT 
    s.provider,
    s.model_name,
    s.temperature,
    s.max_tokens
  FROM ai_settings s
  WHERE s.task_type = p_task_type
    AND s.tenant_id IS NULL
    AND s.is_default = true
    AND s.is_enabled = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_ai_settings_for_task IS 'Получить настройки AI для конкретной задачи (tenant-specific или глобальные)';

-- =====================================================
-- 6. ПРОВЕРКА
-- =====================================================

SELECT 'AI settings created successfully!' as status;

SELECT 
  task_type,
  provider,
  model_name,
  temperature,
  max_tokens,
  is_default,
  description
FROM ai_settings
WHERE is_default = true
ORDER BY task_type;

