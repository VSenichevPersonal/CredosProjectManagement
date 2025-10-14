-- Очистка таблицы public.users перед созданием новых пользователей
-- Этот скрипт удаляет всех пользователей из public.users

BEGIN;

-- Удаляем все записи из public.users
DELETE FROM public.users;

-- Сбрасываем счетчики и зависимости
SELECT 'Deleted ' || COUNT(*) || ' users from public.users' as result
FROM public.users;

COMMIT;

-- Проверка результата
SELECT 
  'public.users' as table_name,
  COUNT(*) as remaining_count
FROM public.users;
