-- Seed data for new tenants
-- Copies control measure templates from the first tenant to other tenants

-- Function to copy control measure templates to a specific tenant
CREATE OR REPLACE FUNCTION seed_tenant_control_templates(target_tenant_id UUID)
RETURNS TABLE(templates_copied INTEGER) AS $$
DECLARE
  source_tenant_id UUID;
  copied_count INTEGER := 0;
BEGIN
  -- Get the first tenant (Tula) as the source
  SELECT id INTO source_tenant_id
  FROM tenants
  WHERE name LIKE '%Тульской%'
  LIMIT 1;

  IF source_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Source tenant not found';
  END IF;

  -- Copy templates from source tenant to target tenant
  INSERT INTO control_measure_templates (
    id,
    code,
    title,
    description,
    implementation_guide,
    estimated_effort,
    sort_order,
    is_active,
    recommended_evidence_type_ids,
    tenant_id,
    created_by,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    code,
    title,
    description,
    implementation_guide,
    estimated_effort,
    sort_order,
    is_active,
    recommended_evidence_type_ids,
    target_tenant_id,
    created_by,
    NOW(),
    NOW()
  FROM control_measure_templates
  WHERE tenant_id = source_tenant_id
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS copied_count = ROW_COUNT;

  RETURN QUERY SELECT copied_count;
END;
$$ LANGUAGE plpgsql;

-- Seed data for Ryazan tenant
DO $$
DECLARE
  ryazan_tenant_id UUID;
  templates_count INTEGER;
BEGIN
  -- Get Ryazan tenant ID
  SELECT id INTO ryazan_tenant_id
  FROM tenants
  WHERE name LIKE '%Рязанской%'
  LIMIT 1;

  IF ryazan_tenant_id IS NOT NULL THEN
    -- Copy templates
    SELECT * INTO templates_count FROM seed_tenant_control_templates(ryazan_tenant_id);
    
    RAISE NOTICE 'Copied % control measure templates to Ryazan tenant', templates_count;
  ELSE
    RAISE NOTICE 'Ryazan tenant not found';
  END IF;
END $$;

-- Seed data for Tambov tenant
DO $$
DECLARE
  tambov_tenant_id UUID;
  templates_count INTEGER;
BEGIN
  -- Get Tambov tenant ID
  SELECT id INTO tambov_tenant_id
  FROM tenants
  WHERE name LIKE '%Тамбовской%'
  LIMIT 1;

  IF tambov_tenant_id IS NOT NULL THEN
    -- Copy templates
    SELECT * INTO templates_count FROM seed_tenant_control_templates(tambov_tenant_id);
    
    RAISE NOTICE 'Copied % control measure templates to Tambov tenant', templates_count;
  ELSE
    RAISE NOTICE 'Tambov tenant not found';
  END IF;
END $$;

-- Show distribution of templates by tenant
SELECT 
  t.name AS tenant_name,
  t.id AS tenant_id,
  COUNT(cmt.id) AS template_count
FROM tenants t
LEFT JOIN control_measure_templates cmt ON cmt.tenant_id = t.id
GROUP BY t.id, t.name
ORDER BY t.name;
