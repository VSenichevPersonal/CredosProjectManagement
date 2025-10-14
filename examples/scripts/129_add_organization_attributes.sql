-- Add organization attributes for requirement applicability
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS kii_category INTEGER CHECK (kii_category IN (1, 2, 3)),
ADD COLUMN IF NOT EXISTS pdn_level INTEGER CHECK (pdn_level IN (1, 2, 3, 4)),
ADD COLUMN IF NOT EXISTS is_financial BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_healthcare BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_government BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS employee_count INTEGER,
ADD COLUMN IF NOT EXISTS has_foreign_data BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS attributes_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS attributes_updated_by UUID REFERENCES users(id);

-- Add comments for documentation
COMMENT ON COLUMN organizations.kii_category IS 'Категория КИИ: 1 (высокая), 2 (средняя), 3 (низкая)';
COMMENT ON COLUMN organizations.pdn_level IS 'Уровень защищенности ПДн: 1 (высокий), 2, 3, 4 (низкий)';
COMMENT ON COLUMN organizations.is_financial IS 'Финансовая организация (банк, страховая и т.д.)';
COMMENT ON COLUMN organizations.is_healthcare IS 'Медицинская организация';
COMMENT ON COLUMN organizations.is_government IS 'Государственная организация';
COMMENT ON COLUMN organizations.employee_count IS 'Количество сотрудников';
COMMENT ON COLUMN organizations.has_foreign_data IS 'Обработка данных иностранных граждан';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_organizations_kii_category ON organizations(kii_category) WHERE kii_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_pdn_level ON organizations(pdn_level) WHERE pdn_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_is_financial ON organizations(is_financial) WHERE is_financial = TRUE;
CREATE INDEX IF NOT EXISTS idx_organizations_is_healthcare ON organizations(is_healthcare) WHERE is_healthcare = TRUE;
CREATE INDEX IF NOT EXISTS idx_organizations_is_government ON organizations(is_government) WHERE is_government = TRUE;

SELECT 'Organization attributes added successfully' AS status;
