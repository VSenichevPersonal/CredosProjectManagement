-- Проверка значений ENUM organization_type
SELECT 
  enumlabel as organization_type_value
FROM pg_enum
WHERE enumtypid = 'organization_type'::regtype
ORDER BY enumsortorder;
