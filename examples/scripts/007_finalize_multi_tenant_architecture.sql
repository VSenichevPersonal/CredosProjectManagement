-- Финализация multi-tenant архитектуры
-- Определяет глобальные и tenant-specific таблицы

-- ============================================
-- ГЛОБАЛЬНЫЕ ТАБЛИЦЫ (без tenant_id)
-- ============================================
-- Эти таблицы содержат справочные данные, единые для всех tenants

-- 1. organization_types - уже без tenant_id (OK)
-- 2. regulatory_frameworks - уже без tenant_id (OK)
-- 3. RBAC tables - уже без tenant_id (OK)
--    - resources
--    - actions
--    - permissions
--    - roles
--    - role_permissions

COMMENT ON TABLE organization_types IS 'GLOBAL: Справочник типов организаций (единый для всех tenants)';
COMMENT ON TABLE regulatory_frameworks IS 'GLOBAL: Справочник нормативных актов РФ (единый для всех tenants)';
COMMENT ON TABLE resources IS 'GLOBAL: RBAC ресурсы (единые для всех tenants)';
COMMENT ON TABLE actions IS 'GLOBAL: RBAC действия (единые для всех tenants)';
COMMENT ON TABLE permissions IS 'GLOBAL: RBAC права (единые для всех tenants)';
COMMENT ON TABLE roles IS 'GLOBAL: RBAC роли (единые для всех tenants)';
COMMENT ON TABLE role_permissions IS 'GLOBAL: Связь ролей и прав (единая для всех tenants)';

-- ============================================
-- TENANT-SPECIFIC ТАБЛИЦЫ (с tenant_id)
-- ============================================
-- Проверка наличия tenant_id во всех необходимых таблицах

DO $$
DECLARE
  v_tables TEXT[] := ARRAY[
    'tenants',
    'users',
    'organizations',
    'requirements',
    'compliance_records',
    'regulatory_documents',
    'audit_log',
    'notifications',
    'evidence',
    'controls',
    'control_mappings',
    'control_tests',
    'control_evidence',
    'organization_controls',
    'organization_attributes',
    'requirement_applicability_rules',
    'requirement_organization_mappings',
    'requirement_categories',
    'periodicities',
    'verification_methods',
    'responsible_roles',
    'regulators',
    'document_versions',
    'document_analyses',
    'document_diffs'
  ];
  v_table TEXT;
  v_has_tenant_id BOOLEAN;
BEGIN
  FOREACH v_table IN ARRAY v_tables
  LOOP
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = v_table 
        AND column_name = 'tenant_id'
    ) INTO v_has_tenant_id;
    
    IF NOT v_has_tenant_id THEN
      RAISE NOTICE 'WARNING: Table % is missing tenant_id column', v_table;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- EXECUTION CONTEXT FUNCTION
-- ============================================
-- Функция для получения tenant_id текущего пользователя

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Получаем tenant_id из таблицы users по auth.uid()
  SELECT tenant_id INTO v_tenant_id
  FROM users
  WHERE id = auth.uid();
  
  RETURN v_tenant_id;
END;
$$;

COMMENT ON FUNCTION get_current_tenant_id() IS 'Возвращает tenant_id текущего аутентифицированного пользователя';

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Функция для проверки доступа к tenant
CREATE OR REPLACE FUNCTION has_tenant_access(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_tenant_id UUID;
  v_user_role TEXT;
BEGIN
  -- Получаем tenant_id и роль пользователя
  SELECT u.tenant_id, r.code INTO v_user_tenant_id, v_user_role
  FROM users u
  LEFT JOIN roles r ON u.role_id = r.id
  WHERE u.id = auth.uid();
  
  -- Super admin имеет доступ ко всем tenants
  IF v_user_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Обычные пользователи имеют доступ только к своему tenant
  RETURN v_user_tenant_id = p_tenant_id;
END;
$$;

COMMENT ON FUNCTION has_tenant_access(UUID) IS 'Проверяет, имеет ли текущий пользователь доступ к указанному tenant';

-- ============================================
-- VALIDATION
-- ============================================

SELECT 
  'Multi-tenant architecture finalized' as status,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name IN (
       'organization_types', 'regulatory_frameworks', 
       'resources', 'actions', 'permissions', 'roles', 'role_permissions'
     )
  ) as global_tables_count,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_schema = 'public' 
     AND column_name = 'tenant_id'
  ) as tenant_specific_tables_count;
