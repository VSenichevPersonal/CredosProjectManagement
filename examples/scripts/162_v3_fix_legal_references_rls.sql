-- Fix RLS policies for requirement_legal_references table
-- Version 3: Corrected user_role enum values

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view legal references" ON requirement_legal_references;
DROP POLICY IF EXISTS "Authorized users can create legal references" ON requirement_legal_references;
DROP POLICY IF EXISTS "Authorized users can update legal references" ON requirement_legal_references;
DROP POLICY IF EXISTS "Authorized users can delete legal references" ON requirement_legal_references;

-- Enable RLS
ALTER TABLE requirement_legal_references ENABLE ROW LEVEL SECURITY;

-- SELECT policy: All authenticated users can view legal references
CREATE POLICY "Users can view legal references" 
  ON requirement_legal_references 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- INSERT policy: Only authorized roles can create legal references
-- Fixed enum values: using 'ib_manager' instead of 'ib_admin'
CREATE POLICY "Authorized users can create legal references" 
  ON requirement_legal_references 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'regulator_admin', 'ministry_user', 'ib_manager')
    )
  );

-- UPDATE policy: Only authorized roles can update legal references
CREATE POLICY "Authorized users can update legal references" 
  ON requirement_legal_references 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'regulator_admin', 'ministry_user', 'ib_manager')
    )
  );

-- DELETE policy: Only authorized roles can delete legal references
CREATE POLICY "Authorized users can delete legal references" 
  ON requirement_legal_references 
  FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'regulator_admin', 'ministry_user', 'ib_manager')
    )
  );

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'requirement_legal_references'
ORDER BY policyname;
