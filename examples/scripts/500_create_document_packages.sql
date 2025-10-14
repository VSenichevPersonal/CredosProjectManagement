-- =====================================================
-- Migration: Document Packages and Generation Wizard
-- Date: 2025-10-13
-- Purpose: Tables for document generation wizard (MVP)
-- =====================================================

-- 1. Document Packages (пакеты документов)
CREATE TABLE IF NOT EXISTS document_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  
  -- Классификация
  regulators TEXT[] NOT NULL DEFAULT '{}',
  regulatory_framework_ids UUID[] NOT NULL DEFAULT '{}',
  
  -- Документы в пакете
  document_template_ids UUID[] NOT NULL DEFAULT '{}',
  documents_count INTEGER NOT NULL DEFAULT 0,
  
  -- Анкета (JSONB structure)
  questionnaire JSONB NOT NULL,
  
  -- Метаданные
  estimated_time_minutes INTEGER NOT NULL DEFAULT 30,
  complexity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (complexity IN ('simple', 'medium', 'complex')),
  
  -- Статус
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_document_packages_code ON document_packages(code);
CREATE INDEX IF NOT EXISTS idx_document_packages_is_available ON document_packages(is_available);
CREATE INDEX IF NOT EXISTS idx_document_packages_complexity ON document_packages(complexity);

-- 2. Document Generation Sessions (сессии мастера)
CREATE TABLE IF NOT EXISTS document_generation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Выбранный пакет
  package_id UUID NOT NULL REFERENCES document_packages(id),
  
  -- Ответы на анкету (JSONB)
  answers JSONB NOT NULL DEFAULT '{}',
  
  -- Уточнения (опционально)
  clarification_questions JSONB,
  clarification_answers JSONB DEFAULT '{}',
  
  -- Выбранный провайдер
  provider_type VARCHAR(20) CHECK (provider_type IN ('llm', 'finetuned', 'human')),
  provider_config JSONB,
  
  -- Статус
  status VARCHAR(20) NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'clarifying', 'selecting_provider', 'pending', 'processing', 'completed', 'failed')),
  current_step INTEGER NOT NULL DEFAULT 1,
  
  -- Результаты генерации (JSONB array)
  generated_documents JSONB,
  
  -- OpenAI Assistant интеграция
  openai_thread_id VARCHAR(200),
  openai_run_id VARCHAR(200),
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_doc_gen_sessions_tenant ON document_generation_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_doc_gen_sessions_user ON document_generation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_gen_sessions_org ON document_generation_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_doc_gen_sessions_package ON document_generation_sessions(package_id);
CREATE INDEX IF NOT EXISTS idx_doc_gen_sessions_status ON document_generation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_doc_gen_sessions_created_at ON document_generation_sessions(created_at DESC);

-- 3. Session Documents (связь сессии с созданными документами)
CREATE TABLE IF NOT EXISTS session_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  session_id UUID NOT NULL REFERENCES document_generation_sessions(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  
  -- Metadata
  template_id UUID,
  template_code VARCHAR(100),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(session_id, document_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_docs_session ON session_documents(session_id);
CREATE INDEX IF NOT EXISTS idx_session_docs_document ON session_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_session_docs_tenant ON session_documents(tenant_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_document_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_packages_updated_at
  BEFORE UPDATE ON document_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_document_packages_updated_at();

CREATE OR REPLACE FUNCTION update_document_generation_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_generation_sessions_updated_at
  BEFORE UPDATE ON document_generation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_document_generation_sessions_updated_at();

-- Success message
SELECT 'Document Packages and Generation Sessions tables created successfully' AS status;

