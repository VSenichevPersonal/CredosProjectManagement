-- Migration: Add RLS policies for requirement_legal_references table
-- Purpose: Fix issue where users cannot add legal references
-- Author: System Architect
-- Date: 2025-01-10

-- Step 1: Enable RLS on requirement_legal_references table
ALTER TABLE requirement_legal_references ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if any (for idempotency)
DROP POLICY IF EXISTS "Users can view legal references" ON requirement_legal_references;
DROP POLICY IF EXISTS "Authorized users can create legal references" ON requirement_legal_references;
DROP POLICY IF EXISTS "Authorized users can delete legal references" ON requirement_legal_references;

-- Step 3: Create SELECT policy (all authenticated users can view)
CREATE POLICY "Users can view legal references" 
  ON requirement_legal_references 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Step 4: Create INSERT policy (authorized users can create)
CREATE POLICY "Authorized users can create legal references" 
  ON requirement_legal_references 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'regulator_admin', 'ministry_user', 'ib_admin')
    )
  );

-- Step 5: Create DELETE policy (authorized users can delete)
CREATE POLICY "Authorized users can delete legal references" 
  ON requirement_legal_references 
  FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'regulator_admin', 'ministry_user', 'ib_admin')
    )
  );

-- Step 6: Add index for performance
CREATE INDEX IF NOT EXISTS idx_requirement_legal_references_requirement_id 
  ON requirement_legal_references(requirement_id);

CREATE INDEX IF NOT EXISTS idx_requirement_legal_references_framework_id 
  ON requirement_legal_references(regulatory_framework_id);

-- Verification query
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'requirement_legal_references'
ORDER BY policyname;
