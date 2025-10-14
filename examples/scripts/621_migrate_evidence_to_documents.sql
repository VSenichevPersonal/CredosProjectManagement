-- =====================================================
-- МИГРАЦИЯ 621: ПЕРЕНОС ДАННЫХ evidence → documents
-- =====================================================
-- Миграция существующих документов из evidence в новую таблицу documents
-- Stage: 16
-- Дата: 13 октября 2025

-- =====================================================
-- 1. ДОБАВИТЬ document_id В EVIDENCE
-- =====================================================

ALTER TABLE evidence ADD COLUMN IF NOT EXISTS
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_evidence_document 
  ON evidence(document_id) 
  WHERE document_id IS NOT NULL;

COMMENT ON COLUMN evidence.document_id IS 'Ссылка на документ (если доказательство = документ)';

-- =====================================================
-- 2. ПЕРЕНЕСТИ ДОКУМЕНТЫ ИЗ evidence В documents
-- =====================================================

-- Только если есть is_document поле
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'evidence' AND column_name = 'is_document'
  ) THEN
    
    -- Перенести документы
    INSERT INTO documents (
      id,
      tenant_id,
      organization_id,
      document_type_id,
      title,
      description,
      current_version_id,
      lifecycle_status,
      next_review_date,
      last_reviewed_at,
      last_reviewed_by,
      review_notes,
      retention_period_years,
      owner_id,
      created_by,
      created_at,
      updated_at
    )
    SELECT 
      e.id,
      e.tenant_id,
      e.organization_id,
      -- Попытка определить document_type по evidence_type_id
      COALESCE(
        (SELECT dt.id FROM document_types dt WHERE dt.default_evidence_type_id = e.evidence_type_id LIMIT 1),
        (SELECT dt.id FROM document_types dt WHERE dt.code = 'policy-ib' AND dt.tenant_id IS NULL LIMIT 1)
      ),
      COALESCE(e.title, e.file_name),
      e.description,
      e.current_version_id,
      CASE 
        WHEN e.status = 'approved' THEN 'active'::document_lifecycle
        WHEN e.status = 'archived' THEN 'archived'::document_lifecycle
        ELSE 'draft'::document_lifecycle
      END,
      e.next_review_date,
      e.last_reviewed_at,
      e.last_reviewed_by,
      e.review_notes,
      5,  -- По умолчанию 5 лет
      e.uploaded_by,
      e.uploaded_by,
      e.created_at,
      e.updated_at
    FROM evidence e
    WHERE e.is_document = true
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Documents migrated from evidence';
    
  ELSE
    RAISE NOTICE 'is_document column does not exist, skipping migration';
  END IF;
END $$;

-- =====================================================
-- 3. СОЗДАТЬ EVIDENCE ЗАПИСИ ДЛЯ ДОКУМЕНТОВ-ДОКАЗАТЕЛЬСТВ
-- =====================================================

-- Создаем новые evidence которые ссылаются на documents
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'evidence' AND column_name = 'is_document'
  ) THEN
    
    INSERT INTO evidence (
      tenant_id,
      organization_id,
      compliance_record_id,
      requirement_id,
      control_id,
      document_id,  -- ⭐ Ссылка на новую таблицу documents
      evidence_type_id,
      title,
      description,
      tags,
      status,
      uploaded_by,
      uploaded_at,
      created_at,
      updated_at
    )
    SELECT 
      e.tenant_id,
      e.organization_id,
      e.compliance_record_id,
      e.requirement_id,
      e.control_id,
      e.id,  -- document_id = старый evidence.id (теперь это ID в documents)
      e.evidence_type_id,
      COALESCE(e.title, e.file_name) || ' (документ)',
      e.description,
      e.tags,
      e.status,
      e.uploaded_by,
      e.uploaded_at,
      NOW(),
      NOW()
    FROM evidence e
    WHERE e.is_document = true
      AND (
        e.compliance_record_id IS NOT NULL OR 
        e.requirement_id IS NOT NULL OR
        e.control_id IS NOT NULL
      )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Evidence records created for documents';
    
  END IF;
END $$;

-- =====================================================
-- 4. УДАЛИТЬ СТАРЫЕ ПОЛЯ ИЗ evidence
-- =====================================================

-- Удаляем document-specific поля (они теперь в documents)
ALTER TABLE evidence DROP COLUMN IF EXISTS is_document CASCADE;
ALTER TABLE evidence DROP COLUMN IF EXISTS current_version_id CASCADE;
ALTER TABLE evidence DROP COLUMN IF EXISTS validity_period_days CASCADE;
ALTER TABLE evidence DROP COLUMN IF EXISTS actuality_status CASCADE;
ALTER TABLE evidence DROP COLUMN IF EXISTS document_status CASCADE;

-- Поля которые остаются (они используются и для документов через связь):
-- - next_review_date (может быть и у файлов)
-- - last_reviewed_at/by (может быть и у файлов)
-- - review_notes
-- - expires_at (для файлов тоже может быть)

-- =====================================================
-- 5. ДОБАВИТЬ CONSTRAINT: file XOR document
-- =====================================================

-- Проверка: либо файл, либо документ
ALTER TABLE evidence ADD CONSTRAINT evidence_content_check CHECK (
  (file_url IS NOT NULL AND document_id IS NULL) OR
  (file_url IS NULL AND document_id IS NOT NULL)
);

-- =====================================================
-- 6. ОБНОВЛЕНИЕ DOCUMENT_VERSIONS FK
-- =====================================================

-- Обновляем FK чтобы ссылаться на новую таблицу documents
ALTER TABLE document_versions 
  DROP CONSTRAINT IF EXISTS document_versions_document_id_fkey;

ALTER TABLE document_versions
  ADD CONSTRAINT document_versions_document_id_fkey
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

-- Аналогично для document_analyses и document_diffs
ALTER TABLE document_analyses
  DROP CONSTRAINT IF EXISTS document_analyses_document_id_fkey;

ALTER TABLE document_analyses
  ADD CONSTRAINT document_analyses_document_id_fkey
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

ALTER TABLE document_diffs
  DROP CONSTRAINT IF EXISTS document_diffs_document_id_fkey;

ALTER TABLE document_diffs
  ADD CONSTRAINT document_diffs_document_id_fkey
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

-- =====================================================
-- 7. ДОБАВИТЬ FK ДЛЯ current_version_id В documents
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'documents_current_version_fk'
  ) THEN
    ALTER TABLE documents
      ADD CONSTRAINT documents_current_version_fk
      FOREIGN KEY (current_version_id) REFERENCES document_versions(id) ON DELETE SET NULL
      DEFERRABLE INITIALLY DEFERRED;
    RAISE NOTICE 'FK documents_current_version_fk added';
  ELSE
    RAISE NOTICE 'FK documents_current_version_fk already exists, skipping';
  END IF;
END $$;

-- =====================================================
-- 8. ПРОВЕРКА МИГРАЦИИ
-- =====================================================

SELECT 
  'Migration completed!' as status,
  (SELECT COUNT(*) FROM documents) as documents_count,
  (SELECT COUNT(*) FROM evidence WHERE document_id IS NOT NULL) as evidence_with_documents,
  (SELECT COUNT(*) FROM evidence WHERE file_url IS NOT NULL) as evidence_with_files;

