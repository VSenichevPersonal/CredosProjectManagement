-- Добавление дополнительных полей в таблицу organizations
-- Поля для реквизитов, контактов и атрибутов организации

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS inn TEXT,
ADD COLUMN IF NOT EXISTS ogrn TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS employee_count INTEGER,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS contact_person_name TEXT,
ADD COLUMN IF NOT EXISTS contact_person_email TEXT,
ADD COLUMN IF NOT EXISTS contact_person_phone TEXT,
ADD COLUMN IF NOT EXISTS has_pdn BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_kii BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Индексы для поиска по ИНН и ОГРН
CREATE INDEX IF NOT EXISTS idx_organizations_inn ON organizations(inn);
CREATE INDEX IF NOT EXISTS idx_organizations_ogrn ON organizations(ogrn);

-- Комментарии к полям
COMMENT ON COLUMN organizations.inn IS 'ИНН организации';
COMMENT ON COLUMN organizations.ogrn IS 'ОГРН организации';
COMMENT ON COLUMN organizations.industry IS 'Отрасль деятельности';
COMMENT ON COLUMN organizations.employee_count IS 'Количество сотрудников';
COMMENT ON COLUMN organizations.address IS 'Юридический адрес';
COMMENT ON COLUMN organizations.contact_person_name IS 'ФИО контактного лица';
COMMENT ON COLUMN organizations.contact_person_email IS 'Email контактного лица';
COMMENT ON COLUMN organizations.contact_person_phone IS 'Телефон контактного лица';
COMMENT ON COLUMN organizations.has_pdn IS 'Обрабатывает персональные данные';
COMMENT ON COLUMN organizations.has_kii IS 'Имеет объекты критической информационной инфраструктуры';
COMMENT ON COLUMN organizations.description IS 'Описание организации';
