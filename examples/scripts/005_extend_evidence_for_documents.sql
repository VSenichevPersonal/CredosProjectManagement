-- ============================================================================
-- MIGRATION: Extend Evidence Model for Documents with Versioning
-- Adds document-specific fields and creates versioning tables
-- ============================================================================

-- ============================================================================
-- 1. EXTEND EVIDENCE TABLE FOR DOCUMENTS
-- ============================================================================

-- Add document-specific fields to evidence table
ALTER TABLE evidence 
  ADD COLUMN IF NOT EXISTS is_document BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_version_id UUID,
  ADD COLUMN IF NOT EXISTS validity_period_days INTEGER,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS document_status TEXT 
    CHECK (document_status IN ('ok', 'needs_update', 'expired', 'not_relevant'));

-- Add indexes for document fields
CREATE INDEX IF NOT EXISTS idx_evidence_is_document ON evidence(is_document) WHERE is_document = TRUE;
CREATE INDEX IF NOT EXISTS idx_evidence_document_status ON evidence(document_status) WHERE document_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_evidence_expires_at ON evidence(expires_at) WHERE expires_at IS NOT NULL;

-- Comments
COMMENT ON COLUMN evidence.is_document IS 'Indicates if this evidence is a versioned document';
COMMENT ON COLUMN evidence.current_version_id IS 'Reference to the current active version';
COMMENT ON COLUMN evidence.validity_period_days IS 'Number of days until document expires';
COMMENT ON COLUMN evidence.expires_at IS 'Expiration date of the document';
COMMENT ON COLUMN evidence.document_status IS 'Status of document: ok, needs_update, expired, not_relevant';

-- ============================================================================
-- 2. CREATE DOCUMENT_VERSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  
  -- Version info
  version_number TEXT NOT NULL, -- v1.0, v1.1, v2.0
  major_version INTEGER NOT NULL,
  minor_version INTEGER NOT NULL,
  
  -- File info
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- Metadata
  change_summary TEXT, -- Brief description of changes
  change_notes TEXT, -- Detailed notes
  
  -- Tracking
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Status
  is_current BOOLEAN DEFAULT FALSE,
  
  UNIQUE(document_id, version_number),
  UNIQUE(document_id, major_version, minor_version)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_current ON document_versions(document_id, is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON document_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_versions_tenant ON document_versions(tenant_id);

-- Comments
COMMENT ON TABLE document_versions IS 'Version history for documents';
COMMENT ON COLUMN document_versions.version_number IS 'Human-readable version number (e.g., v1.0, v2.1)';
COMMENT ON COLUMN document_versions.major_version IS 'Major version number for sorting';
COMMENT ON COLUMN document_versions.minor_version IS 'Minor version number for sorting';
COMMENT ON COLUMN document_versions.is_current IS 'Indicates if this is the current active version';

-- ============================================================================
-- 3. CREATE DOCUMENT_ANALYSES TABLE (LLM Analysis)
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  from_version_id UUID REFERENCES document_versions(id) ON DELETE SET NULL,
  to_version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  
  -- Analysis results
  summary TEXT NOT NULL, -- Brief summary of changes
  critical_changes JSONB, -- Array of critical changes
  impact_assessment TEXT, -- Impact on compliance
  recommendations JSONB, -- Recommendations for action
  
  -- LLM metadata
  llm_provider TEXT NOT NULL, -- openai, anthropic, grok, local
  llm_model TEXT NOT NULL, -- gpt-4, claude-3, grok-2
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  UNIQUE(from_version_id, to_version_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_document_analyses_document ON document_analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_document_analyses_status ON document_analyses(status);
CREATE INDEX IF NOT EXISTS idx_document_analyses_tenant ON document_analyses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_analyses_created_at ON document_analyses(created_at DESC);

-- Comments
COMMENT ON TABLE document_analyses IS 'LLM-powered analysis of document changes';
COMMENT ON COLUMN document_analyses.summary IS 'AI-generated summary of changes';
COMMENT ON COLUMN document_analyses.critical_changes IS 'JSON array of critical changes identified by AI';
COMMENT ON COLUMN document_analyses.impact_assessment IS 'AI assessment of impact on compliance';
COMMENT ON COLUMN document_analyses.recommendations IS 'JSON array of AI recommendations';

-- ============================================================================
-- 4. CREATE DOCUMENT_DIFFS TABLE (Visual Comparison)
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_diffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  from_version_id UUID REFERENCES document_versions(id) ON DELETE SET NULL,
  to_version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  
  -- Diff data
  diff_type TEXT NOT NULL CHECK (diff_type IN ('text', 'visual', 'semantic')),
  diff_data JSONB NOT NULL, -- Structured changes
  diff_html TEXT, -- HTML for visualization
  
  -- Statistics
  additions_count INTEGER DEFAULT 0,
  deletions_count INTEGER DEFAULT 0,
  modifications_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(from_version_id, to_version_id, diff_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_document_diffs_document ON document_diffs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_diffs_tenant ON document_diffs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_diffs_type ON document_diffs(diff_type);

-- Comments
COMMENT ON TABLE document_diffs IS 'Visual and textual diffs between document versions';
COMMENT ON COLUMN document_diffs.diff_type IS 'Type of diff: text (line-by-line), visual (rendered), semantic (meaning)';
COMMENT ON COLUMN document_diffs.diff_data IS 'Structured diff data in JSON format';
COMMENT ON COLUMN document_diffs.diff_html IS 'Pre-rendered HTML for quick display';

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_diffs ENABLE ROW LEVEL SECURITY;

-- Policies for document_versions
CREATE POLICY "Users can view versions of their tenant documents"
  ON document_versions FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY "Users can create versions for their tenant documents"
  ON document_versions FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY "Users can update versions of their tenant documents"
  ON document_versions FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Policies for document_analyses
CREATE POLICY "Users can view analyses of their tenant documents"
  ON document_analyses FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY "Users can create analyses for their tenant documents"
  ON document_analyses FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY "Users can update analyses of their tenant documents"
  ON document_analyses FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Policies for document_diffs
CREATE POLICY "Users can view diffs of their tenant documents"
  ON document_diffs FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY "Users can create diffs for their tenant documents"
  ON document_diffs FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update document status based on expiration
CREATE OR REPLACE FUNCTION update_document_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If expires_at is set and in the past, mark as expired
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() THEN
    NEW.document_status := 'expired';
  -- If expires_at is within 30 days, mark as needs_update
  ELSIF NEW.expires_at IS NOT NULL AND NEW.expires_at < (NOW() + INTERVAL '30 days') THEN
    NEW.document_status := 'needs_update';
  -- Otherwise, mark as ok
  ELSIF NEW.expires_at IS NOT NULL THEN
    NEW.document_status := 'ok';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update document status on insert/update
CREATE TRIGGER trigger_update_document_status
  BEFORE INSERT OR UPDATE OF expires_at ON evidence
  FOR EACH ROW
  WHEN (NEW.is_document = TRUE)
  EXECUTE FUNCTION update_document_status();

-- Function to ensure only one current version per document
CREATE OR REPLACE FUNCTION ensure_single_current_version()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this version as current, unset all other versions
  IF NEW.is_current = TRUE THEN
    UPDATE document_versions
    SET is_current = FALSE
    WHERE document_id = NEW.document_id
      AND id != NEW.id
      AND is_current = TRUE;
      
    -- Update evidence table to point to this version
    UPDATE evidence
    SET current_version_id = NEW.id
    WHERE id = NEW.document_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure single current version
CREATE TRIGGER trigger_ensure_single_current_version
  AFTER INSERT OR UPDATE OF is_current ON document_versions
  FOR EACH ROW
  WHEN (NEW.is_current = TRUE)
  EXECUTE FUNCTION ensure_single_current_version();

-- ============================================================================
-- FINAL STATUS
-- ============================================================================

SELECT 
  'Evidence model extended for documents' as status,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'evidence' AND column_name IN ('is_document', 'current_version_id', 'validity_period_days', 'expires_at', 'document_status')) as new_evidence_columns,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('document_versions', 'document_analyses', 'document_diffs')) as new_tables,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE '%document%') as new_triggers;
