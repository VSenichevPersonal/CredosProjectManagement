-- Fix RLS policies for evidence_types table
-- Evidence types are global (shared across tenants), so we need to allow all operations

-- Drop existing policies if any
DROP POLICY IF EXISTS "evidence_types_select_policy" ON evidence_types;
DROP POLICY IF EXISTS "evidence_types_insert_policy" ON evidence_types;
DROP POLICY IF EXISTS "evidence_types_update_policy" ON evidence_types;
DROP POLICY IF EXISTS "evidence_types_delete_policy" ON evidence_types;

-- Enable RLS
ALTER TABLE evidence_types ENABLE ROW LEVEL SECURITY;

-- Allow SELECT for all authenticated users (evidence types are global)
CREATE POLICY "evidence_types_select_policy" ON evidence_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow INSERT for authenticated users (evidence types are global)
CREATE POLICY "evidence_types_insert_policy" ON evidence_types
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow UPDATE for authenticated users (evidence types are global)
CREATE POLICY "evidence_types_update_policy" ON evidence_types
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow DELETE for authenticated users (evidence types are global)
CREATE POLICY "evidence_types_delete_policy" ON evidence_types
  FOR DELETE
  TO authenticated
  USING (true);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'evidence_types';
