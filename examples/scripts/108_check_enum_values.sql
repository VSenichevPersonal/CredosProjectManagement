SELECT 
  enumlabel as role_value,
  enumsortorder as sort_order
FROM pg_enum
WHERE enumtypid = 'user_role'::regtype
ORDER BY enumsortorder;
