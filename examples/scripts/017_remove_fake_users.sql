-- Удаление старых пользователей с фейковыми ID
-- Оставляем только пользователей, которые существуют в auth.users

DELETE FROM public.users
WHERE id NOT IN (
  SELECT id FROM auth.users
);

-- Проверка результата
SELECT 
  'Remaining users' as check_name,
  COUNT(*) as count
FROM public.users;

-- Список оставшихся пользователей
SELECT 
  id,
  email,
  name,
  role,
  organization_id
FROM public.users
ORDER BY email;
