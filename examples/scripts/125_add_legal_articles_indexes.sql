-- Add indexes for legal_articles table to improve query performance
-- This will significantly speed up loading regulatory framework detail pages

-- Index for filtering by regulatory framework
CREATE INDEX IF NOT EXISTS idx_legal_articles_framework 
ON legal_articles(regulatory_framework_id);

-- Index for filtering by tenant
CREATE INDEX IF NOT EXISTS idx_legal_articles_tenant 
ON legal_articles(tenant_id);

-- Composite index for common query pattern (framework + tenant)
CREATE INDEX IF NOT EXISTS idx_legal_articles_framework_tenant 
ON legal_articles(regulatory_framework_id, tenant_id);

-- Index for sorting by article number
CREATE INDEX IF NOT EXISTS idx_legal_articles_article_number 
ON legal_articles(article_number);

-- Index for created_at for audit queries
CREATE INDEX IF NOT EXISTS idx_legal_articles_created_at 
ON legal_articles(created_at DESC);
