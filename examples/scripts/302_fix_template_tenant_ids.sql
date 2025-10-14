-- Fix tenant_id for all control_measure_templates that have NULL or wrong tenant_id
-- This script updates all templates to have the correct tenant_id

DO $$
DECLARE
  default_tenant_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- Update all templates with NULL tenant_id to the default tenant
  UPDATE control_measure_templates
  SET tenant_id = default_tenant_id
  WHERE tenant_id IS NULL;

  RAISE NOTICE 'Updated % templates with NULL tenant_id', (SELECT COUNT(*) FROM control_measure_templates WHERE tenant_id = default_tenant_id);
END $$;

-- Verify the update
SELECT 
  tenant_id,
  COUNT(*) as template_count
FROM control_measure_templates
GROUP BY tenant_id
ORDER BY template_count DESC;
