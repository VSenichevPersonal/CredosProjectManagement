-- Create evidence table for Evidence Library
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Relations
  compliance_record_id UUID REFERENCES compliance_records(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
  
  -- File information
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT, -- Path in Supabase Storage
  
  -- Metadata
  title TEXT,
  description TEXT,
  tags TEXT[], -- Array of tags for categorization
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  review_notes TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  
  -- Upload tracking
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT evidence_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_tenant_id ON evidence(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evidence_compliance_record_id ON evidence(compliance_record_id);
CREATE INDEX IF NOT EXISTS idx_evidence_requirement_id ON evidence(requirement_id);
CREATE INDEX IF NOT EXISTS idx_evidence_uploaded_by ON evidence(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence(status);
CREATE INDEX IF NOT EXISTS idx_evidence_created_at ON evidence(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_evidence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evidence_updated_at
  BEFORE UPDATE ON evidence
  FOR EACH ROW
  EXECUTE FUNCTION update_evidence_updated_at();

-- Insert sample evidence for testing
INSERT INTO evidence (
  tenant_id,
  compliance_record_id,
  file_name,
  file_url,
  file_type,
  file_size,
  title,
  description,
  status,
  uploaded_by
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::UUID,
  cr.id,
  'security-policy-v1.pdf',
  '/evidence/security-policy-v1.pdf',
  'application/pdf',
  1024000,
  'Security Policy Document',
  'Company security policy version 1.0',
  'approved',
  u.id
FROM compliance_records cr
CROSS JOIN users u
WHERE u.email = 'admin@mail.ru'
LIMIT 1;

SELECT 'Evidence table created successfully' AS status;
