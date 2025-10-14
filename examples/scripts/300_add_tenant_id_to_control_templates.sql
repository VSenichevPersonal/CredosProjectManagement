-- Add tenant_id column to control_measure_templates table
-- This makes control measure templates tenant-specific

-- Add tenant_id column (nullable first for existing data)
ALTER TABLE control_measure_templates
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Set tenant_id for existing templates to the first tenant (migration)
UPDATE control_measure_templates
SET tenant_id = (SELECT id FROM tenants LIMIT 1)
WHERE tenant_id IS NULL;

-- Make tenant_id NOT NULL after migration
ALTER TABLE control_measure_templates
ALTER COLUMN tenant_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE control_measure_templates
ADD CONSTRAINT fk_control_measure_templates_tenant
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_control_measure_templates_tenant_id
ON control_measure_templates(tenant_id);

-- Update RLS policies to filter by tenant_id
ALTER TABLE control_measure_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS control_measure_templates_tenant_isolation ON control_measure_templates;

CREATE POLICY control_measure_templates_tenant_isolation ON control_measure_templates
FOR ALL
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
