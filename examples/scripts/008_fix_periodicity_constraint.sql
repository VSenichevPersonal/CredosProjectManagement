-- Fix periodicity constraint to include 'continuous' value
-- This migration updates the existing constraint in the database

-- Drop the old constraint
ALTER TABLE requirements DROP CONSTRAINT IF EXISTS requirements_periodicity_check;

-- Add the new constraint with 'continuous' included
ALTER TABLE requirements ADD CONSTRAINT requirements_periodicity_check 
  CHECK (periodicity IN ('once', 'annual', 'quarterly', 'monthly', 'continuous'));

COMMENT ON CONSTRAINT requirements_periodicity_check ON requirements IS 'Updated to include continuous monitoring requirements';
