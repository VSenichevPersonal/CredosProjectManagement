-- Проверка данных пользователя ministry@mail.ru и организаций

-- 1. Проверка пользователя ministry@mail.ru
SELECT 
  id,
  email,
  name,
  role,
  organization_id,
  is_active
FROM users
WHERE email = 'ministry@mail.ru';

-- 2. Проверка всех организаций
SELECT 
  id,
  name,
  type,
  parent_id,
  level,
  has_pdn,
  has_kii,
  is_active
FROM organizations
ORDER BY level, name;

-- 3. Проверка иерархии организаций (если есть parent_id)
WITH RECURSIVE org_tree AS (
  -- Корневые организации (без родителя)
  SELECT 
    id,
    name,
    type,
    parent_id,
    level,
    name as path,
    0 as depth
  FROM organizations
  WHERE parent_id IS NULL
  
  UNION ALL
  
  -- Дочерние организации
  SELECT 
    o.id,
    o.name,
    o.type,
    o.parent_id,
    o.level,
    ot.path || ' → ' || o.name as path,
    ot.depth + 1 as depth
  FROM organizations o
  INNER JOIN org_tree ot ON o.parent_id = ot.id
)
SELECT 
  id,
  name,
  type,
  level,
  path,
  depth
FROM org_tree
ORDER BY path;

-- 4. Проверка требований
SELECT 
  COUNT(*) as total_requirements,
  status,
  category
FROM requirements
GROUP BY status, category
ORDER BY status, category;

-- 5. Проверка compliance_records
SELECT 
  COUNT(*) as total_records,
  status,
  organization_id
FROM compliance_records
GROUP BY status, organization_id
ORDER BY organization_id;
