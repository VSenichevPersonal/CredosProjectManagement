-- Fix compliance_records table schema mismatch
-- The code expects 'comments' but DB has 'notes'
-- Add comments column to match the domain model

ALTER TABLE compliance_records 
ADD COLUMN IF NOT EXISTS comments TEXT;

-- Migrate existing notes to comments if needed
UPDATE compliance_records 
SET comments = notes 
WHERE comments IS NULL AND notes IS NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_compliance_records_comments 
ON compliance_records(comments) 
WHERE comments IS NOT NULL;
