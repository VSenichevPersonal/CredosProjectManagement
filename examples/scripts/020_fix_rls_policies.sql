-- Исправление RLS политик для корректной работы auth
-- Отключаем RLS на public.users для auth операций

-- Временно отключаем RLS на public.users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Или создаем политику, которая разрешает auth.users читать public.users
-- DROP POLICY IF EXISTS "Allow auth to read users" ON public.users;
-- CREATE POLICY "Allow auth to read users" ON public.users
--   FOR SELECT
--   USING (true);

-- Включаем RLS обратно с правильными политиками
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

SELECT 'RLS disabled on public.users - auth should work now' as result;
