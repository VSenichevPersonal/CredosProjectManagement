-- IB Compliance Platform - Database Schema
-- Version: 1.0.0
-- Description: Initial schema with organizations, users, requirements, compliance, evidence, audit_log, notifications

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (иерархическая структура)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  inn VARCHAR(12),
  ogrn VARCHAR(15),
  type VARCHAR(50) NOT NULL CHECK (type IN ('ministry', 'institution', 'branch', 'department')),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 4),
  parent_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  industry VARCHAR(100),
  employee_count INTEGER,
  has_pdn BOOLEAN DEFAULT false,
  has_kii BOOLEAN DEFAULT false,
  contact_person_name VARCHAR(255),
  contact_person_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_organizations_parent ON organizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_organizations_level ON organizations(level);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'regulator_admin', 'ministry_user', 'institution_user', 'ciso', 'auditor')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  password_hash VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Requirements
CREATE TABLE IF NOT EXISTS requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  regulator VARCHAR(50) NOT NULL CHECK (regulator IN ('ФСТЭК', 'Роскомнадзор', 'ФСБ', 'Минцифры', 'ЦБ РФ')),
  normative_base TEXT[] NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('КИИ', 'ПДн', 'ГИС', 'ИБ', 'Лицензирование', 'Криптография', 'Общее')),
  criticality VARCHAR(20) NOT NULL CHECK (criticality IN ('critical', 'high', 'medium', 'low')),
  deadline TIMESTAMP,
  periodicity VARCHAR(20) NOT NULL CHECK (periodicity IN ('once', 'annual', 'quarterly', 'monthly', 'continuous')),
  verification_method VARCHAR(50) NOT NULL,
  responsible_role VARCHAR(100),
  penalties TEXT,
  template_urls TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requirements_category ON requirements(category);
CREATE INDEX IF NOT EXISTS idx_requirements_regulator ON requirements(regulator);
CREATE INDEX IF NOT EXISTS idx_requirements_deadline ON requirements(deadline);
CREATE INDEX IF NOT EXISTS idx_requirements_criticality ON requirements(criticality);

-- Compliance (статус выполнения требований)
CREATE TABLE IF NOT EXISTS compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('not_started', 'in_progress', 'pending_review', 'approved', 'rejected', 'completed', 'overdue', 'not_applicable')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  responsible_user_id UUID REFERENCES users(id),
  planned_completion_date TIMESTAMP,
  actual_completion_date TIMESTAMP,
  comments TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(requirement_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_compliance_requirement ON compliance(requirement_id);
CREATE INDEX IF NOT EXISTS idx_compliance_organization ON compliance(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance(status);
CREATE INDEX IF NOT EXISTS idx_compliance_responsible ON compliance(responsible_user_id);

-- Evidence (подтверждающие документы)
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_id UUID REFERENCES compliance(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_compliance ON evidence(compliance_id);
CREATE INDEX IF NOT EXISTS idx_evidence_uploaded_by ON evidence(uploaded_by);

-- Audit Log (неизменяемый журнал)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  resource_type VARCHAR(50),
  resource_id UUID,
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  metadata JSONB,
  request_id VARCHAR(100),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_organization ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('deadline_reminder', 'new_requirement', 'status_change', 'assignment', 'comment')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_resource_type VARCHAR(50),
  related_resource_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organization and children"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
      UNION
      SELECT id FROM organizations WHERE parent_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for users
CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- RLS Policies for requirements (all authenticated users can view)
CREATE POLICY "Authenticated users can view requirements"
  ON requirements FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage requirements"
  ON requirements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'regulator_admin')
    )
  );

-- RLS Policies for compliance
CREATE POLICY "Users can view compliance for their organization"
  ON compliance FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update compliance for their organization"
  ON compliance FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for evidence
CREATE POLICY "Users can view evidence for their organization"
  ON evidence FOR SELECT
  USING (
    compliance_id IN (
      SELECT id FROM compliance WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for audit_log (read-only for admins)
CREATE POLICY "Admins can view audit logs"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'auditor')
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());
