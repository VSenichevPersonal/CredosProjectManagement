-- Debug script to find out why 29 records still don't have measures

-- 1. Check which records don't have measures
SELECT 
  '❌ Records without measures' as info,
  cr.id as compliance_record_id,
  r.code as requirement_code,
  r.title as requirement_title,
  r.suggested_control_measure_template_ids,
  array_length(r.suggested_control_measure_template_ids, 1) as template_count,
  (
    SELECT COUNT(*) 
    FROM control_measures cm 
    WHERE cm.compliance_record_id = cr.id
  ) as actual_measures,
  cr.created_at
FROM compliance_records cr
JOIN requirements r ON r.id = cr.requirement_id
WHERE r.suggested_control_measure_template_ids IS NOT NULL
  AND array_length(r.suggested_control_measure_template_ids, 1) > 0
  AND NOT EXISTS (
    SELECT 1 FROM control_measures cm 
    WHERE cm.compliance_record_id = cr.id
  )
ORDER BY cr.created_at DESC
LIMIT 10;

-- 2. Check if templates exist for these requirements
WITH missing_records AS (
  SELECT 
    cr.id as compliance_record_id,
    r.id as requirement_id,
    r.code,
    r.suggested_control_measure_template_ids
  FROM compliance_records cr
  JOIN requirements r ON r.id = cr.requirement_id
  WHERE r.suggested_control_measure_template_ids IS NOT NULL
    AND array_length(r.suggested_control_measure_template_ids, 1) > 0
    AND NOT EXISTS (
      SELECT 1 FROM control_measures cm 
      WHERE cm.compliance_record_id = cr.id
    )
  LIMIT 5
)
SELECT 
  mr.code,
  mr.compliance_record_id,
  unnest(mr.suggested_control_measure_template_ids) as template_id,
  CASE 
    WHEN cmt.id IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as template_status,
  cmt.title
FROM missing_records mr
LEFT JOIN control_measure_templates cmt ON cmt.id = ANY(mr.suggested_control_measure_template_ids);

-- 3. Try to manually create measures for ONE record to see the error
DO $$
DECLARE
  test_compliance_id UUID;
  test_requirement_id UUID;
  test_org_id UUID;
  test_tenant_id UUID;
  template_ids UUID[];
  template_id UUID;
  template_rec RECORD;
BEGIN
  -- Get first compliance record without measures
  SELECT 
    cr.id,
    cr.requirement_id,
    cr.organization_id,
    cr.tenant_id,
    r.suggested_control_measure_template_ids
  INTO 
    test_compliance_id,
    test_requirement_id,
    test_org_id,
    test_tenant_id,
    template_ids
  FROM compliance_records cr
  JOIN requirements r ON r.id = cr.requirement_id
  WHERE r.suggested_control_measure_template_ids IS NOT NULL
    AND array_length(r.suggested_control_measure_template_ids, 1) > 0
    AND NOT EXISTS (
      SELECT 1 FROM control_measures cm 
      WHERE cm.compliance_record_id = cr.id
    )
  LIMIT 1;

  IF test_compliance_id IS NULL THEN
    RAISE NOTICE '✅ No records without measures found!';
    RETURN;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🧪 Testing measure creation for compliance record: %', test_compliance_id;
  RAISE NOTICE '   Organization ID: %', test_org_id;
  RAISE NOTICE '   Tenant ID: %', test_tenant_id;
  RAISE NOTICE '   Templates to create: %', array_length(template_ids, 1);
  RAISE NOTICE '';

  -- Try to create each measure
  FOREACH template_id IN ARRAY template_ids
  LOOP
    BEGIN
      RAISE NOTICE '📝 Attempting to create measure from template: %', template_id;
      
      -- Get template
      SELECT * INTO template_rec
      FROM control_measure_templates
      WHERE id = template_id;
      
      IF NOT FOUND THEN
        RAISE NOTICE '   ❌ Template not found!';
        CONTINUE;
      END IF;
      
      RAISE NOTICE '   Template found: %', template_rec.title;
      
      -- Try to insert
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
        test_tenant_id,
        test_compliance_id,
        test_requirement_id,
        test_org_id,
        template_id,
        template_rec.title,
        template_rec.description,
        template_rec.implementation_guide,
        'planned',
        true,
        false,
        NOW(),
        NOW()
      );
      
      RAISE NOTICE '   ✅ Successfully created measure!';
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '   ❌ ERROR: %', SQLERRM;
      RAISE NOTICE '   Error code: %', SQLSTATE;
      RAISE NOTICE '   Error detail: %', SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test completed';
  
END $$;

-- 4. Check RLS policies on control_measures
SELECT 
  '🔒 RLS Policies' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'control_measures'
ORDER BY cmd, policyname;

-- 5. Check if tenant_id and organization_id are valid
SELECT 
  '🔍 Data validation' as info,
  cr.id as compliance_record_id,
  cr.tenant_id,
  (SELECT COUNT(*) FROM tenants WHERE id = cr.tenant_id) as tenant_exists,
  cr.organization_id,
  (SELECT COUNT(*) FROM organizations WHERE id = cr.organization_id) as org_exists
FROM compliance_records cr
WHERE NOT EXISTS (
  SELECT 1 FROM control_measures cm 
  WHERE cm.compliance_record_id = cr.id
)
LIMIT 5;

