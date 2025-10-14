-- Назначение пользователей организациям
-- Запускать ПОСЛЕ создания пользователей через Dashboard UI

-- Проверка текущего состояния
SELECT 
  u.email,
  u.name,
  u.role,
  o.name as organization_name
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY u.email;

-- Назначение организаций
UPDATE users 
SET organization_id = (SELECT id FROM organizations WHERE name = 'ФСТЭК России')
WHERE email = 'regulator@mail.ru';

UPDATE users 
SET organization_id = (SELECT id FROM organizations WHERE name = 'Министерство здравоохранения')
WHERE email = 'ministry@mail.ru';

UPDATE users 
SET organization_id = (SELECT id FROM organizations WHERE name = 'Городская больница №1')
WHERE email IN ('institution@mail.ru', 'ciso@mail.ru');

UPDATE users 
SET organization_id = (SELECT id FROM organizations WHERE name = 'Аудиторская компания "Безопасность"')
WHERE email = 'auditor@mail.ru';

-- Проверка результата
SELECT 
  u.email,
  u.name,
  u.role,
  o.name as organization_name,
  o.type as organization_type
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY u.email;

-- Должно быть:
-- admin@mail.ru - NULL (super admin не привязан к организации)
-- regulator@mail.ru - ФСТЭК России (regulator)
-- ministry@mail.ru - Министерство здравоохранения (ministry)
-- institution@mail.ru - Городская больница №1 (institution)
-- ciso@mail.ru - Городская больница №1 (institution)
-- auditor@mail.ru - Аудиторская компания "Безопасность" (auditor)
