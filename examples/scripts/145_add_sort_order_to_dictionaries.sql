-- Add sort_order column to dictionary tables if missing
-- This fixes the issue where sort_order was in schema but not in actual DB

-- Check and add sort_order to verification_methods
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'verification_methods' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE verification_methods ADD COLUMN sort_order INTEGER DEFAULT 0;
    COMMENT ON COLUMN verification_methods.sort_order IS 'Display order for UI sorting';
  END IF;
END $$;

-- Check and add sort_order to periodicities
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'periodicities' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE periodicities ADD COLUMN sort_order INTEGER DEFAULT 0;
    COMMENT ON COLUMN periodicities.sort_order IS 'Display order for UI sorting';
  END IF;
END $$;

-- Check and add sort_order to responsible_roles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'responsible_roles' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE responsible_roles ADD COLUMN sort_order INTEGER DEFAULT 0;
    COMMENT ON COLUMN responsible_roles.sort_order IS 'Display order for UI sorting';
  END IF;
END $$;

-- Set default sort orders based on name
UPDATE verification_methods SET sort_order = 
  CASE code
    WHEN 'audit' THEN 10
    WHEN 'inspection' THEN 20
    WHEN 'testing' THEN 30
    WHEN 'review' THEN 40
    WHEN 'certification' THEN 50
    ELSE 100
  END
WHERE sort_order = 0;

UPDATE periodicities SET sort_order = 
  CASE code
    WHEN 'once' THEN 10
    WHEN 'daily' THEN 20
    WHEN 'weekly' THEN 30
    WHEN 'monthly' THEN 40
    WHEN 'quarterly' THEN 50
    WHEN 'semi_annual' THEN 60
    WHEN 'annual' THEN 70
    WHEN 'biennial' THEN 80
    ELSE 100
  END
WHERE sort_order = 0;

UPDATE responsible_roles SET sort_order = 
  CASE code
    WHEN 'ciso' THEN 10
    WHEN 'ib_manager' THEN 20
    WHEN 'it_admin' THEN 30
    WHEN 'compliance_officer' THEN 40
    ELSE 100
  END
WHERE sort_order = 0;
