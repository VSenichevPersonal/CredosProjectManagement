-- Simplified script to create control measures for existing compliance records
-- This version is more straightforward and handles missing columns gracefully

-- STEP 1: Preview what will be created
SELECT 
  cr.id as compliance_record_id,
  r.code as requirement_code,
  r.title as requirement_title,
  array_length(r.suggested_control_measure_template_ids, 1) as measures_to_create,
  COUNT(cm.id) as existing_measures
FROM compliance_records cr
JOIN requirements r ON r.id = cr.requirement_id
LEFT JOIN control_measures cm ON cm.compliance_record_id = cr.id
WHERE r.suggested_control_measure_template_ids IS NOT NULL
  AND array_length(r.suggested_control_measure_template_ids, 1) > 0
GROUP BY cr.id, r.code, r.title, r.suggested_control_measure_template_ids
HAVING COUNT(cm.id) = 0
ORDER BY cr.created_at;

-- STEP 2: Create measures for all compliance records without measures
-- Run this after reviewing the preview above
DO $$ 
DECLARE
  compliance_rec RECORD;
  template_id UUID;
  template_rec RECORD;
  created_count INTEGER := 0;
  error_count INTEGER := 0;
  total_to_process INTEGER := 0;
BEGIN
  -- Count total records to process
  SELECT COUNT(*) INTO total_to_process
  FROM (
    SELECT cr.id
    FROM compliance_records cr
    JOIN requirements r ON r.id = cr.requirement_id
    LEFT JOIN control_measures cm ON cm.compliance_record_id = cr.id
    WHERE r.suggested_control_measure_template_ids IS NOT NULL
      AND array_length(r.suggested_control_measure_template_ids, 1) > 0
    GROUP BY cr.id
    HAVING COUNT(cm.id) = 0
  ) sub;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '🚀 Starting measure creation';
  RAISE NOTICE '📊 Total compliance records to process: %', total_to_process;
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Loop through compliance records without measures
  FOR compliance_rec IN 
    SELECT 
      cr.id,
      cr.requirement_id,
      cr.organization_id,
      cr.tenant_id,
      r.code,
      r.title,
      r.measure_mode,
      r.suggested_control_measure_template_ids
    FROM compliance_records cr
    JOIN requirements r ON r.id = cr.requirement_id
    LEFT JOIN control_measures cm ON cm.compliance_record_id = cr.id
    WHERE r.suggested_control_measure_template_ids IS NOT NULL
      AND array_length(r.suggested_control_measure_template_ids, 1) > 0
    GROUP BY 
      cr.id, cr.requirement_id, cr.organization_id, cr.tenant_id,
      r.code, r.title, r.measure_mode, r.suggested_control_measure_template_ids
    HAVING COUNT(cm.id) = 0
  LOOP
    RAISE NOTICE '[%/%] Processing: % - %', 
      created_count + error_count + 1,
      total_to_process,
      compliance_rec.code,
      compliance_rec.title;
    
    -- Loop through each suggested template
    FOREACH template_id IN ARRAY compliance_rec.suggested_control_measure_template_ids
    LOOP
      BEGIN
        -- Get template details
        SELECT * INTO template_rec
        FROM control_measure_templates
        WHERE id = template_id;
        
        IF NOT FOUND THEN
          RAISE NOTICE '  ⚠️  Template not found: %', template_id;
          error_count := error_count + 1;
          CONTINUE;
        END IF;
        
        -- Create control measure
        INSERT INTO control_measures (
          id,
          tenant_id,
          compliance_record_id,
          requirement_id,
          organization_id,
          template_id,
          title,
          description,
          implementation_notes,
          status,
          from_template,
          is_locked,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          compliance_rec.tenant_id,
          compliance_rec.id,
          compliance_rec.requirement_id,
          compliance_rec.organization_id,
          template_id,
          template_rec.title,
          template_rec.description,
          template_rec.implementation_guide,
          'planned',
          true,
          (compliance_rec.measure_mode = 'strict'),
          NOW(),
          NOW()
        );
        
        created_count := created_count + 1;
        RAISE NOTICE '  ✅ Created: %', template_rec.title;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ❌ Error creating measure from template %: %', template_id, SQLERRM;
        error_count := error_count + 1;
      END;
    END LOOP;
    
    RAISE NOTICE '';
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Sync complete!';
  RAISE NOTICE '📊 Statistics:';
  RAISE NOTICE '   • Compliance records processed: %', total_to_process;
  RAISE NOTICE '   • Measures created: %', created_count;
  RAISE NOTICE '   • Errors: %', error_count;
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- STEP 3: Verify the results
SELECT 
  'After sync' as status,
  COUNT(*) as total_compliance_records,
  COUNT(*) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM control_measures cm 
      WHERE cm.compliance_record_id = cr.id
    )
  ) as records_with_measures,
  COUNT(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM control_measures cm 
      WHERE cm.compliance_record_id = cr.id
    )
    AND EXISTS (
      SELECT 1 FROM requirements r
      WHERE r.id = cr.requirement_id
      AND r.suggested_control_measure_template_ids IS NOT NULL
      AND array_length(r.suggested_control_measure_template_ids, 1) > 0
    )
  ) as records_still_without_measures
FROM compliance_records cr;

-- STEP 4: Show sample of created measures
SELECT 
  cr.id as compliance_record_id,
  r.code as requirement_code,
  r.title as requirement_title,
  COUNT(cm.id) as measure_count,
  string_agg(cm.title, ', ') as measure_titles
FROM compliance_records cr
JOIN requirements r ON r.id = cr.requirement_id
JOIN control_measures cm ON cm.compliance_record_id = cr.id
WHERE cm.from_template = true
GROUP BY cr.id, r.code, r.title
ORDER BY cr.created_at DESC
LIMIT 10;

