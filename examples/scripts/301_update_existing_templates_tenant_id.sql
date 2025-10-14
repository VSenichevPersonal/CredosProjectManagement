-- Update existing control_measure_templates to have correct tenant_id
-- This fixes the issue where templates created before tenant_id column was added have NULL tenant_id

-- Update all templates with NULL tenant_id to use the default tenant
UPDATE control_measure_templates
SET tenant_id = '11111111-1111-1111-1111-111111111111'
WHERE tenant_id IS NULL;
