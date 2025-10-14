/**
 * @intent: Add evidence type system for different kinds of evidence
 * @architecture: Extends evidence table with type classification
 * @llm-note: Evidence types allow different UI cards and validation rules
 */

-- Create evidence_type ENUM
CREATE TYPE evidence_type AS ENUM (
  'document',      -- Документы (PDF, DOCX, DOC)
  'screenshot',    -- Скриншоты (PNG, JPG, JPEG)
  'log',          -- Логи (TXT, LOG)
  'certificate',  -- Сертификаты (CER, PEM, P12)
  'report',       -- Отчеты (PDF, XLSX, XLS)
  'scan',         -- Сканы документов (PDF, JPG, PNG)
  'video',        -- Видео (MP4, AVI, MOV)
  'audio',        -- Аудио (MP3, WAV)
  'archive',      -- Архивы (ZIP, RAR, 7Z)
  'other'         -- Прочее
);

-- Add evidence_type column to evidence table
ALTER TABLE evidence 
ADD COLUMN evidence_type evidence_type DEFAULT 'other';

-- Add index for filtering by type
CREATE INDEX idx_evidence_type ON evidence(evidence_type);

-- Add metadata JSONB column for type-specific data
ALTER TABLE evidence 
ADD COLUMN type_metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining type_metadata usage
COMMENT ON COLUMN evidence.type_metadata IS 'Type-specific metadata: 
  - document: {pages: number, language: string}
  - certificate: {issuer: string, validUntil: date, serialNumber: string}
  - screenshot: {resolution: string, capturedFrom: string}
  - log: {logLevel: string, source: string, lineCount: number}
  - report: {reportType: string, period: string}';

-- Update existing documents to have correct type
UPDATE evidence 
SET evidence_type = 'document'
WHERE is_document = true;

-- Update existing evidence based on file_type
UPDATE evidence 
SET evidence_type = CASE
  WHEN file_type LIKE 'image/%' THEN 'screenshot'::evidence_type
  WHEN file_type LIKE 'video/%' THEN 'video'::evidence_type
  WHEN file_type LIKE 'audio/%' THEN 'audio'::evidence_type
  WHEN file_type IN ('application/zip', 'application/x-rar', 'application/x-7z-compressed') THEN 'archive'::evidence_type
  WHEN file_type LIKE 'text/%' THEN 'log'::evidence_type
  WHEN file_type IN ('application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') THEN 'document'::evidence_type
  WHEN file_type IN ('application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') THEN 'report'::evidence_type
  ELSE 'other'::evidence_type
END
WHERE evidence_type = 'other';

-- Create helper function to get allowed file types for evidence type
CREATE OR REPLACE FUNCTION get_allowed_file_types(ev_type evidence_type)
RETURNS TEXT[] AS $$
BEGIN
  RETURN CASE ev_type
    WHEN 'document' THEN ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    WHEN 'screenshot' THEN ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    WHEN 'log' THEN ARRAY['text/plain', 'text/log', 'application/json']
    WHEN 'certificate' THEN ARRAY['application/x-x509-ca-cert', 'application/x-pem-file', 'application/pkcs12']
    WHEN 'report' THEN ARRAY['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    WHEN 'scan' THEN ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    WHEN 'video' THEN ARRAY['video/mp4', 'video/avi', 'video/quicktime']
    WHEN 'audio' THEN ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg']
    WHEN 'archive' THEN ARRAY['application/zip', 'application/x-rar', 'application/x-7z-compressed']
    ELSE ARRAY['*/*']
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Return summary
SELECT 
  'Evidence type system created' as status,
  COUNT(*) FILTER (WHERE evidence_type = 'document') as documents,
  COUNT(*) FILTER (WHERE evidence_type = 'screenshot') as screenshots,
  COUNT(*) FILTER (WHERE evidence_type = 'log') as logs,
  COUNT(*) FILTER (WHERE evidence_type = 'certificate') as certificates,
  COUNT(*) FILTER (WHERE evidence_type = 'report') as reports,
  COUNT(*) FILTER (WHERE evidence_type = 'other') as other,
  COUNT(*) as total
FROM evidence;
