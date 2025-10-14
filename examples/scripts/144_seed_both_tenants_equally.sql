-- =====================================================
-- Засев одинаковых данных для обоих тенантов
-- =====================================================
-- Цель: Обеспечить одинаковые наборы данных в Туле и Тамбове
-- с сохранением целостности и правильных связей

-- Получаем ID тенантов
DO $$
DECLARE
  v_tula_tenant_id UUID := '11111111-1111-1111-1111-111111111111';
  v_tambov_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
  v_tula_root_org_id UUID := '11111111-1111-1111-1111-111111111111';
  v_tambov_root_org_id UUID := '00000000-0000-0000-0000-000000000001';
  v_tula_admin_user_id UUID;
  v_tambov_admin_user_id UUID;
BEGIN
  -- =====================================================
  -- 0. ПОИСК СУЩЕСТВУЮЩИХ СУПЕР-АДМИНОВ
  -- =====================================================
  RAISE NOTICE 'Finding existing super admin users...';
  
  -- Ищем существующих супер-админов вместо создания новых
  -- Находим супер-админа для Тулы
  SELECT id INTO v_tula_admin_user_id 
  FROM users 
  WHERE tenant_id = v_tula_tenant_id 
    AND role = 'super_admin'
  LIMIT 1;
  
  -- Если нет супер-админа, берем любого пользователя из тенанта
  IF v_tula_admin_user_id IS NULL THEN
    SELECT id INTO v_tula_admin_user_id 
    FROM users 
    WHERE tenant_id = v_tula_tenant_id
    LIMIT 1;
  END IF;
  
  -- Находим супер-админа для Тамбова
  SELECT id INTO v_tambov_admin_user_id 
  FROM users 
  WHERE tenant_id = v_tambov_tenant_id 
    AND role = 'super_admin'
  LIMIT 1;
  
  -- Если нет супер-админа, берем любого пользователя из тенанта
  IF v_tambov_admin_user_id IS NULL THEN
    SELECT id INTO v_tambov_admin_user_id 
    FROM users 
    WHERE tenant_id = v_tambov_tenant_id
    LIMIT 1;
  END IF;

  RAISE NOTICE 'Starting data seeding for both tenants...';
  RAISE NOTICE 'Tula tenant: %, admin user: %', v_tula_tenant_id, v_tula_admin_user_id;
  RAISE NOTICE 'Tambov tenant: %, admin user: %', v_tambov_tenant_id, v_tambov_admin_user_id;

  -- Проверяем, что нашли пользователей
  IF v_tula_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found for Tula tenant!';
  END IF;
  
  IF v_tambov_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found for Tambov tenant!';
  END IF;

  -- =====================================================
  -- 1. СПРАВОЧНИКИ (Regulators)
  -- =====================================================
  RAISE NOTICE 'Seeding regulators...';
  
  -- Используем INSERT ... ON CONFLICT вместо DELETE
  -- Создаем регуляторов для обоих тенантов (если их еще нет)
  INSERT INTO regulators (id, tenant_id, name, short_name, description, is_active, created_at, updated_at)
  VALUES
    -- Тула
    (gen_random_uuid(), v_tula_tenant_id, 'Федеральная служба по техническому и экспортному контролю', 'ФСТЭК России', 'Регулятор в области защиты информации', true, NOW(), NOW()),
    (gen_random_uuid(), v_tula_tenant_id, 'Федеральная служба безопасности', 'ФСБ России', 'Регулятор в области криптографической защиты информации', true, NOW(), NOW()),
    (gen_random_uuid(), v_tula_tenant_id, 'Роскомнадзор', 'РКН', 'Регулятор в области персональных данных', true, NOW(), NOW()),
    (gen_random_uuid(), v_tula_tenant_id, 'Министерство цифрового развития', 'Минцифры', 'Регулятор в области информационных технологий', true, NOW(), NOW()),
    -- Тамбов (те же самые)
    (gen_random_uuid(), v_tambov_tenant_id, 'Федеральная служба по техническому и экспортному контролю', 'ФСТЭК России', 'Регулятор в области защиты информации', true, NOW(), NOW()),
    (gen_random_uuid(), v_tambov_tenant_id, 'Федеральная служба безопасности', 'ФСБ России', 'Регулятор в области криптографической защиты информации', true, NOW(), NOW()),
    (gen_random_uuid(), v_tambov_tenant_id, 'Роскомнадзор', 'РКН', 'Регулятор в области персональных данных', true, NOW(), NOW()),
    (gen_random_uuid(), v_tambov_tenant_id, 'Министерство цифрового развития', 'Минцифры', 'Регулятор в области информационных технологий', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- =====================================================
  -- 2. СПРАВОЧНИКИ (Categories, Periodicities, etc.)
  -- =====================================================
  RAISE NOTICE 'Seeding dictionaries...';
  
  -- Категории требований - используем ON CONFLICT
  INSERT INTO requirement_categories (id, tenant_id, code, name, description, is_active, created_at, updated_at)
  VALUES
    -- Тула
    (gen_random_uuid(), v_tula_tenant_id, 'TECH', 'Технические меры', 'Технические меры защиты информации', true, NOW(), NOW()),
    (gen_random_uuid(), v_tula_tenant_id, 'ORG', 'Организационные меры', 'Организационные меры защиты информации', true, NOW(), NOW()),
    (gen_random_uuid(), v_tula_tenant_id, 'PDN', 'Персональные данные', 'Требования по защите персональных данных', true, NOW(), NOW()),
    (gen_random_uuid(), v_tula_tenant_id, 'KII', 'Критическая информационная инфраструктура', 'Требования для объектов КИИ', true, NOW(), NOW()),
    -- Тамбов (те же самые)
    (gen_random_uuid(), v_tambov_tenant_id, 'TECH', 'Технические меры', 'Технические меры защиты информации', true, NOW(), NOW()),
    (gen_random_uuid(), v_tambov_tenant_id, 'ORG', 'Организационные меры', 'Организационные меры защиты информации', true, NOW(), NOW()),
    (gen_random_uuid(), v_tambov_tenant_id, 'PDN', 'Персональные данные', 'Требования по защите персональных данных', true, NOW(), NOW()),
    (gen_random_uuid(), v_tambov_tenant_id, 'KII', 'Критическая информационная инфраструктура', 'Требования для объектов КИИ', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Периодичность - используем ON CONFLICT
  INSERT INTO periodicities (id, tenant_id, code, name, description, is_active, created_at, updated_at)
  VALUES
    -- Тула
    (gen_random_uuid(), v_tula_tenant_id, 'ONCE', 'Однократно', 'Выполняется один раз', true, NOW(), NOW()),
    (gen_random_uuid(), v_tula_tenant_id, 'MONTHLY', 'Ежемесячно', 'Выполняется каждый месяц', true, NOW(), NOW()),
    (gen_random_uuid(), v_tula_tenant_id, 'QUARTERLY', 'Ежеквартально', 'Выполняется каждый квартал', true, NOW(), NOW()),
    (gen_random_uuid(), v_tula_tenant_id, 'YEARLY', 'Ежегодно', 'Выполняется каждый год', true, NOW(), NOW()),
    (gen_random_uuid(), v_tula_tenant_id, 'CONTINUOUS', 'Постоянно', 'Выполняется постоянно', true, NOW(), NOW()),
    -- Тамбов (те же самые)
    (gen_random_uuid(), v_tambov_tenant_id, 'ONCE', 'Однократно', 'Выполняется один раз', true, NOW(), NOW()),
    (gen_random_uuid(), v_tambov_tenant_id, 'MONTHLY', 'Ежемесячно', 'Выполняется каждый месяц', true, NOW(), NOW()),
    (gen_random_uuid(), v_tambov_tenant_id, 'QUARTERLY', 'Ежеквартально', 'Выполняется каждый квартал', true, NOW(), NOW()),
    (gen_random_uuid(), v_tambov_tenant_id, 'YEARLY', 'Ежегодно', 'Выполняется каждый год', true, NOW(), NOW()),
    (gen_random_uuid(), v_tambov_tenant_id, 'CONTINUOUS', 'Постоянно', 'Выполняется постоянно', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Методы верификации - используем ON CONFLICT
  INSERT INTO verification_methods (id, tenant_id, code, name, description, is_active, created_at, updated_at)
  VALUES
    -- Тула
    (gen_random_uuid(), v_tula_tenant_id, 'DOC', 'Документальная проверка', 'Проверка документов и записей', true, NOW(), NOW()),
    (gen_random_uuid(), v_tula_tenant_id, 'AUDIT', 'Аудит', 'Проведение аудита', true, NOW(), NOW()),
    (gen_random_uuid(), v_tula_tenant_id, 'TEST', 'Тестирование', 'Проведение тестирования', true, NOW(), NOW()),
    (gen_random_uuid(), v_tula_tenant_id, 'INSPECT', 'Инспекция', 'Проведение инспекции', true, NOW(), NOW()),
    -- Тамбов (те же самые)
    (gen_random_uuid(), v_tambov_tenant_id, 'DOC', 'Документальная проверка', 'Проверка документов и записей', true, NOW(), NOW()),
    (gen_random_uuid(), v_tambov_tenant_id, 'AUDIT', 'Аудит', 'Проведение аудита', true, NOW(), NOW()),
    (gen_random_uuid(), v_tambov_tenant_id, 'TEST', 'Тестирование', 'Проведение тестирования', true, NOW(), NOW()),
    (gen_random_uuid(), v_tambov_tenant_id, 'INSPECT', 'Инспекция', 'Проведение инспекции', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Ответственные роли - используем ON CONFLICT
  INSERT INTO responsible_roles (id, tenant_id, code, name, description, is_active, created_at, updated_at)
  VALUES
    -- Тула
    (gen_random_uuid(), v_tula_tenant_id, 'CISO', 'Руководитель ИБ', 'Руководитель службы информационной безопасности', true, NOW(), NOW()),
    (gen_random_uuid(), v_tula_tenant_id, 'IT_HEAD', 'Руководитель ИТ', 'Руководитель IT-службы', true, NOW(), NOW()),
    (gen_random_uuid(), v_tula_tenant_id, 'COMPLIANCE', 'Специалист по комплаенсу', 'Специалист по соответствию требованиям', true, NOW(), NOW()),
    (gen_random_uuid(), v_tula_tenant_id, 'DPO', 'Ответственный за ПДн', 'Ответственный за обработку персональных данных', true, NOW(), NOW()),
    -- Тамбов (те же самые)
    (gen_random_uuid(), v_tambov_tenant_id, 'CISO', 'Руководитель ИБ', 'Руководитель службы информационной безопасности', true, NOW(), NOW()),
    (gen_random_uuid(), v_tambov_tenant_id, 'IT_HEAD', 'Руководитель ИТ', 'Руководитель IT-службы', true, NOW(), NOW()),
    (gen_random_uuid(), v_tambov_tenant_id, 'COMPLIANCE', 'Специалист по комплаенсу', 'Специалист по соответствию требованиям', true, NOW(), NOW()),
    (gen_random_uuid(), v_tambov_tenant_id, 'DPO', 'Ответственный за ПДн', 'Ответственный за обработку персональных данных', true, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- =====================================================
  -- 3. КОПИРОВАНИЕ ТРЕБОВАНИЙ из Тулы в Тамбов
  -- =====================================================
  RAISE NOTICE 'Copying requirements from Tula to Tambov...';
  
  -- Используем существующего админа Тамбова для created_by
  INSERT INTO requirements (
    id, tenant_id, code, title, description, category,
    regulatory_framework_id, regulator_id, responsible_role_id,
    periodicity_id, verification_method_id, criticality, status,
    effective_date, created_by, created_at, updated_at
  )
  SELECT
    gen_random_uuid(), -- новый ID
    v_tambov_tenant_id, -- Тамбов
    code, title, description, category,
    regulatory_framework_id,
    (SELECT id FROM regulators WHERE tenant_id = v_tambov_tenant_id AND short_name = 'ФСТЭК России' LIMIT 1), -- регулятор Тамбова
    (SELECT id FROM responsible_roles WHERE tenant_id = v_tambov_tenant_id AND code = 'CISO' LIMIT 1), -- роль Тамбова
    (SELECT id FROM periodicities WHERE tenant_id = v_tambov_tenant_id AND code = 'YEARLY' LIMIT 1), -- периодичность Тамбова
    (SELECT id FROM verification_methods WHERE tenant_id = v_tambov_tenant_id AND code = 'AUDIT' LIMIT 1), -- метод Тамбова
    criticality, status, effective_date,
    v_tambov_admin_user_id, NOW(), NOW()
  FROM requirements
  WHERE tenant_id = v_tula_tenant_id;

  -- =====================================================
  -- 4. КОПИРОВАНИЕ КОНТРОЛЕЙ из Тамбова в Тулу
  -- =====================================================
  RAISE NOTICE 'Copying controls from Tambov to Tula...';
  
  -- Добавляем префикс 'TULA-' к кодам контролей для уникальности
  -- Используем существующего админа Тулы для created_by и owner_id
  INSERT INTO controls (
    id, tenant_id, code, title, description, category,
    control_type, frequency, implementation_guide,
    evidence_requirements, status, owner_id, created_by,
    created_at, updated_at
  )
  SELECT
    gen_random_uuid(), -- новый ID
    v_tula_tenant_id, -- Тула
    'TULA-' || code, -- Добавляем префикс для уникальности
    title, description, category,
    control_type, frequency, implementation_guide,
    evidence_requirements, status,
    v_tula_admin_user_id, v_tula_admin_user_id,
    NOW(), NOW()
  FROM controls
  WHERE tenant_id = v_tambov_tenant_id;

  -- =====================================================
  -- 5. СОЗДАНИЕ ПОДОРГАНИЗАЦИЙ для Тамбова (как в Туле)
  -- =====================================================
  RAISE NOTICE 'Creating sub-organizations for Tambov...';
  
  -- Министерство здравоохранения Тамбовской области
  INSERT INTO organizations (id, tenant_id, name, type_id, parent_id, level, is_active, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    v_tambov_tenant_id,
    'Министерство здравоохранения Тамбовской области',
    (SELECT id FROM organization_types WHERE code = 'ministry' LIMIT 1),
    v_tambov_root_org_id,
    2,
    true,
    NOW(),
    NOW()
  );

  -- Городская больница №1 (Тамбов)
  INSERT INTO organizations (id, tenant_id, name, type_id, parent_id, level, has_pdn, has_kii, is_active, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    v_tambov_tenant_id,
    'Городская больница №1',
    (SELECT id FROM organization_types WHERE code = 'hospital' LIMIT 1),
    (SELECT id FROM organizations WHERE tenant_id = v_tambov_tenant_id AND name = 'Министерство здравоохранения Тамбовской области' LIMIT 1),
    3,
    true,
    false,
    true,
    NOW(),
    NOW()
  );

  -- Министерство образования Тамбовской области
  INSERT INTO organizations (id, tenant_id, name, type_id, parent_id, level, is_active, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    v_tambov_tenant_id,
    'Министерство образования Тамбовской области',
    (SELECT id FROM organization_types WHERE code = 'ministry' LIMIT 1),
    v_tambov_root_org_id,
    2,
    true,
    NOW(),
    NOW()
  );

  -- Школа №1 (Тамбов)
  INSERT INTO organizations (id, tenant_id, name, type_id, parent_id, level, has_pdn, is_active, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    v_tambov_tenant_id,
    'Школа №1',
    (SELECT id FROM organization_types WHERE code = 'school' LIMIT 1),
    (SELECT id FROM organizations WHERE tenant_id = v_tambov_tenant_id AND name = 'Министерство образования Тамбовской области' LIMIT 1),
    3,
    true,
    true,
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Data seeding completed successfully!';
END $$;

-- =====================================================
-- ПРОВЕРКА РЕЗУЛЬТАТОВ
-- =====================================================
SELECT 
  t.name as tenant_name,
  (SELECT COUNT(*) FROM requirements WHERE tenant_id = t.id) as requirements_count,
  (SELECT COUNT(*) FROM controls WHERE tenant_id = t.id) as controls_count,
  (SELECT COUNT(*) FROM organizations WHERE tenant_id = t.id) as organizations_count,
  (SELECT COUNT(*) FROM regulators WHERE tenant_id = t.id) as regulators_count,
  (SELECT COUNT(*) FROM requirement_categories WHERE tenant_id = t.id) as categories_count,
  (SELECT COUNT(*) FROM periodicities WHERE tenant_id = t.id) as periodicities_count,
  (SELECT COUNT(*) FROM verification_methods WHERE tenant_id = t.id) as verification_methods_count,
  (SELECT COUNT(*) FROM responsible_roles WHERE tenant_id = t.id) as responsible_roles_count
FROM tenants t
ORDER BY t.name;
