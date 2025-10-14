-- Fix RLS policies for control_measure_templates table
-- Issue: RLS blocks INSERT and UPDATE operations after adding tenant_id column

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "control_measure_templates_select_policy" ON control_measure_templates;
DROP POLICY IF EXISTS "control_measure_templates_insert_policy" ON control_measure_templates;
DROP POLICY IF EXISTS "control_measure_templates_update_policy" ON control_measure_templates;
DROP POLICY IF EXISTS "control_measure_templates_delete_policy" ON control_measure_templates;

-- Enable RLS
ALTER TABLE control_measure_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can see templates from their tenant
CREATE POLICY "control_measure_templates_select_policy"
ON control_measure_templates
FOR SELECT
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- INSERT: Users can create templates for their tenant
CREATE POLICY "control_measure_templates_insert_policy"
ON control_measure_templates
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- UPDATE: Users can update templates from their tenant
CREATE POLICY "control_measure_templates_update_policy"
ON control_measure_templates
FOR UPDATE
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- DELETE: Users can delete templates from their tenant
CREATE POLICY "control_measure_templates_delete_policy"
ON control_measure_templates
FOR DELETE
TO authenticated
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'control_measure_templates'
ORDER BY policyname;
