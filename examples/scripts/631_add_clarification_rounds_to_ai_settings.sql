-- =====================================================
-- Migration: Add max_clarification_rounds to ai_settings
-- Date: 2025-10-14
-- Purpose: Support for iterative clarification questions
-- =====================================================

-- Добавить поле для настройки количества кругов вопросов
ALTER TABLE ai_settings 
ADD COLUMN IF NOT EXISTS max_clarification_rounds INTEGER DEFAULT 3
  CHECK (max_clarification_rounds >= 1 AND max_clarification_rounds <= 10);

COMMENT ON COLUMN ai_settings.max_clarification_rounds IS 
  'Максимальное количество кругов уточняющих вопросов для document_generation (1-10)';

-- Обновить существующую настройку document_generation (если есть)
UPDATE ai_settings 
SET max_clarification_rounds = 3
WHERE task_type = 'document_generation'
  AND max_clarification_rounds IS NULL;

-- Success
SELECT 'Added max_clarification_rounds to ai_settings' AS status;

