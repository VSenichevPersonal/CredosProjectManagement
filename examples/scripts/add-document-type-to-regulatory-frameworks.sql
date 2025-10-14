-- Add document_type_id column to regulatory_frameworks table
ALTER TABLE regulatory_frameworks
ADD COLUMN IF NOT EXISTS document_type_id UUID REFERENCES regulatory_document_types(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_regulatory_frameworks_document_type_id 
ON regulatory_frameworks(document_type_id);

-- Add comment
COMMENT ON COLUMN regulatory_frameworks.document_type_id IS 'Reference to regulatory document type (Законодательные, Внутренние, СМК)';
