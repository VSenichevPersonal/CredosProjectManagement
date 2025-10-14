-- Create requirement_legal_references table for many-to-many relationship
-- between requirements and legal articles

CREATE TABLE IF NOT EXISTS requirement_legal_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  legal_article_id UUID NOT NULL REFERENCES legal_articles(id) ON DELETE CASCADE,
  
  -- Indicates if this is the primary legal reference for the requirement
  is_primary BOOLEAN DEFAULT false,
  
  -- Optional note about the relevance of this legal article to the requirement
  relevance_note TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique combination of requirement and legal article per tenant
  UNIQUE(tenant_id, requirement_id, legal_article_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_requirement_legal_refs_requirement 
  ON requirement_legal_references(requirement_id);
  
CREATE INDEX IF NOT EXISTS idx_requirement_legal_refs_article 
  ON requirement_legal_references(legal_article_id);
  
CREATE INDEX IF NOT EXISTS idx_requirement_legal_refs_tenant 
  ON requirement_legal_references(tenant_id);

-- Comments
COMMENT ON TABLE requirement_legal_references IS 
  'Many-to-many relationship between requirements and legal articles. One requirement can reference multiple legal articles, and one legal article can be referenced by multiple requirements.';

COMMENT ON COLUMN requirement_legal_references.is_primary IS 
  'Indicates if this is the primary/main legal reference for the requirement';

COMMENT ON COLUMN requirement_legal_references.relevance_note IS 
  'Optional note explaining how this legal article relates to the requirement';
