-- =====================================================
-- FINALIZE MIGRATION: Remove redundant fields
-- =====================================================

-- Step 1: Verify that all requirements have suggested_control_measure_template_ids
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM requirements 
  WHERE suggested_control_measure_template_ids IS NULL 
     OR array_length(suggested_control_measure_template_ids, 1) = 0;
  
  RAISE NOTICE 'Requirements without suggested templates: %', missing_count;
END $$;

-- Step 2: Verify that all control_measure_templates have recommended_evidence_type_ids
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM control_measure_templates 
  WHERE recommended_evidence_type_ids IS NULL 
     OR array_length(recommended_evidence_type_ids, 1) = 0;
  
  RAISE NOTICE 'Templates without recommended evidence types: %', missing_count;
END $$;

-- Step 3: Check if allowed_evidence_type_ids column exists in requirements
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'requirements' 
    AND column_name = 'allowed_evidence_type_ids'
  ) THEN
    -- Remove the redundant column
    ALTER TABLE requirements DROP COLUMN allowed_evidence_type_ids;
    RAISE NOTICE 'Removed allowed_evidence_type_ids from requirements table';
  ELSE
    RAISE NOTICE 'Column allowed_evidence_type_ids does not exist in requirements table';
  END IF;
END $$;

-- Step 4: Update table comments
-- Removed comment for non-existent control_measures.allowed_evidence_type_ids column
COMMENT ON TABLE evidence_links IS 'Many-to-many junction: one evidence can prove multiple measures';
COMMENT ON COLUMN control_measure_templates.recommended_evidence_type_ids IS 'Suggested evidence types for this measure template';
COMMENT ON COLUMN requirements.suggested_control_measure_template_ids IS 'Recommended control measure templates for this requirement';
COMMENT ON COLUMN requirements.measure_mode IS 'strict = only suggested templates, flexible = any measures allowed';
COMMENT ON COLUMN requirements.evidence_type_mode IS 'strict = only recommended types, flexible = any evidence types allowed';

-- Step 5: Verify data integrity
DO $$
DECLARE
  orphaned_measures INTEGER;
  orphaned_links INTEGER;
BEGIN
  -- Check for control measures without compliance records
  SELECT COUNT(*) INTO orphaned_measures
  FROM control_measures cm
  WHERE NOT EXISTS (
    SELECT 1 FROM compliance_records cr WHERE cr.id = cm.compliance_record_id
  );
  
  IF orphaned_measures > 0 THEN
    RAISE WARNING 'Found % orphaned control measures', orphaned_measures;
  END IF;
  
  -- Check for evidence links without measures
  SELECT COUNT(*) INTO orphaned_links
  FROM evidence_links el
  WHERE NOT EXISTS (
    SELECT 1 FROM control_measures cm WHERE cm.id = el.control_measure_id
  );
  
  IF orphaned_links > 0 THEN
    RAISE WARNING 'Found % orphaned evidence links', orphaned_links;
  END IF;
  
  RAISE NOTICE 'Data integrity check complete';
END $$;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_control_measures_compliance_record 
  ON control_measures(compliance_record_id);

CREATE INDEX IF NOT EXISTS idx_evidence_links_control_measure 
  ON evidence_links(control_measure_id);

CREATE INDEX IF NOT EXISTS idx_evidence_links_evidence 
  ON evidence_links(evidence_id);

-- Final notice
DO $$
BEGIN
  RAISE NOTICE 'Migration finalized successfully';
END $$;
