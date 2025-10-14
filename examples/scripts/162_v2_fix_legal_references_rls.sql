-- Migration: Fix RLS policies for requirement_legal_references table
-- Purpose: Remove incorrect index on non-existent column
-- Author: System Architect
-- Date: 2025-01-10

-- Step 1: Drop the incorrect index that references non-existent column
DROP INDEX IF EXISTS idx_requirement_legal_references_framework_id;

-- Step 2: Verify RLS is enabled
ALTER TABLE requirement_legal_references ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view legal references" ON requirement_legal_references;
DROP POLICY IF EXISTS "Authorized users can create legal references" ON requirement_legal_references;
DROP POLICY IF EXISTS "Authorized users can update legal references" ON requirement_legal_references;
DROP POLICY IF EXISTS "Authorized users can delete legal references" ON requirement_legal_references;

-- Step 4: Create SELECT policy (all authenticated users can view)
CREATE POLICY "Users can view legal references" 
  ON requirement_legal_references 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Step 5: Create INSERT policy (authorized users can create)
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

-- Step 6: Create UPDATE policy (authorized users can update)
CREATE POLICY "Authorized users can update legal references" 
  ON requirement_legal_references 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'regulator_admin', 'ministry_user', 'ib_admin')
    )
  );

-- Step 7: Create DELETE policy (authorized users can delete)
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

-- Step 8: Add correct index for performance
CREATE INDEX IF NOT EXISTS idx_requirement_legal_references_requirement_id 
  ON requirement_legal_references(requirement_id);

CREATE INDEX IF NOT EXISTS idx_requirement_legal_references_legal_article_id 
  ON requirement_legal_references(legal_article_id);

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
