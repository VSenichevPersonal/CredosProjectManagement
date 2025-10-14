-- Пересоздание триггера для синхронизации auth.users → public.users
-- Исправляет проблему с ENUM типом user_role

-- Удаляем старый триггер и функцию
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Создаем функцию заново (теперь она увидит ENUM типы)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_name TEXT;
  user_role user_role;
  org_id UUID;
BEGIN
  -- Получаем данные из metadata
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  
  -- Fixed default role value from 'Auditor' to 'auditor' (lowercase)
  -- Получаем роль из metadata, по умолчанию 'auditor'
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'auditor'::user_role
  );
  
  -- Получаем organization_id из metadata (опционально)
  org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;

  -- Создаем запись в public.users
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    organization_id,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_role,
    org_id,
    true,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Создаем триггер заново
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Проверка
SELECT 
  'Триггер успешно пересоздан' as status,
  COUNT(*) as trigger_count
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
