-- Создание справочника нормативных баз
CREATE TABLE IF NOT EXISTS regulatory_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(500) NOT NULL,
  short_name VARCHAR(200),
  description TEXT,
  effective_date DATE,
  category VARCHAR(50), -- federal_law, government_decree, agency_order, standard
  authority VARCHAR(200), -- ФСТЭК, ФСБ, Минцифры и т.д.
  url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Добавление колонки regulatory_framework_id в requirements
ALTER TABLE requirements 
ADD COLUMN IF NOT EXISTS regulatory_framework_id UUID REFERENCES regulatory_frameworks(id);

-- Создание индекса для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_requirements_regulatory_framework 
ON requirements(regulatory_framework_id);

-- Триггер для updated_at
CREATE OR REPLACE FUNCTION update_regulatory_frameworks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER regulatory_frameworks_updated_at
BEFORE UPDATE ON regulatory_frameworks
FOR EACH ROW
EXECUTE FUNCTION update_regulatory_frameworks_updated_at();

-- Заполнение базовыми нормативными документами
INSERT INTO regulatory_frameworks (code, name, short_name, category, authority, effective_date) VALUES
  ('152-FZ', 'Федеральный закон от 27.07.2006 № 152-ФЗ "О персональных данных"', '152-ФЗ', 'federal_law', 'Государственная Дума РФ', '2006-07-27'),
  ('187-FZ', 'Федеральный закон от 26.07.2017 № 187-ФЗ "О безопасности критической информационной инфраструктуры Российской Федерации"', '187-ФЗ', 'federal_law', 'Государственная Дума РФ', '2017-07-26'),
  ('FSTEC-239', 'Приказ ФСТЭК России от 25.12.2017 № 239 "Об утверждении Требований по обеспечению безопасности значимых объектов КИИ"', 'Приказ ФСТЭК №239', 'agency_order', 'ФСТЭК России', '2017-12-25'),
  ('FSTEC-21', 'Приказ ФСТЭК России от 18.02.2013 № 21 "Об утверждении Состава и содержания организационных и технических мер по обеспечению безопасности персональных данных"', 'Приказ ФСТЭК №21', 'agency_order', 'ФСТЭК России', '2013-02-18'),
  ('FSB-378', 'Приказ ФСБ России от 10.07.2014 № 378 "Об утверждении Состава и содержания организационных и технических мер по обеспечению безопасности персональных данных"', 'Приказ ФСБ №378', 'agency_order', 'ФСБ России', '2014-07-10'),
  ('GOST-R-57580', 'ГОСТ Р 57580.1-2017 "Безопасность финансовых (банковских) операций. Защита информации финансовых организаций"', 'ГОСТ Р 57580.1-2017', 'standard', 'Росстандарт', '2017-06-01'),
  ('149-FZ', 'Федеральный закон от 27.07.2006 № 149-ФЗ "Об информации, информационных технологиях и о защите информации"', '149-ФЗ', 'federal_law', 'Государственная Дума РФ', '2006-07-27')
ON CONFLICT (code) DO NOTHING;

SELECT 'Regulatory frameworks added successfully' as status;
