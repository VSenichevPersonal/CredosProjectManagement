-- Привязываем пользователя ministry@mail.ru к Министерству здравоохранения
UPDATE users
SET organization_id = '00000000-0000-0000-0000-000000000002'
WHERE email = 'ministry@mail.ru';

-- Проверяем результат
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.organization_id,
  o.name as organization_name,
  o.type as organization_type,
  o.level as organization_level
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.email = 'ministry@mail.ru';

-- Показываем подведомственные организации
SELECT 
  id,
  name,
  type,
  level,
  parent_id
FROM organizations
WHERE parent_id = '00000000-0000-0000-0000-000000000002'
  OR id = '00000000-0000-0000-0000-000000000002'
ORDER BY level, name;
