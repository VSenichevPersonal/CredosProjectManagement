-- Step 5: Create test compliance records with control measures
-- This script creates 3 test compliance records for Tula tenant

-- Get Tula tenant ID
DO $$
DECLARE
  v_tenant_id UUID := '11111111-1111-1111-1111-111111111111';
  v_org_id UUID;
  v_requirement_id UUID;
  v_compliance_id UUID;
  v_template_id UUID;
  v_measure_id UUID;
BEGIN
  -- Get first organization in Tula
  SELECT id INTO v_org_id 
  FROM organizations 
  WHERE tenant_id = v_tenant_id 
  LIMIT 1;

  -- Create compliance record 1: "Назначить ответственного за ИБ"
  SELECT id INTO v_requirement_id 
  FROM requirements 
  WHERE tenant_id = v_tenant_id 
    AND title ILIKE '%ответственн%'
  LIMIT 1;

  IF v_requirement_id IS NOT NULL THEN
    INSERT INTO compliance_records (
      id, requirement_id, organization_id, tenant_id,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_requirement_id, v_org_id, v_tenant_id,
      'pending', NOW(), NOW()
    ) RETURNING id INTO v_compliance_id;

    -- Create control measures from templates using correct column names
    FOR v_template_id IN 
      SELECT unnest(suggested_control_measure_template_ids) 
      FROM requirements 
      WHERE id = v_requirement_id
    LOOP
      INSERT INTO control_measures (
        id, compliance_record_id, requirement_id, organization_id, tenant_id,
        title, description, status,
        from_template, is_locked,
        created_at, updated_at
      )
      SELECT 
        gen_random_uuid(),
        v_compliance_id,
        v_requirement_id,
        v_org_id,
        v_tenant_id,
        cmt.title,
        cmt.description,
        'planned',
        true,
        false,
        NOW(),
        NOW()
      FROM control_measure_templates cmt
      WHERE cmt.id = v_template_id;
    END LOOP;
  END IF;

  -- Create compliance record 2: "Антивирусная защита"
  SELECT id INTO v_requirement_id 
  FROM requirements 
  WHERE tenant_id = v_tenant_id 
    AND title ILIKE '%антивирус%'
  LIMIT 1;

  IF v_requirement_id IS NOT NULL THEN
    INSERT INTO compliance_records (
      id, requirement_id, organization_id, tenant_id,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_requirement_id, v_org_id, v_tenant_id,
      'pending', NOW(), NOW()
    ) RETURNING id INTO v_compliance_id;

    FOR v_template_id IN 
      SELECT unnest(suggested_control_measure_template_ids) 
      FROM requirements 
      WHERE id = v_requirement_id
    LOOP
      INSERT INTO control_measures (
        id, compliance_record_id, requirement_id, organization_id, tenant_id,
        title, description, status,
        from_template, is_locked,
        created_at, updated_at
      )
      SELECT 
        gen_random_uuid(),
        v_compliance_id,
        v_requirement_id,
        v_org_id,
        v_tenant_id,
        cmt.title,
        cmt.description,
        'planned',
        true,
        false,
        NOW(),
        NOW()
      FROM control_measure_templates cmt
      WHERE cmt.id = v_template_id;
    END LOOP;
  END IF;

  -- Create compliance record 3: "Идентификация и аутентификация"
  SELECT id INTO v_requirement_id 
  FROM requirements 
  WHERE tenant_id = v_tenant_id 
    AND title ILIKE '%идентификац%'
  LIMIT 1;

  IF v_requirement_id IS NOT NULL THEN
    INSERT INTO compliance_records (
      id, requirement_id, organization_id, tenant_id,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_requirement_id, v_org_id, v_tenant_id,
      'pending', NOW(), NOW()
    ) RETURNING id INTO v_compliance_id;

    FOR v_template_id IN 
      SELECT unnest(suggested_control_measure_template_ids) 
      FROM requirements 
      WHERE id = v_requirement_id
    LOOP
      INSERT INTO control_measures (
        id, compliance_record_id, requirement_id, organization_id, tenant_id,
        title, description, status,
        from_template, is_locked,
        created_at, updated_at
      )
      SELECT 
        gen_random_uuid(),
        v_compliance_id,
        v_requirement_id,
        v_org_id,
        v_tenant_id,
        cmt.title,
        cmt.description,
        'planned',
        true,
        false,
        NOW(),
        NOW()
      FROM control_measure_templates cmt
      WHERE cmt.id = v_template_id;
    END LOOP;
  END IF;
END $$;

-- Verification query
SELECT 
  cr.id AS compliance_id,
  r.title AS requirement,
  cr.status,
  COUNT(cm.id) AS measures_count,
  array_agg(cm.title) AS measure_titles
FROM compliance_records cr
JOIN requirements r ON r.id = cr.requirement_id
LEFT JOIN control_measures cm ON cm.compliance_record_id = cr.id
WHERE cr.tenant_id = '11111111-1111-1111-1111-111111111111'
GROUP BY cr.id, r.title, cr.status
ORDER BY cr.created_at;
