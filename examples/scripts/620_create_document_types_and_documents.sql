-- =====================================================
-- МИГРАЦИЯ 620: СИСТЕМА ДОКУМЕНТООБОРОТА
-- =====================================================
-- Создание отдельной таблицы documents и типизации
-- Чистое разделение: documents (документооборот) vs evidence (комплаенс)
-- Версия: 1.0
-- Дата: 13 октября 2025
-- Stage: 16

-- =====================================================
-- 1. ENUM ДЛЯ ЖИЗНЕННОГО ЦИКЛА ДОКУМЕНТА
-- =====================================================

-- Уже создан в миграции 610, но проверим
DO $$ BEGIN
  CREATE TYPE document_lifecycle AS ENUM (
    'draft',        -- Черновик
    'active',       -- Действует
    'archived',     -- Архивирован
    'destroyed'     -- Уничтожен
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. ТАБЛИЦА: ТИПЫ ДОКУМЕНТОВ (Классификация)
-- =====================================================

CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = глобальный тип
  
  -- Идентификация
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),  -- organizational, technical, regulatory
  
  -- Российская специфика
  regulator VARCHAR(50),          -- ФСТЭК, Роскомнадзор, ФСБ, ЦБ РФ
  requirement_category VARCHAR(50), -- КИИ, ПДн, ГИС, Криптография
  
  -- Требования к документу
  requires_approval BOOLEAN DEFAULT true,
  requires_registration BOOLEAN DEFAULT false,
  requires_number BOOLEAN DEFAULT true,
  requires_date BOOLEAN DEFAULT true,
  requires_signature BOOLEAN DEFAULT true,
  requires_stamp BOOLEAN DEFAULT false,
  
  -- Сроки хранения (ГОСТ Р 7.0.8-2013)
  default_retention_years INTEGER,  -- 3, 5, 10, 75, NULL=постоянно
  retention_note TEXT,              -- Основание для срока
  
  -- Сроки действия и актуализации
  default_validity_months INTEGER,  -- Срок действия документа
  default_review_months INTEGER,    -- Периодичность пересмотра
  
  -- UI
  icon VARCHAR(50),
  color VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Связь с evidence_types (для автоматического маппинга)
  default_evidence_type_id UUID REFERENCES evidence_types(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, code)
);

-- Индексы для document_types
CREATE INDEX idx_document_types_tenant ON document_types(tenant_id);
CREATE INDEX idx_document_types_category ON document_types(category);
CREATE INDEX idx_document_types_regulator ON document_types(regulator);
CREATE INDEX idx_document_types_active ON document_types(is_active) WHERE is_active = true;

COMMENT ON TABLE document_types IS 'Типы документов с требованиями к реквизитам и срокам хранения';

-- =====================================================
-- 3. ТАБЛИЦА: DOCUMENTS (Система документооборота)
-- =====================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Классификация
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  template_id UUID,  -- FK добавим после создания через ALTER (избегаем циклических зависимостей)
  
  -- Основная информация
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Реквизиты (обязательно для РФ)
  document_number VARCHAR(100),
  document_date DATE,
  
  -- Версионирование
  current_version_id UUID,  -- FK to document_versions (добавим позже)
  
  -- Жизненный цикл
  lifecycle_status document_lifecycle DEFAULT 'draft',
  
  -- Утверждение
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at DATE,
  
  -- Период действия
  effective_from DATE,
  effective_until DATE,
  
  -- Пересмотр
  validity_period_days INTEGER,
  next_review_date DATE,
  last_reviewed_at TIMESTAMPTZ,
  last_reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  review_notes TEXT,
  
  -- Хранение (ГОСТ)
  retention_period_years INTEGER,
  destruction_date DATE,
  nomenclature_item_id VARCHAR(100),  -- Код по номенклатуре дел
  
  -- Конфиденциальность
  confidentiality_level VARCHAR(50) DEFAULT 'internal',
  -- public, internal, confidential, dsp, trade_secret
  
  -- Владение
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Audit
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT documents_number_org_unique UNIQUE(organization_id, document_number)
);

-- Индексы для documents
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_organization ON documents(organization_id);
CREATE INDEX idx_documents_type ON documents(document_type_id);
CREATE INDEX idx_documents_template ON documents(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX idx_documents_lifecycle ON documents(lifecycle_status);
CREATE INDEX idx_documents_active ON documents(lifecycle_status) WHERE lifecycle_status = 'active';
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_number ON documents(document_number) WHERE document_number IS NOT NULL;
CREATE INDEX idx_documents_next_review ON documents(next_review_date) WHERE next_review_date IS NOT NULL;
CREATE INDEX idx_documents_destruction ON documents(destruction_date) WHERE destruction_date IS NOT NULL;

COMMENT ON TABLE documents IS 'Система документооборота организации (независимая от evidence)';

-- =====================================================
-- 4. ОБНОВЛЕНИЕ ТАБЛИЦЫ DOCUMENT_VERSIONS
-- =====================================================

-- Уже существует, обновляем FK если нужно
ALTER TABLE document_versions 
  DROP CONSTRAINT IF EXISTS document_versions_document_id_fkey;

ALTER TABLE document_versions
  ADD CONSTRAINT document_versions_document_id_fkey
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

-- =====================================================
-- 5. ДОБАВЛЕНИЕ FK ДЛЯ current_version_id
-- =====================================================

ALTER TABLE documents
  ADD CONSTRAINT documents_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES document_versions(id) ON DELETE SET NULL;

-- =====================================================
-- 6. ТРИГГЕРЫ ДЛЯ АВТОМАТИЗАЦИИ
-- =====================================================

-- Триггер для жизненного цикла документа
CREATE OR REPLACE FUNCTION update_document_lifecycle()
RETURNS TRIGGER AS $$
DECLARE
  doc_type_record RECORD;
BEGIN
  -- Получить настройки типа документа
  IF NEW.document_type_id IS NOT NULL THEN
    SELECT 
      default_retention_years,
      default_validity_months,
      default_review_months
    INTO doc_type_record
    FROM document_types
    WHERE id = NEW.document_type_id;
  END IF;
  
  -- При утверждении: draft → active
  IF NEW.approved_at IS NOT NULL AND (OLD IS NULL OR OLD.approved_at IS NULL) THEN
    IF NEW.lifecycle_status = 'draft' THEN
      NEW.lifecycle_status := 'active';
      RAISE NOTICE 'Document approved, status changed to active';
    END IF;
    
    -- Установить effective_from если не указан
    IF NEW.effective_from IS NULL THEN
      NEW.effective_from := NEW.approved_at;
    END IF;
  END IF;
  
  -- При создании: установить значения из типа документа
  IF TG_OP = 'INSERT' THEN
    -- Срок хранения
    IF NEW.retention_period_years IS NULL AND doc_type_record.default_retention_years IS NOT NULL THEN
      NEW.retention_period_years := doc_type_record.default_retention_years;
    END IF;
    
    -- Срок действия
    IF NEW.effective_until IS NULL AND doc_type_record.default_validity_months IS NOT NULL THEN
      NEW.effective_until := CURRENT_DATE + (doc_type_record.default_validity_months || ' months')::INTERVAL;
    END IF;
    
    -- Периодичность пересмотра
    IF NEW.next_review_date IS NULL AND doc_type_record.default_review_months IS NOT NULL THEN
      NEW.next_review_date := CURRENT_DATE + (doc_type_record.default_review_months || ' months')::INTERVAL;
    END IF;
  END IF;
  
  -- Рассчитать destruction_date из retention_period_years
  IF NEW.retention_period_years IS NOT NULL AND NEW.destruction_date IS NULL THEN
    IF NEW.effective_from IS NOT NULL THEN
      NEW.destruction_date := NEW.effective_from + (NEW.retention_period_years || ' years')::INTERVAL;
    ELSIF NEW.created_at IS NOT NULL THEN
      NEW.destruction_date := NEW.created_at + (NEW.retention_period_years || ' years')::INTERVAL;
    END IF;
  END IF;
  
  -- Архивировать при истечении срока действия
  IF NEW.effective_until IS NOT NULL 
     AND NEW.effective_until < CURRENT_DATE 
     AND NEW.lifecycle_status = 'active' THEN
    NEW.lifecycle_status := 'archived';
    RAISE NOTICE 'Document archived due to effective_until';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_document_lifecycle ON documents;
CREATE TRIGGER trigger_document_lifecycle
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_lifecycle();

-- Триггер для updated_at
CREATE TRIGGER trigger_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Document types: все видят глобальные + свои
CREATE POLICY "Users can view document types" ON document_types
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NULL OR 
    tenant_id = current_setting('app.current_tenant_id', true)::UUID
  );

CREATE POLICY "Admins can manage document types" ON document_types
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Documents: tenant isolation
CREATE POLICY "Users can view documents of their tenant" ON documents
  FOR SELECT TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY "Users can create documents for their tenant" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY "Users can update documents of their tenant" ON documents
  FOR UPDATE TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY "Users can delete documents of their tenant" ON documents
  FOR DELETE TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- =====================================================
-- 8. SEED: БАЗОВЫЕ ТИПЫ ДОКУМЕНТОВ
-- =====================================================

INSERT INTO document_types (
  tenant_id, code, name, description, category,
  regulator, requirement_category,
  requires_approval, requires_number, requires_date,
  default_retention_years, default_validity_months, default_review_months,
  icon, color, sort_order
) VALUES
  -- Политики
  (NULL, 'policy-ib', 'Политика информационной безопасности', 'Основной документ по ИБ организации', 'organizational',
   NULL, 'Общее', true, true, true, NULL, 36, 12, 'Shield', 'blue', 10),
  
  (NULL, 'policy-pdn', 'Политика обработки персональных данных', 'Политика для 152-ФЗ', 'organizational',
   'Роскомнадзор', 'ПДн', true, true, true, 75, 36, 12, 'UserCheck', 'purple', 20),
  
  (NULL, 'policy-kii', 'Политика безопасности КИИ', 'Политика для 187-ФЗ', 'organizational',
   'ФСТЭК', 'КИИ', true, true, true, NULL, 36, 12, 'Server', 'red', 30),
  
  -- Приказы
  (NULL, 'order-appoint', 'Приказ о назначении ответственного', 'Назначение ответственного за ИБ/ПДн', 'organizational',
   NULL, 'Общее', true, true, true, 5, NULL, NULL, 'FileSignature', 'orange', 40),
  
  (NULL, 'order-commission', 'Приказ о создании комиссии', 'Комиссия по категорированию КИИ', 'organizational',
   'ФСТЭК', 'КИИ', true, true, true, 10, NULL, NULL, 'Users', 'red', 50),
  
  -- Акты и отчеты
  (NULL, 'kii-act', 'Акт категорирования объектов КИИ', 'Результат категорирования по 187-ФЗ', 'regulatory',
   'ФСТЭК', 'КИИ', true, true, true, 10, 60, NULL, 'FileCheck', 'red', 60),
  
  (NULL, 'incident-report', 'Отчет о компьютерном инциденте', 'Отчет в ФСТЭК по 187-ФЗ', 'regulatory',
   'ФСТЭК', 'КИИ', false, true, true, 5, NULL, NULL, 'AlertTriangle', 'red', 70),
  
  (NULL, 'audit-report', 'Отчет об аудите ИБ', 'Результаты внутреннего/внешнего аудита', 'regulatory',
   NULL, 'Общее', true, true, true, 5, 12, NULL, 'FileBarChart', 'green', 80),
  
  -- Технические документы
  (NULL, 'threat-model', 'Модель угроз безопасности', 'Модель угроз для ИСПДн/КИИ', 'technical',
   'ФСТЭК', 'ПДн', true, false, true, 5, 12, 12, 'Shield', 'purple', 90),
  
  (NULL, 'instruction', 'Инструкция', 'Инструкция для пользователей/администраторов', 'technical',
   NULL, 'Общее', true, true, true, 5, 24, 12, 'BookOpen', 'blue', 100),
  
  (NULL, 'regulation', 'Регламент', 'Регламент процессов ИБ', 'organizational',
   NULL, 'Общее', true, true, true, NULL, 36, 12, 'FileText', 'blue', 110),
  
  (NULL, 'journal', 'Журнал регистрации', 'Журнал учета событий/инцидентов', 'technical',
   NULL, 'Общее', false, true, true, 5, NULL, NULL, 'Book', 'gray', 120),
  
  (NULL, 'certificate', 'Сертификат/Аттестат', 'Сертификат соответствия, аттестат ФСТЭК', 'regulatory',
   'ФСТЭК', 'Общее', false, true, true, 10, NULL, NULL, 'Award', 'yellow', 130),
  
  (NULL, 'contract', 'Договор', 'Договор с подрядчиком/поставщиком', 'organizational',
   NULL, 'Общее', true, true, true, 5, NULL, NULL, 'FileSignature', 'orange', 140)
ON CONFLICT (tenant_id, code) DO NOTHING;

-- =====================================================
-- 9. ДОБАВИТЬ FK ДЛЯ template_id (если таблица существует)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_base_templates') THEN
    ALTER TABLE documents
      ADD CONSTRAINT documents_template_fk
      FOREIGN KEY (template_id) REFERENCES knowledge_base_templates(id) ON DELETE SET NULL;
    RAISE NOTICE 'FK to knowledge_base_templates added';
  ELSE
    RAISE NOTICE 'knowledge_base_templates table does not exist, skipping FK';
  END IF;
END $$;

-- =====================================================
-- 10. КОММЕНТАРИИ К ПОЛЯМ DOCUMENTS
-- =====================================================

COMMENT ON COLUMN documents.document_number IS 'Номер документа (№123-ИБ от 13.10.2025)';
COMMENT ON COLUMN documents.lifecycle_status IS 'Жизненный цикл: draft → active → archived → destroyed';
COMMENT ON COLUMN documents.retention_period_years IS 'Срок хранения по ГОСТ Р 7.0.8-2013';
COMMENT ON COLUMN documents.template_id IS 'ID шаблона из которого создан документ (опционально)';

-- =====================================================
-- 11. ПРОВЕРКА
-- =====================================================

SELECT 'Document system created successfully!' as status;

SELECT 
  'document_types' as table_name,
  COUNT(*) as seed_count
FROM document_types;

