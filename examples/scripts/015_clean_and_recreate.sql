-- Очистка поврежденных данных и пересоздание
-- ВНИМАНИЕ: Этот скрипт удалит всех пользователей!

-- 1. Удаление всех пользователей из auth (каскадно удалит identities)
DELETE FROM auth.users;

-- 2. Сброс последовательностей (если есть)
-- (В Supabase auth.users использует UUID, поэтому сброс не нужен)

-- 3. Проверка, что все удалено
SELECT 'Remaining auth.users' as check_name, COUNT(*) as count FROM auth.users;
SELECT 'Remaining auth.identities' as check_name, COUNT(*) as count FROM auth.identities;
SELECT 'Remaining public.users' as check_name, COUNT(*) as count FROM public.users;

-- 4. Опционально: удалить пользователей из public.users
-- DELETE FROM public.users;
