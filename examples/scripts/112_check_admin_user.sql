SELECT 
  id,
  email,
  name,
  role,
  organization_id,
  is_active
FROM public.users
WHERE email = 'admin@mail.ru';
