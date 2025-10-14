-- Добавление дат введения и отмены требований
-- effective_date: дата введения требования в действие (например, законом)
-- expiration_date: дата отмены/упразднения требования (null = активно)

-- Добавляем колонки
ALTER TABLE requirements
ADD COLUMN IF NOT EXISTS effective_date DATE,
ADD COLUMN IF NOT EXISTS expiration_date DATE;

-- Комментарии для документации
COMMENT ON COLUMN requirements.effective_date IS 'Дата введения требования в действие';
COMMENT ON COLUMN requirements.expiration_date IS 'Дата отмены/упразднения требования (null = активно)';

-- Создаем индекс для быстрой фильтрации активных требований
CREATE INDEX IF NOT EXISTS idx_requirements_active 
ON requirements(effective_date, expiration_date) 
WHERE expiration_date IS NULL;

-- Создаем функцию для проверки активности требования на определенную дату
CREATE OR REPLACE FUNCTION is_requirement_active(
  p_effective_date DATE,
  p_expiration_date DATE,
  p_check_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    p_effective_date IS NULL OR p_effective_date <= p_check_date
  ) AND (
    p_expiration_date IS NULL OR p_expiration_date > p_check_date
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Проверка: показываем текущие требования с новыми колонками
SELECT 
  id,
  code,
  title,
  effective_date,
  expiration_date,
  CASE 
    WHEN expiration_date IS NULL THEN 'Активно'
    WHEN expiration_date > CURRENT_DATE THEN 'Активно до ' || expiration_date::text
    ELSE 'Отменено с ' || expiration_date::text
  END as status_text
FROM requirements
ORDER BY created_at DESC
LIMIT 5;
