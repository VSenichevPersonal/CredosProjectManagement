-- Add document_status column to regulatory_documents
ALTER TABLE regulatory_documents
ADD COLUMN IF NOT EXISTS document_status TEXT NOT NULL DEFAULT 'need_document'
CHECK (document_status IN ('need_document', 'ok', 'needs_update', 'not_relevant'));

-- Add review tracking fields
ALTER TABLE regulatory_documents
ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS next_review_date DATE,
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_regulatory_documents_status ON regulatory_documents(document_status);
CREATE INDEX IF NOT EXISTS idx_regulatory_documents_next_review ON regulatory_documents(next_review_date);

-- Update existing documents to have appropriate status
UPDATE regulatory_documents
SET document_status = 'ok'
WHERE is_active = true;

-- Add document_status to requirements table as well
ALTER TABLE requirements
ADD COLUMN IF NOT EXISTS document_status TEXT NOT NULL DEFAULT 'need_document'
CHECK (document_status IN ('need_document', 'ok', 'needs_update', 'not_relevant'));

CREATE INDEX IF NOT EXISTS idx_requirements_document_status ON requirements(document_status);

SELECT 'Document status system created successfully' AS status;
