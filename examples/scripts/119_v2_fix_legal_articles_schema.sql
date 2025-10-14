-- Migration 119 v2: Fix legal articles schema to use regulatory_frameworks
-- Problem: legal_articles referenced regulatory_documents instead of regulatory_frameworks
-- Solution: Add regulatory_framework_id and migrate data

-- Step 1: Add new column for regulatory_framework_id
ALTER TABLE legal_articles 
ADD COLUMN IF NOT EXISTS regulatory_framework_id UUID REFERENCES regulatory_frameworks(id) ON DELETE CASCADE;

-- Step 2: Create index for the new column
CREATE INDEX IF NOT EXISTS idx_legal_articles_regulatory_framework 
ON legal_articles(regulatory_framework_id);

-- Step 3: Make regulatory_document_id nullable (for backward compatibility)
ALTER TABLE legal_articles 
ALTER COLUMN regulatory_document_id DROP NOT NULL;

-- Step 4: Add comment explaining the change
COMMENT ON COLUMN legal_articles.regulatory_framework_id IS 'Reference to regulatory framework (law, order, standard)';
COMMENT ON COLUMN legal_articles.regulatory_document_id IS 'Optional reference to uploaded document version';

-- Step 5: Update RLS policies to work with both columns
DROP POLICY IF EXISTS "Users can view legal articles in their tenant" ON legal_articles;
DROP POLICY IF EXISTS "Admins can manage legal articles" ON legal_articles;

CREATE POLICY "Users can view legal articles in their tenant"
  ON legal_articles FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage legal articles"
  ON legal_articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'regulator_admin')
      AND tenant_id = legal_articles.tenant_id
    )
  );

SELECT 'Legal articles schema fixed successfully' as status;
