-- Risk Management Module
-- Manages risks, risk assessments, and mitigation plans

-- Risk categories and levels
CREATE TABLE IF NOT EXISTS risk_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risks table
CREATE TABLE IF NOT EXISTS risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
  category_id UUID REFERENCES risk_categories(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Risk assessment
  likelihood VARCHAR(20) NOT NULL CHECK (likelihood IN ('very_low', 'low', 'medium', 'high', 'very_high')),
  impact VARCHAR(20) NOT NULL CHECK (impact IN ('very_low', 'low', 'medium', 'high', 'very_high')),
  risk_score INTEGER GENERATED ALWAYS AS (
    CASE likelihood
      WHEN 'very_low' THEN 1
      WHEN 'low' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'high' THEN 4
      WHEN 'very_high' THEN 5
    END *
    CASE impact
      WHEN 'very_low' THEN 1
      WHEN 'low' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'high' THEN 4
      WHEN 'very_high' THEN 5
    END
  ) STORED,
  risk_level VARCHAR(20) GENERATED ALWAYS AS (
    CASE 
      WHEN (
        CASE likelihood
          WHEN 'very_low' THEN 1
          WHEN 'low' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'high' THEN 4
          WHEN 'very_high' THEN 5
        END *
        CASE impact
          WHEN 'very_low' THEN 1
          WHEN 'low' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'high' THEN 4
          WHEN 'very_high' THEN 5
        END
      ) <= 4 THEN 'low'
      WHEN (
        CASE likelihood
          WHEN 'very_low' THEN 1
          WHEN 'low' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'high' THEN 4
          WHEN 'very_high' THEN 5
        END *
        CASE impact
          WHEN 'very_low' THEN 1
          WHEN 'low' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'high' THEN 4
          WHEN 'very_high' THEN 5
        END
      ) <= 9 THEN 'medium'
      WHEN (
        CASE likelihood
          WHEN 'very_low' THEN 1
          WHEN 'low' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'high' THEN 4
          WHEN 'very_high' THEN 5
        END *
        CASE impact
          WHEN 'very_low' THEN 1
          WHEN 'low' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'high' THEN 4
          WHEN 'very_high' THEN 5
        END
      ) <= 16 THEN 'high'
      ELSE 'critical'
    END
  ) STORED,
  
  -- Status and ownership
  status VARCHAR(20) NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'assessed', 'mitigating', 'accepted', 'closed')),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Dates
  identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
  review_date DATE,
  closed_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mitigation plans
CREATE TABLE IF NOT EXISTS risk_mitigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  strategy VARCHAR(20) NOT NULL CHECK (strategy IN ('avoid', 'mitigate', 'transfer', 'accept')),
  
  -- Implementation
  status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  responsible_id UUID REFERENCES users(id) ON DELETE SET NULL,
  start_date DATE,
  target_date DATE,
  completion_date DATE,
  
  -- Effectiveness
  residual_likelihood VARCHAR(20) CHECK (residual_likelihood IN ('very_low', 'low', 'medium', 'high', 'very_high')),
  residual_impact VARCHAR(20) CHECK (residual_impact IN ('very_low', 'low', 'medium', 'high', 'very_high')),
  
  cost_estimate DECIMAL(15, 2),
  actual_cost DECIMAL(15, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk assessments history
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  assessed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  likelihood VARCHAR(20) NOT NULL,
  impact VARCHAR(20) NOT NULL,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_risks_organization ON risks(organization_id);
CREATE INDEX IF NOT EXISTS idx_risks_requirement ON risks(requirement_id);
CREATE INDEX IF NOT EXISTS idx_risks_category ON risks(category_id);
CREATE INDEX IF NOT EXISTS idx_risks_status ON risks(status);
CREATE INDEX IF NOT EXISTS idx_risks_level ON risks(risk_level);
CREATE INDEX IF NOT EXISTS idx_risks_owner ON risks(owner_id);

CREATE INDEX IF NOT EXISTS idx_mitigations_risk ON risk_mitigations(risk_id);
CREATE INDEX IF NOT EXISTS idx_mitigations_status ON risk_mitigations(status);
CREATE INDEX IF NOT EXISTS idx_mitigations_responsible ON risk_mitigations(responsible_id);

CREATE INDEX IF NOT EXISTS idx_assessments_risk ON risk_assessments(risk_id);
CREATE INDEX IF NOT EXISTS idx_assessments_date ON risk_assessments(assessment_date);

-- Seed risk categories
INSERT INTO risk_categories (name, description, color) VALUES
  ('Технический', 'Технические риски ИБ (уязвимости, инциденты)', '#ef4444'),
  ('Комплаенс', 'Риски несоответствия требованиям регуляторов', '#f59e0b'),
  ('Организационный', 'Организационные и процессные риски', '#3b82f6'),
  ('Финансовый', 'Финансовые риски (штрафы, затраты)', '#8b5cf6'),
  ('Репутационный', 'Риски для репутации организации', '#ec4899')
ON CONFLICT DO NOTHING;
