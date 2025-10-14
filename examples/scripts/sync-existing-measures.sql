-- Script to create control measures for existing compliance records
-- This fixes compliance records that were created before the automatic measure creation was working

-- STEP 1: Check which compliance records need measures
-- Run this first to see what will be fixed
WITH records_needing_measures AS (
  SELECT 
    cr.id as compliance_record_id,
    cr.requirement_id,
    cr.organization_id,
    cr.tenant_id,
    r.code as requirement_code,
    r.title as requirement_title,
    r.measure_mode,
    r.suggested_control_measure_template_ids,
    array_length(r.suggested_control_measure_template_ids, 1) as expected_measures,
    COUNT(cm.id) as existing_measures
  FROM compliance_records cr
  JOIN requirements r ON r.id = cr.requirement_id
  LEFT JOIN control_measures cm ON cm.compliance_record_id = cr.id
  WHERE r.suggested_control_measure_template_ids IS NOT NULL
    AND array_length(r.suggested_control_measure_template_ids, 1) > 0
  GROUP BY 
    cr.id, cr.requirement_id, cr.organization_id, cr.tenant_id,
    r.code, r.title, r.measure_mode, r.suggested_control_measure_template_ids
  HAVING COUNT(cm.id) = 0
)
SELECT 
  'Records needing measures' as info,
  COUNT(*) as count,
  SUM(expected_measures) as total_measures_to_create
FROM records_needing_measures;

-- Show sample of records that need fixing
SELECT 
  cr.id as compliance_record_id,
  r.code as requirement_code,
  r.title as requirement_title,
  r.measure_mode,
  array_length(r.suggested_control_measure_template_ids, 1) as templates_count,
  r.suggested_control_measure_template_ids
FROM compliance_records cr
JOIN requirements r ON r.id = cr.requirement_id
LEFT JOIN control_measures cm ON cm.compliance_record_id = cr.id
WHERE r.suggested_control_measure_template_ids IS NOT NULL
  AND array_length(r.suggested_control_measure_template_ids, 1) > 0
GROUP BY cr.id, r.code, r.title, r.measure_mode, r.suggested_control_measure_template_ids
HAVING COUNT(cm.id) = 0
LIMIT 10;

-- STEP 2: Create measures for existing compliance records
-- IMPORTANT: This will create measures for ALL compliance records that don't have them
-- Make sure you want to do this before running!

DO $$ 
DECLARE
  rec RECORD;
  template_id UUID;
  template_rec RECORD;
  new_measure_id UUID;
  created_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting measure creation for existing compliance records...';
  
  -- Loop through compliance records without measures
  FOR rec IN 
    SELECT 
      cr.id as compliance_record_id,
      cr.requirement_id,
      cr.organization_id,
      cr.tenant_id,
      r.code as requirement_code,
      r.measure_mode,
      r.suggested_control_measure_template_ids,
      r.created_by as created_by  -- Use requirement's created_by instead
    FROM compliance_records cr
    JOIN requirements r ON r.id = cr.requirement_id
    LEFT JOIN control_measures cm ON cm.compliance_record_id = cr.id
    WHERE r.suggested_control_measure_template_ids IS NOT NULL
      AND array_length(r.suggested_control_measure_template_ids, 1) > 0
    GROUP BY 
      cr.id, cr.requirement_id, cr.organization_id, cr.tenant_id,
      r.code, r.measure_mode, r.suggested_control_measure_template_ids, r.created_by
    HAVING COUNT(cm.id) = 0
  LOOP
    RAISE NOTICE 'Processing compliance record: % (requirement: %)', 
      rec.compliance_record_id, rec.requirement_code;
    
    -- Loop through each suggested template
    FOREACH template_id IN ARRAY rec.suggested_control_measure_template_ids
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
          created_by,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          rec.tenant_id,
          rec.compliance_record_id,
          rec.requirement_id,
          rec.organization_id,
          template_id,
          template_rec.title,
          template_rec.description,
          template_rec.implementation_guide,
          'planned',
          true,
          (rec.measure_mode = 'strict'),
          rec.created_by,
          NOW(),
          NOW()
        )
        RETURNING id INTO new_measure_id;
        
        created_count := created_count + 1;
        RAISE NOTICE '  ✅ Created measure: % - %', new_measure_id, template_rec.title;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ❌ Error creating measure from template %: %', template_id, SQLERRM;
        error_count := error_count + 1;
      END;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Sync complete!';
  RAISE NOTICE '📊 Created measures: %', created_count;
  RAISE NOTICE '❌ Errors: %', error_count;
  RAISE NOTICE '════════════════════════════════════════════════════════';
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
  ) as records_without_measures
FROM compliance_records cr;

-- Show sample of created measures
SELECT 
  cr.id as compliance_record_id,
  r.code as requirement_code,
  COUNT(cm.id) as measure_count,
  array_agg(cm.title) as measure_titles
FROM compliance_records cr
JOIN requirements r ON r.id = cr.requirement_id
JOIN control_measures cm ON cm.compliance_record_id = cr.id
GROUP BY cr.id, r.code
ORDER BY cr.created_at DESC
LIMIT 10;

