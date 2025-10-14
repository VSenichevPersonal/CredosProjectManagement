-- Проверка распределения требований по тенантам

-- 1. Все тенанты
SELECT 
  id,
  name,
  slug
FROM tenants
ORDER BY name;

-- 2. Количество требований по тенантам
SELECT 
  t.name as tenant_name,
  t.slug,
  COUNT(r.id) as requirements_count
FROM tenants t
LEFT JOIN requirements r ON r.tenant_id = t.id
GROUP BY t.id, t.name, t.slug
ORDER BY t.name;

-- 3. Детальная информация по требованиям
SELECT 
  t.name as tenant_name,
  r.id,
  r.title,
  r.tenant_id
FROM requirements r
JOIN tenants t ON t.id = r.tenant_id
ORDER BY t.name, r.title
LIMIT 100;

-- 4. Проверка NULL tenant_id
SELECT COUNT(*) as requirements_without_tenant
FROM requirements
WHERE tenant_id IS NULL;
