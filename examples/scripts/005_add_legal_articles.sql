-- Migration 005: Add legal articles and requirement legal references
-- Description: Adds normalized structure for legal articles and their references to requirements

-- Create legal_articles table
CREATE TABLE IF NOT EXISTS legal_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regulatory_document_id UUID REFERENCES regulatory_documents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Article structure
  article_number VARCHAR(20),           -- "18.1", "19", "90"
  part VARCHAR(10),                     -- "1", "2", "3"
  paragraph VARCHAR(10),                -- "1", "2", "3"
  clause VARCHAR(10),                   -- "а", "б", "в"
  subclause VARCHAR(10),                -- "1", "2"
  
  -- Full reference text
  full_reference TEXT NOT NULL,         -- "ч. 1 ст. 18.1 Закона №152-ФЗ"
  
  -- Article content
  title TEXT,                           -- Title of the article
  content TEXT,                         -- Full text of the article
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  effective_from DATE,
  effective_to DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create requirement_legal_references table (many-to-many)
CREATE TABLE IF NOT EXISTS requirement_legal_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  legal_article_id UUID NOT NULL REFERENCES legal_articles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Reference metadata
  is_primary BOOLEAN DEFAULT false,     -- Primary reference or supporting
  relevance_note TEXT,                  -- Why this article is relevant
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(requirement_id, legal_article_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_legal_articles_tenant ON legal_articles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_legal_articles_regulatory_doc ON legal_articles(regulatory_document_id);
CREATE INDEX IF NOT EXISTS idx_legal_articles_article_number ON legal_articles(article_number);
CREATE INDEX IF NOT EXISTS idx_legal_articles_active ON legal_articles(is_active);

CREATE INDEX IF NOT EXISTS idx_requirement_legal_refs_requirement ON requirement_legal_references(requirement_id);
CREATE INDEX IF NOT EXISTS idx_requirement_legal_refs_article ON requirement_legal_references(legal_article_id);
CREATE INDEX IF NOT EXISTS idx_requirement_legal_refs_tenant ON requirement_legal_references(tenant_id);
CREATE INDEX IF NOT EXISTS idx_requirement_legal_refs_primary ON requirement_legal_references(is_primary);

-- Enable RLS
ALTER TABLE legal_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_legal_references ENABLE ROW LEVEL SECURITY;

-- RLS Policies for legal_articles
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

-- RLS Policies for requirement_legal_references
CREATE POLICY "Users can view requirement legal references in their tenant"
  ON requirement_legal_references FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage requirement legal references"
  ON requirement_legal_references FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'regulator_admin')
      AND tenant_id = requirement_legal_references.tenant_id
    )
  );

-- Add comment
COMMENT ON TABLE legal_articles IS 'Normalized storage of legal articles from regulatory documents';
COMMENT ON TABLE requirement_legal_references IS 'Many-to-many relationship between requirements and legal articles';
