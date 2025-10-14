-- Привязка существующих требований к тенанту "Правительство Тульской области"
-- Все требования, которые не привязаны к тенанту, будут привязаны к Тульской области

DO $$
DECLARE
  tula_tenant_id UUID := '11111111-1111-1111-1111-111111111111';
  updated_count INTEGER;
BEGIN
  -- Обновляем все requirements без tenant_id
  UPDATE requirements
  SET tenant_id = tula_tenant_id
  WHERE tenant_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Привязано % требований к тенанту "Правительство Тульской области"', updated_count;
  
  -- Проверяем результат
  RAISE NOTICE 'Всего требований в системе: %', (SELECT COUNT(*) FROM requirements);
  RAISE NOTICE 'Требований привязанных к Тульской области: %', 
    (SELECT COUNT(*) FROM requirements WHERE tenant_id = tula_tenant_id);
  RAISE NOTICE 'Требований привязанных к Тамбовской области: %', 
    (SELECT COUNT(*) FROM requirements WHERE tenant_id = '00000000-0000-0000-0000-000000000001');
END $$;

-- Проверяем распределение требований по тенантам
SELECT 
  t.name as tenant_name,
  COUNT(r.id) as requirements_count
FROM tenants t
LEFT JOIN requirements r ON r.tenant_id = t.id
GROUP BY t.id, t.name
ORDER BY t.name;
