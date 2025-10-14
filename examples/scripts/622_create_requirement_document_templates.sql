-- =====================================================
-- МИГРАЦИЯ 622: СВЯЗЬ ТРЕБОВАНИЙ И ШАБЛОНОВ ДОКУМЕНТОВ
-- =====================================================
-- Автоматические рекомендации документов для требований
-- Stage: 16
-- Дата: 13 октября 2025

-- =====================================================
-- 1. ТАБЛИЦА: requirement_document_templates
-- =====================================================

CREATE TABLE IF NOT EXISTS requirement_document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Связи
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  template_id UUID NOT NULL,  -- FK добавим после проверки существования таблицы
  document_type_id UUID REFERENCES document_types(id) ON DELETE SET NULL,
  
  -- Рекомендация
  is_recommended BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 50,  -- 0-100, чем выше тем важнее
  
  -- Инструкции по использованию
  usage_instructions TEXT,
  customization_notes TEXT,  -- Что нужно кастомизировать в шаблоне
  
  -- Автоматизация
  auto_create_on_compliance BOOLEAN DEFAULT false,  -- Создавать ли автоматически при создании compliance_record
  suggested_control_template_ids UUID[],  -- С какими мерами связывать
  
  -- Audit
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(requirement_id, template_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_req_doc_templates_requirement ON requirement_document_templates(requirement_id);
CREATE INDEX IF NOT EXISTS idx_req_doc_templates_template ON requirement_document_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_req_doc_templates_priority ON requirement_document_templates(priority DESC);
CREATE INDEX IF NOT EXISTS idx_req_doc_templates_auto_create ON requirement_document_templates(auto_create_on_compliance) 
  WHERE auto_create_on_compliance = true;

COMMENT ON TABLE requirement_document_templates IS 'Рекомендуемые шаблоны документов для требований';

-- Триггер для updated_at
DROP TRIGGER IF EXISTS trigger_req_doc_templates_updated_at ON requirement_document_templates;
CREATE TRIGGER trigger_req_doc_templates_updated_at
  BEFORE UPDATE ON requirement_document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. RLS POLICIES
-- =====================================================

ALTER TABLE requirement_document_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All users can view requirement document templates" ON requirement_document_templates;
CREATE POLICY "All users can view requirement document templates" 
  ON requirement_document_templates
  FOR SELECT TO authenticated
  USING (true);  -- Публичные рекомендации

DROP POLICY IF EXISTS "Admins can manage requirement document templates" ON requirement_document_templates;
CREATE POLICY "Admins can manage requirement document templates" 
  ON requirement_document_templates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM requirements r
      WHERE r.id = requirement_id
        AND r.tenant_id = current_setting('app.current_tenant_id', true)::UUID
    )
  );

-- =====================================================
-- 2. ДОБАВИТЬ FK (если таблица существует)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_base_templates') THEN
    ALTER TABLE requirement_document_templates
      ADD CONSTRAINT requirement_doc_templates_template_fk
      FOREIGN KEY (template_id) REFERENCES knowledge_base_templates(id) ON DELETE CASCADE;
    RAISE NOTICE 'FK to knowledge_base_templates added';
  ELSE
    RAISE NOTICE 'knowledge_base_templates table does not exist, skipping FK';
  END IF;
END $$;

-- =====================================================
-- 3. SEED: БАЗОВЫЕ РЕКОМЕНДАЦИИ
-- =====================================================

-- Получаем ID шаблонов из knowledge_base_templates
DO $$
DECLARE
  template_policy_ib UUID;
  template_policy_pdn UUID;
  template_kii_act UUID;
  template_order_appoint UUID;
  template_threat_model UUID;
  
  req_kii_002 UUID;
  req_kii_003 UUID;
  req_pdn_001 UUID;
  req_pdn_002 UUID;
BEGIN
  -- Получаем ID шаблонов (по названию) - если таблица существует
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_base_templates') THEN
    SELECT id INTO template_policy_ib FROM knowledge_base_templates 
      WHERE title ILIKE '%Политика информационной безопасности%' LIMIT 1;
    
    SELECT id INTO template_policy_pdn FROM knowledge_base_templates 
      WHERE title ILIKE '%Политика обработки персональных данных%' LIMIT 1;
    
    SELECT id INTO template_kii_act FROM knowledge_base_templates 
      WHERE title ILIKE '%Акт категорирования%' LIMIT 1;
    
    SELECT id INTO template_order_appoint FROM knowledge_base_templates 
      WHERE title ILIKE '%Приказ о назначении%' LIMIT 1;
    
    SELECT id INTO template_threat_model FROM knowledge_base_templates 
      WHERE title ILIKE '%Модель угроз%' LIMIT 1;
  ELSE
    RAISE NOTICE 'knowledge_base_templates table does not exist, skipping seed';
    RETURN;
  END IF;
  
  -- Получаем ID требований (по коду)
  SELECT id INTO req_kii_002 FROM requirements WHERE code = 'КИИ-002' LIMIT 1;
  SELECT id INTO req_kii_003 FROM requirements WHERE code = 'КИИ-003' LIMIT 1;
  SELECT id INTO req_pdn_001 FROM requirements WHERE code LIKE 'ПДн-%' LIMIT 1;
  
  -- Создаем рекомендации если нашли требования и шаблоны
  IF req_kii_002 IS NOT NULL AND template_kii_act IS NOT NULL THEN
    INSERT INTO requirement_document_templates (
      requirement_id, template_id, 
      is_recommended, priority,
      usage_instructions,
      auto_create_on_compliance
    ) VALUES (
      req_kii_002, template_kii_act,
      true, 100,
      'Заполните акт по результатам работы комиссии. Укажите категорию значимости объекта КИИ.',
      true
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Recommendation created: КИИ-002 → Акт категорирования';
  END IF;
  
  IF req_kii_003 IS NOT NULL AND template_policy_ib IS NOT NULL THEN
    INSERT INTO requirement_document_templates (
      requirement_id, template_id,
      is_recommended, priority,
      usage_instructions,
      auto_create_on_compliance
    ) VALUES (
      req_kii_003, template_policy_ib,
      true, 90,
      'Адаптируйте шаблон политики для вашей организации. Учтите специфику объектов КИИ.',
      false
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Recommendation created: КИИ-003 → Политика ИБ';
  END IF;
  
  IF req_pdn_001 IS NOT NULL AND template_policy_pdn IS NOT NULL THEN
    INSERT INTO requirement_document_templates (
      requirement_id, template_id,
      is_recommended, priority,
      usage_instructions,
      auto_create_on_compliance
    ) VALUES (
      req_pdn_001, template_policy_pdn,
      true, 100,
      'Политика обработки ПДн обязательна по 152-ФЗ. Укажите категории ПДн и меры защиты.',
      true
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Recommendation created: ПДн → Политика ПДн';
  END IF;
  
  IF req_pdn_001 IS NOT NULL AND template_threat_model IS NOT NULL THEN
    INSERT INTO requirement_document_templates (
      requirement_id, template_id,
      is_recommended, priority,
      usage_instructions,
      auto_create_on_compliance
    ) VALUES (
      req_pdn_001, template_threat_model,
      true, 95,
      'Модель угроз обязательна для ИСПДн. Актуализируйте ежегодно или при изменении системы.',
      false
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Recommendation created: ПДн → Модель угроз';
  END IF;
  
END $$;

-- =====================================================
-- 9. ПРОВЕРКА
-- =====================================================

SELECT 
  'requirement_document_templates created' as status,
  COUNT(*) as recommendations_count
FROM requirement_document_templates;

-- Проверочный запрос (только если есть таблица шаблонов)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_base_templates') THEN
    RAISE NOTICE 'Recommendations with templates:';
    PERFORM r.code, kbt.title, rdt.priority
    FROM requirement_document_templates rdt
    JOIN requirements r ON r.id = rdt.requirement_id
    LEFT JOIN knowledge_base_templates kbt ON kbt.id = rdt.template_id
    ORDER BY r.code, rdt.priority DESC;
  ELSE
    RAISE NOTICE 'knowledge_base_templates table does not exist, skipping detailed check';
  END IF;
END $$;

