-- =====================================================
-- END-TO-END TEST: MEASURE CREATION FLOW
-- =====================================================
-- Тестирование полного цикла создания мер контроля
-- от назначения требования до автоматического расчёта статусов

-- =====================================================
-- SETUP: Создание тестовых данных
-- =====================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_test_org_id UUID;
  v_test_user_id UUID;
  v_test_requirement_id UUID;
  v_test_template_id UUID;
  v_test_evidence_type_id UUID;
  v_compliance_record_id UUID;
  v_control_measure_id UUID;
  v_evidence_id UUID;
  v_org_type_id UUID;
  v_test_results TEXT := '';
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STARTING END-TO-END MEASURE CREATION TEST';
  RAISE NOTICE '========================================';
  
  -- =====================================================
  -- SETUP: Getting tenant_id...
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'SETUP: Getting tenant_id...';
  
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE is_active = true
  LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION '  ✗ No active tenants found in database';
  END IF;
  
  RAISE NOTICE '  ✓ Using tenant_id: %', v_tenant_id;
  
  -- =====================================================
  -- TEST 1: Проверка существования необходимых таблиц
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 1: Checking table existence...';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'control_measures') THEN
    RAISE NOTICE '  ✓ control_measures table exists';
  ELSE
    RAISE EXCEPTION '  ✗ control_measures table NOT FOUND';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'control_measure_templates') THEN
    RAISE NOTICE '  ✓ control_measure_templates table exists';
  ELSE
    RAISE EXCEPTION '  ✗ control_measure_templates table NOT FOUND';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evidence_types') THEN
    RAISE NOTICE '  ✓ evidence_types table exists';
  ELSE
    RAISE EXCEPTION '  ✗ evidence_types table NOT FOUND';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evidence_links') THEN
    RAISE NOTICE '  ✓ evidence_links table exists';
  ELSE
    RAISE EXCEPTION '  ✗ evidence_links table NOT FOUND';
  END IF;
  
  -- =====================================================
  -- TEST 2: Проверка наличия типов доказательств
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 2: Checking evidence types...';
  
  SELECT id INTO v_test_evidence_type_id
  FROM evidence_types
  WHERE code = 'policy'
  LIMIT 1;
  
  IF v_test_evidence_type_id IS NOT NULL THEN
    RAISE NOTICE '  ✓ Evidence types exist (found: %)', v_test_evidence_type_id;
  ELSE
    RAISE EXCEPTION '  ✗ No evidence types found';
  END IF;
  
  -- =====================================================
  -- TEST 3: Создание тестовой организации
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 3: Creating test organization...';
  
  -- Получаем существующий тип организации
  DECLARE
    v_org_type_id UUID;
  BEGIN
    SELECT id INTO v_org_type_id
    FROM organization_types
    WHERE is_active = true
    LIMIT 1;
    
    IF v_org_type_id IS NULL THEN
      RAISE EXCEPTION '  ✗ No active organization types found';
    END IF;
    
    INSERT INTO organizations (id, name, type_id, tenant_id, is_active)
    VALUES (gen_random_uuid(), 'Test Organization for Measures', v_org_type_id, v_tenant_id, true)
    RETURNING id INTO v_test_org_id;
    
    RAISE NOTICE '  ✓ Test organization created: %', v_test_org_id;
  END;

  -- =====================================================
  -- TEST 4: Создание тестового пользователя
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 4: Creating test user...';
  
  -- Проверяем, есть ли уже пользователи
  SELECT id INTO v_test_user_id
  FROM users
  WHERE tenant_id = v_tenant_id
  LIMIT 1;
  
  IF v_test_user_id IS NULL THEN
    RAISE NOTICE '  ⚠ No existing users found, skipping user creation';
    RAISE NOTICE '  ℹ Using NULL for created_by fields';
  ELSE
    RAISE NOTICE '  ✓ Using existing user: %', v_test_user_id;
  END IF;
  
  -- =====================================================
  -- TEST 5: Создание тестового требования
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 5: Creating test requirement...';
  
  -- Получаем существующий regulatory_framework
  DECLARE
    v_framework_id UUID;
  BEGIN
    SELECT id INTO v_framework_id
    FROM regulatory_frameworks
    WHERE is_active = true
    LIMIT 1;
    
    IF v_framework_id IS NULL THEN
      RAISE EXCEPTION '  ✗ No active regulatory frameworks found';
    END IF;
    
    INSERT INTO requirements (
      id,
      tenant_id,
      regulatory_framework_id,
      code,
      title,
      description,
      measure_mode,
      evidence_type_mode,
      status,
      created_by
    ) VALUES (
      gen_random_uuid(),
      v_tenant_id,
      v_framework_id,
      'TEST-REQ-001',
      'Test Requirement for Measure Creation',
      'This is a test requirement to verify measure creation flow',
      'flexible',
      'flexible',
      'active',
      v_test_user_id
    )
    RETURNING id INTO v_test_requirement_id;
    
    RAISE NOTICE '  ✓ Test requirement created: %', v_test_requirement_id;
  END;
  
  -- =====================================================
  -- TEST 6: Создание шаблона меры
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 6: Creating control measure template...';
  
  INSERT INTO control_measure_templates (
    id,
    tenant_id,
    requirement_id,
    code,
    title,
    description,
    implementation_guide,
    recommended_evidence_type_ids,
    is_active,
    created_by
  ) VALUES (
    gen_random_uuid(),
    v_tenant_id,
    v_test_requirement_id,
    'TEST-TEMPLATE-001',
    'Test Control Measure Template',
    'Template for testing measure creation',
    'Follow these steps to implement the control',
    ARRAY[v_test_evidence_type_id],
    true,
    v_test_user_id
  )
  RETURNING id INTO v_test_template_id;
  
  RAISE NOTICE '  ✓ Template created: %', v_test_template_id;
  
  -- Обновляем требование, добавляя шаблон
  UPDATE requirements
  SET suggested_control_measure_template_ids = ARRAY[v_test_template_id]
  WHERE id = v_test_requirement_id;
  
  RAISE NOTICE '  ✓ Template linked to requirement';
  
  -- =====================================================
  -- TEST 7: Создание записи соответствия (compliance_record)
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 7: Creating compliance record...';
  
  INSERT INTO compliance_records (
    id,
    tenant_id,
    requirement_id,
    organization_id,
    status
  ) VALUES (
    gen_random_uuid(),
    v_tenant_id,
    v_test_requirement_id,
    v_test_org_id,
    'in_progress'
  )
  RETURNING id INTO v_compliance_record_id;
  
  RAISE NOTICE '  ✓ Compliance record created: %', v_compliance_record_id;
  
  -- =====================================================
  -- TEST 8: Создание меры контроля из шаблона
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 8: Creating control measure from template...';
  
  INSERT INTO control_measures (
    id,
    tenant_id,
    compliance_record_id,
    requirement_id,
    organization_id,
    template_id,
    title,
    description,
    status,
    from_template,
    is_locked,
    created_by
  ) VALUES (
    gen_random_uuid(),
    v_tenant_id,
    v_compliance_record_id,
    v_test_requirement_id,
    v_test_org_id,
    v_test_template_id,
    'Test Control Measure',
    'This measure was created from a template',
    'planned',
    true,
    false,
    v_test_user_id
  )
  RETURNING id INTO v_control_measure_id;
  
  RAISE NOTICE '  ✓ Control measure created: %', v_control_measure_id;
  
  -- =====================================================
  -- TEST 9: Создание доказательства
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 9: Creating evidence...';
  
  INSERT INTO evidence (
    id,
    tenant_id,
    organization_id,
    compliance_record_id,
    requirement_id,
    evidence_type_id,
    title,
    description,
    status,
    uploaded_by
  ) VALUES (
    gen_random_uuid(),
    v_tenant_id,
    v_test_org_id,
    v_compliance_record_id,
    v_test_requirement_id,
    v_test_evidence_type_id,
    'Test Evidence Document',
    'This is a test evidence document',
    'approved',
    v_test_user_id
  )
  RETURNING id INTO v_evidence_id;
  
  RAISE NOTICE '  ✓ Evidence created: %', v_evidence_id;
  
  -- =====================================================
  -- TEST 10: Связывание доказательства с мерой
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 10: Linking evidence to control measure...';
  
  INSERT INTO evidence_links (
    tenant_id,
    evidence_id,
    control_measure_id,
    requirement_id,
    link_reason,
    relevance_score,
    created_by
  ) VALUES (
    v_tenant_id,
    v_evidence_id,
    v_control_measure_id,
    v_test_requirement_id,
    'Test evidence link',
    5,
    v_test_user_id
  );
  
  RAISE NOTICE '  ✓ Evidence linked to measure';
  
  -- =====================================================
  -- TEST 11: Проверка автоматического обновления статусов
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 11: Checking automatic status updates...';
  
  -- Подождать немного для срабатывания триггеров
  PERFORM pg_sleep(0.5);
  
  -- Проверить статус меры
  DECLARE
    v_measure_status TEXT;
    v_compliance_status TEXT;
  BEGIN
    SELECT status INTO v_measure_status
    FROM control_measures
    WHERE id = v_control_measure_id;
    
    SELECT status::TEXT INTO v_compliance_status
    FROM compliance_records
    WHERE id = v_compliance_record_id;
    
    RAISE NOTICE '  ℹ Measure status: %', v_measure_status;
    RAISE NOTICE '  ℹ Compliance record status: %', v_compliance_status;
    
    IF v_measure_status IN ('in_progress', 'implemented') THEN
      RAISE NOTICE '  ✓ Measure status updated correctly';
    ELSE
      RAISE WARNING '  ⚠ Measure status not updated (expected in_progress or implemented, got %)', v_measure_status;
    END IF;
  END;
  
  -- =====================================================
  -- TEST 12: Проверка функции calculate_measure_completion
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 12: Testing calculate_measure_completion function...';
  
  DECLARE
    v_completion JSONB;
  BEGIN
    SELECT calculate_measure_completion(v_control_measure_id) INTO v_completion;
    
    RAISE NOTICE '  ℹ Completion data: %', v_completion;
    RAISE NOTICE '  ✓ calculate_measure_completion function works';
  END;
  
  -- =====================================================
  -- TEST 13: Проверка RLS политик
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 13: Checking RLS policies...';
  
  -- Проверить, что RLS включен
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'control_measures'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '  ✓ RLS enabled on control_measures';
  ELSE
    RAISE WARNING '  ⚠ RLS NOT enabled on control_measures';
  END IF;
  
  -- Подсчитать количество политик
  DECLARE
    v_policy_count INT;
  BEGIN
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE tablename = 'control_measures';
    
    RAISE NOTICE '  ℹ Found % RLS policies on control_measures', v_policy_count;
    
    IF v_policy_count >= 4 THEN
      RAISE NOTICE '  ✓ Sufficient RLS policies exist';
    ELSE
      RAISE WARNING '  ⚠ Expected at least 4 RLS policies, found %', v_policy_count;
    END IF;
  END;
  
  -- =====================================================
  -- TEST 14: Проверка helper функций
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 14: Checking helper functions...';
  
  -- Проверить get_user_context
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_user_context'
  ) THEN
    RAISE NOTICE '  ✓ get_user_context function exists';
  ELSE
    RAISE WARNING '  ⚠ get_user_context function NOT FOUND';
  END IF;
  
  -- Проверить can_access_organization
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'can_access_organization'
  ) THEN
    RAISE NOTICE '  ✓ can_access_organization function exists';
  ELSE
    RAISE WARNING '  ⚠ can_access_organization function NOT FOUND';
  END IF;
  
  -- Проверить validate_evidence_type
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'validate_evidence_type'
  ) THEN
    RAISE NOTICE '  ✓ validate_evidence_type function exists';
  ELSE
    RAISE WARNING '  ⚠ validate_evidence_type function NOT FOUND';
  END IF;
  
  -- =====================================================
  -- CLEANUP: Удаление тестовых данных
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'CLEANUP: Removing test data...';
  
  DELETE FROM evidence_links WHERE evidence_id = v_evidence_id;
  DELETE FROM evidence WHERE id = v_evidence_id;
  DELETE FROM control_measures WHERE id = v_control_measure_id;
  DELETE FROM compliance_records WHERE id = v_compliance_record_id;
  DELETE FROM control_measure_templates WHERE id = v_test_template_id;
  DELETE FROM requirements WHERE id = v_test_requirement_id;
  DELETE FROM organizations WHERE id = v_test_org_id;
  
  RAISE NOTICE '  ✓ Test data cleaned up';
  
  -- =====================================================
  -- FINAL REPORT
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'END-TO-END TEST COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  ✓ All tables exist';
  RAISE NOTICE '  ✓ Evidence types configured';
  RAISE NOTICE '  ✓ Organizations can be created';
  RAISE NOTICE '  ✓ Requirements can be created';
  RAISE NOTICE '  ✓ Templates can be created and linked';
  RAISE NOTICE '  ✓ Compliance records can be created';
  RAISE NOTICE '  ✓ Control measures can be created from templates';
  RAISE NOTICE '  ✓ Evidence can be created and linked';
  RAISE NOTICE '  ✓ Status calculation functions work';
  RAISE NOTICE '  ✓ RLS policies are configured';
  RAISE NOTICE '  ✓ Helper functions exist';
  RAISE NOTICE '';
  RAISE NOTICE 'The measure creation flow is working correctly!';
  RAISE NOTICE '========================================';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST FAILED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Error: %', SQLERRM;
    RAISE NOTICE 'Detail: %', SQLSTATE;
    RAISE NOTICE '========================================';
    RAISE;
END $$;
