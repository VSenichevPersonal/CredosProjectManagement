-- Link auth.user with employees table
-- This allows to identify which employee is the current user

-- Add user_id to employees table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN user_id UUID REFERENCES auth."user"(id) ON DELETE SET NULL;
    CREATE INDEX idx_employees_user_id ON employees(user_id);
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN employees.user_id IS 'Link to auth.user for authentication';

-- Note: Manual linking required - run update employees set user_id = '...' where email = '...'
