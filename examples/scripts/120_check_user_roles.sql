-- Проверка enum user_role
SELECT 
  enumlabel as role_name
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'user_role'
ORDER BY enumsortorder;
