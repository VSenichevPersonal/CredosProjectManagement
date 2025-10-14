-- Добавляем колонки для связи со справочниками в таблицу requirements
ALTER TABLE requirements
  ADD COLUMN regulator_id UUID REFERENCES regulators(id),
  ADD COLUMN periodicity_id UUID REFERENCES periodicities(id),
  ADD COLUMN verification_method_id UUID REFERENCES verification_methods(id),
  ADD COLUMN responsible_role_id UUID REFERENCES responsible_roles(id);

-- Создаем индексы для производительности
CREATE INDEX idx_requirements_regulator_id ON requirements(regulator_id);
CREATE INDEX idx_requirements_periodicity_id ON requirements(periodicity_id);
CREATE INDEX idx_requirements_verification_method_id ON requirements(verification_method_id);
CREATE INDEX idx_requirements_responsible_role_id ON requirements(responsible_role_id);

SELECT 'Dictionary fields added to requirements table' AS status;
