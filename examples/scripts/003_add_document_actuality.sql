-- Migration: Add document actuality tracking fields
-- Version: 1.1.0
-- Description: Adds fields for tracking document validity, review periods, and actuality status

-- Step 1: Add actuality fields to evidence table (for documents)
ALTER TABLE evidence
ADD COLUMN IF NOT EXISTS validity_period_days INTEGER,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS next_review_date DATE,
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS actuality_status VARCHAR(20) DEFAULT 'ok' CHECK (actuality_status IN ('ok', 'needs_review', 'expired', 'not_relevant'));

-- Step 2: Add actuality fields to regulatory_documents table
ALTER TABLE regulatory_documents
ADD COLUMN IF NOT EXISTS review_period_days INTEGER DEFAULT 365,
ADD COLUMN IF NOT EXISTS actuality_status VARCHAR(20) DEFAULT 'ok' CHECK (actuality_status IN ('ok', 'needs_review', 'expired', 'not_relevant'));

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_actuality_status ON evidence(actuality_status);
CREATE INDEX IF NOT EXISTS idx_evidence_expires_at ON evidence(expires_at);
CREATE INDEX IF NOT EXISTS idx_evidence_next_review_date ON evidence(next_review_date);
CREATE INDEX IF NOT EXISTS idx_regulatory_documents_actuality_status ON regulatory_documents(actuality_status);
CREATE INDEX IF NOT EXISTS idx_regulatory_documents_next_review_date ON regulatory_documents(next_review_date);

-- Step 4: Create function to calculate actuality status
CREATE OR REPLACE FUNCTION calculate_document_actuality_status(
  p_expires_at TIMESTAMP WITH TIME ZONE,
  p_next_review_date DATE
) RETURNS VARCHAR(20) AS $$
DECLARE
  v_days_until_expiry INTEGER;
  v_days_until_review INTEGER;
BEGIN
  -- Check expiration first (highest priority)
  IF p_expires_at IS NOT NULL THEN
    v_days_until_expiry := EXTRACT(DAY FROM (p_expires_at - NOW()));
    
    IF v_days_until_expiry < 0 THEN
      RETURN 'expired';
    ELSIF v_days_until_expiry <= 30 THEN
      RETURN 'needs_review';
    END IF;
  END IF;
  
  -- Check review date
  IF p_next_review_date IS NOT NULL THEN
    v_days_until_review := p_next_review_date - CURRENT_DATE;
    
    IF v_days_until_review < 0 THEN
      RETURN 'needs_review';
    ELSIF v_days_until_review <= 14 THEN
      RETURN 'needs_review';
    END IF;
  END IF;
  
  -- Default to ok if no issues found
  RETURN 'ok';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 5: Create trigger function for evidence table
CREATE OR REPLACE FUNCTION update_evidence_actuality_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if this is a document
  IF NEW.is_document = true THEN
    NEW.actuality_status := calculate_document_actuality_status(
      NEW.expires_at,
      NEW.next_review_date
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for evidence table
DROP TRIGGER IF EXISTS trigger_update_evidence_actuality ON evidence;
CREATE TRIGGER trigger_update_evidence_actuality
  BEFORE INSERT OR UPDATE OF expires_at, next_review_date, is_document
  ON evidence
  FOR EACH ROW
  EXECUTE FUNCTION update_evidence_actuality_status();

-- Step 7: Create trigger function for regulatory_documents table
CREATE OR REPLACE FUNCTION update_regulatory_document_actuality_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actuality_status := calculate_document_actuality_status(
    NULL::TIMESTAMP WITH TIME ZONE, -- regulatory documents don't have expires_at
    NEW.next_review_date
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for regulatory_documents table
DROP TRIGGER IF EXISTS trigger_update_regulatory_document_actuality ON regulatory_documents;
CREATE TRIGGER trigger_update_regulatory_document_actuality
  BEFORE INSERT OR UPDATE OF next_review_date
  ON regulatory_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_regulatory_document_actuality_status();

-- Step 9: Update existing records to calculate initial actuality status
UPDATE evidence
SET actuality_status = calculate_document_actuality_status(expires_at, next_review_date)
WHERE is_document = true AND actuality_status IS NULL;

UPDATE regulatory_documents
SET actuality_status = calculate_document_actuality_status(NULL::TIMESTAMP WITH TIME ZONE, next_review_date)
WHERE actuality_status IS NULL;

-- Step 10: Add comments for documentation
COMMENT ON COLUMN evidence.validity_period_days IS 'Number of days the document is valid for';
COMMENT ON COLUMN evidence.expires_at IS 'Timestamp when the document expires';
COMMENT ON COLUMN evidence.last_reviewed_at IS 'Timestamp of last review';
COMMENT ON COLUMN evidence.last_reviewed_by IS 'User who last reviewed the document';
COMMENT ON COLUMN evidence.next_review_date IS 'Date when document should be reviewed next';
COMMENT ON COLUMN evidence.review_notes IS 'Notes from last review';
COMMENT ON COLUMN evidence.actuality_status IS 'Current actuality status: ok, needs_review, expired, not_relevant';
COMMENT ON FUNCTION calculate_document_actuality_status(TIMESTAMP WITH TIME ZONE, DATE) IS 'Calculates document actuality status based on expiration and review dates';
