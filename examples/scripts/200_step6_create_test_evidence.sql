-- Step 6: Create test evidence and evidence_links
-- This script creates test evidence files and demonstrates evidence reuse

DO $$
DECLARE
  v_tenant_id UUID := '11111111-1111-1111-1111-111111111111';
  v_org_id UUID;
  v_user_id UUID;
  v_evidence_id UUID;
  v_measure_id UUID;
  v_evidence_type_id UUID;
BEGIN
  -- Get organization and user
  SELECT id INTO v_org_id 
  FROM organizations 
  WHERE tenant_id = v_tenant_id 
  LIMIT 1;

  SELECT id INTO v_user_id 
  FROM users 
  LIMIT 1;

  -- Evidence 1: Приказ о назначении ответственного
  -- Use code instead of slug for evidence_types
  SELECT id INTO v_evidence_type_id 
  FROM evidence_types 
  WHERE code = 'policy' OR title ILIKE '%приказ%'
  LIMIT 1;

  -- Added file_type field (required NOT NULL column)
  INSERT INTO evidence (
    id, tenant_id, uploaded_by,
    evidence_type_id, file_name, file_url, file_type, file_size,
    title, description, status, uploaded_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_tenant_id, v_user_id,
    v_evidence_type_id, 'Приказ №12 о назначении ответственного.pdf',
    '/evidence/order-12.pdf', 'application/pdf', 245678,
    'Приказ о назначении ответственного', 'Приказ №12 от 01.01.2025', 
    'approved', NOW(), NOW(), NOW()
  ) RETURNING id INTO v_evidence_id;

  -- Link to multiple measures (demonstrating reuse)
  FOR v_measure_id IN 
    SELECT id FROM control_measures 
    WHERE tenant_id = v_tenant_id 
      AND title ILIKE '%2FA%'
    LIMIT 2
  LOOP
    INSERT INTO evidence_links (
      id, evidence_id, control_measure_id, tenant_id,
      created_by, link_reason, relevance_score, created_at
    ) VALUES (
      gen_random_uuid(), v_evidence_id, v_measure_id, v_tenant_id,
      v_user_id, 'Приказ подтверждает выполнение меры', 5, NOW()
    );
  END LOOP;

  -- Evidence 2: Журнал учета
  SELECT id INTO v_evidence_type_id 
  FROM evidence_types 
  WHERE code = 'log' OR title ILIKE '%журнал%'
  LIMIT 1;

  -- Added file_type field for Excel file
  INSERT INTO evidence (
    id, tenant_id, uploaded_by,
    evidence_type_id, file_name, file_url, file_type, file_size,
    title, description, status, uploaded_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_tenant_id, v_user_id,
    v_evidence_type_id, 'Журнал учета доступа.xlsx',
    '/evidence/access-log.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 89234,
    'Журнал учета доступа', 'Журнал ведется с 01.01.2025',
    'approved', NOW(), NOW(), NOW()
  ) RETURNING id INTO v_evidence_id;

  -- Link to journal measures
  FOR v_measure_id IN 
    SELECT id FROM control_measures 
    WHERE tenant_id = v_tenant_id 
      AND title ILIKE '%парол%'
    LIMIT 1
  LOOP
    INSERT INTO evidence_links (
      id, evidence_id, control_measure_id, tenant_id,
      created_by, link_reason, relevance_score, created_at
    ) VALUES (
      gen_random_uuid(), v_evidence_id, v_measure_id, v_tenant_id,
      v_user_id, 'Журнал ведется регулярно', 5, NOW()
    );
  END LOOP;

  -- Evidence 3: Политика информационной безопасности
  SELECT id INTO v_evidence_type_id 
  FROM evidence_types 
  WHERE code = 'policy' OR title ILIKE '%политик%'
  LIMIT 1;

  -- Added file_type field for PDF file
  INSERT INTO evidence (
    id, tenant_id, uploaded_by,
    evidence_type_id, file_name, file_url, file_type, file_size,
    title, description, status, uploaded_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_tenant_id, v_user_id,
    v_evidence_type_id, 'Политика ИБ утвержденная.pdf',
    '/evidence/security-policy.pdf', 'application/pdf', 567890,
    'Политика информационной безопасности', 'Утверждена приказом №1 от 01.01.2025',
    'approved', NOW(), NOW(), NOW()
  ) RETURNING id INTO v_evidence_id;

  -- Link to policy measures
  FOR v_measure_id IN 
    SELECT id FROM control_measures 
    WHERE tenant_id = v_tenant_id 
      AND title ILIKE '%шифр%'
    LIMIT 1
  LOOP
    INSERT INTO evidence_links (
      id, evidence_id, control_measure_id, tenant_id,
      created_by, link_reason, relevance_score, created_at
    ) VALUES (
      gen_random_uuid(), v_evidence_id, v_measure_id, v_tenant_id,
      v_user_id, 'Политика утверждена и действует', 5, NOW()
    );
  END LOOP;
END $$;

-- Verification query
SELECT 
  e.file_name,
  et.title AS evidence_type,
  e.status,
  COUNT(el.control_measure_id) AS linked_to_measures,
  array_agg(cm.title) AS measure_names
FROM evidence e
JOIN evidence_types et ON et.id = e.evidence_type_id
LEFT JOIN evidence_links el ON el.evidence_id = e.id
LEFT JOIN control_measures cm ON cm.id = el.control_measure_id
WHERE e.tenant_id = '11111111-1111-1111-1111-111111111111'
GROUP BY e.id, e.file_name, et.title, e.status
ORDER BY e.created_at;
