-- Создание функции для получения всех подведомственных организаций
-- Эта функция рекурсивно находит все дочерние организации для заданной организации

-- Функция для получения всех подведомственных организаций (включая саму организацию)
CREATE OR REPLACE FUNCTION get_subordinate_organizations(org_id UUID)
RETURNS TABLE (id UUID) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE subordinates AS (
    -- Базовый случай: сама организация
    SELECT o.id
    FROM organizations o
    WHERE o.id = org_id
    
    UNION ALL
    
    -- Рекурсивный случай: все дочерние организации
    SELECT o.id
    FROM organizations o
    INNER JOIN subordinates s ON o.parent_id = s.id
  )
  SELECT subordinates.id FROM subordinates;
END;
$$ LANGUAGE plpgsql STABLE;

-- Removed test query that could fail if organization doesn't exist

COMMENT ON FUNCTION get_subordinate_organizations IS 
'Recursively get all subordinate organizations including the organization itself';
