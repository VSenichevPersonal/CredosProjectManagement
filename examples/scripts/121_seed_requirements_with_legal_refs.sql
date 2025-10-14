-- Migration 121: Seed requirements with legal article references
-- Expert: IB Compliance specialist for Russian Federation
-- 30 diverse requirements with and without legal article references

DO $$
DECLARE
  v_tenant_id UUID;
  v_admin_user_id UUID; -- Added admin user for created_by
  v_regulator_fstec UUID;
  v_regulator_roskomnadzor UUID;
  v_framework_kii UUID;
  v_framework_pdn UUID;
  v_framework_gis UUID;
  v_role_ciso UUID;
  v_role_admin UUID;
  v_role_dpo UUID;
  v_periodicity_annual UUID;
  v_periodicity_quarterly UUID;
  v_periodicity_monthly UUID;
  v_verification_audit UUID;
  v_verification_test UUID;
  v_verification_doc UUID;
  
  -- Legal articles
  v_art_kii_5 UUID;
  v_art_kii_12 UUID;
  v_art_kii_18 UUID;
  v_art_kii_21 UUID;
  v_art_kii_25 UUID;
  v_art_kii_28 UUID;
  v_art_pdn_4 UUID;
  v_art_pdn_6 UUID;
  v_art_pdn_8 UUID;
  v_art_pdn_13 UUID;
  v_art_pdn_16 UUID;
  v_art_gis_16 UUID;
  v_art_gis_18 UUID;
  v_art_gis_18_3 UUID;
  
  -- Requirements
  v_req UUID;
  
BEGIN
  -- Get tenant
  SELECT id INTO v_tenant_id FROM tenants WHERE is_active = true LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No active tenant found';
  END IF;
  
  -- Get or create system admin user for created_by field
  SELECT id INTO v_admin_user_id 
  FROM users 
  WHERE tenant_id = v_tenant_id 
    AND role = 'super_admin' 
  LIMIT 1;
  
  IF v_admin_user_id IS NULL THEN
    -- Create system admin user if not exists
    INSERT INTO users (id, tenant_id, email, name, role, is_active)
    VALUES (
      gen_random_uuid(),
      v_tenant_id,
      'system@compliance.local',
      'Системный администратор',
      'super_admin',
      true
    )
    RETURNING id INTO v_admin_user_id;
    
    RAISE NOTICE 'Created system admin user: %', v_admin_user_id;
  END IF;
  
  -- Get regulators
  SELECT id INTO v_regulator_fstec FROM regulators WHERE tenant_id = v_tenant_id AND short_name = 'ФСТЭК России' LIMIT 1;
  SELECT id INTO v_regulator_roskomnadzor FROM regulators WHERE tenant_id = v_tenant_id AND short_name = 'Роскомнадзор' LIMIT 1;
  
  -- Get frameworks
  SELECT id INTO v_framework_kii FROM regulatory_frameworks WHERE code = 'FSTEC-239' LIMIT 1;
  SELECT id INTO v_framework_pdn FROM regulatory_frameworks WHERE code = 'FSTEC-21' LIMIT 1;
  SELECT id INTO v_framework_gis FROM regulatory_frameworks WHERE code = '149-FZ' LIMIT 1;
  
  -- Get or create roles
  SELECT id INTO v_role_ciso FROM responsible_roles WHERE tenant_id = v_tenant_id AND code = 'CISO' LIMIT 1;
  IF v_role_ciso IS NULL THEN
    INSERT INTO responsible_roles (id, tenant_id, code, name, description, is_active)
    VALUES (gen_random_uuid(), v_tenant_id, 'CISO', 'Руководитель службы ИБ', 'Ответственный за информационную безопасность', true)
    RETURNING id INTO v_role_ciso;
  END IF;
  
  SELECT id INTO v_role_admin FROM responsible_roles WHERE tenant_id = v_tenant_id AND code = 'ADMIN' LIMIT 1;
  IF v_role_admin IS NULL THEN
    INSERT INTO responsible_roles (id, tenant_id, code, name, description, is_active)
    VALUES (gen_random_uuid(), v_tenant_id, 'ADMIN', 'Системный администратор', 'Администратор информационных систем', true)
    RETURNING id INTO v_role_admin;
  END IF;
  
  SELECT id INTO v_role_dpo FROM responsible_roles WHERE tenant_id = v_tenant_id AND code = 'DPO' LIMIT 1;
  IF v_role_dpo IS NULL THEN
    INSERT INTO responsible_roles (id, tenant_id, code, name, description, is_active)
    VALUES (gen_random_uuid(), v_tenant_id, 'DPO', 'Ответственный за обработку ПДн', 'Data Protection Officer', true)
    RETURNING id INTO v_role_dpo;
  END IF;
  
  -- Get or create periodicities
  SELECT id INTO v_periodicity_annual FROM periodicities WHERE tenant_id = v_tenant_id AND code = 'ANNUAL' LIMIT 1;
  IF v_periodicity_annual IS NULL THEN
    INSERT INTO periodicities (id, tenant_id, code, name, description, is_active)
    VALUES (gen_random_uuid(), v_tenant_id, 'ANNUAL', 'Ежегодно', 'Один раз в год', true)
    RETURNING id INTO v_periodicity_annual;
  END IF;
  
  SELECT id INTO v_periodicity_quarterly FROM periodicities WHERE tenant_id = v_tenant_id AND code = 'QUARTERLY' LIMIT 1;
  IF v_periodicity_quarterly IS NULL THEN
    INSERT INTO periodicities (id, tenant_id, code, name, description, is_active)
    VALUES (gen_random_uuid(), v_tenant_id, 'QUARTERLY', 'Ежеквартально', 'Каждый квартал', true)
    RETURNING id INTO v_periodicity_quarterly;
  END IF;
  
  SELECT id INTO v_periodicity_monthly FROM periodicities WHERE tenant_id = v_tenant_id AND code = 'MONTHLY' LIMIT 1;
  IF v_periodicity_monthly IS NULL THEN
    INSERT INTO periodicities (id, tenant_id, code, name, description, is_active)
    VALUES (gen_random_uuid(), v_tenant_id, 'MONTHLY', 'Ежемесячно', 'Каждый месяц', true)
    RETURNING id INTO v_periodicity_monthly;
  END IF;
  
  -- Get or create verification methods
  SELECT id INTO v_verification_audit FROM verification_methods WHERE tenant_id = v_tenant_id AND code = 'AUDIT' LIMIT 1;
  IF v_verification_audit IS NULL THEN
    INSERT INTO verification_methods (id, tenant_id, code, name, description, is_active)
    VALUES (gen_random_uuid(), v_tenant_id, 'AUDIT', 'Аудит', 'Проверка документов и настроек', true)
    RETURNING id INTO v_verification_audit;
  END IF;
  
  SELECT id INTO v_verification_test FROM verification_methods WHERE tenant_id = v_tenant_id AND code = 'TEST' LIMIT 1;
  IF v_verification_test IS NULL THEN
    INSERT INTO verification_methods (id, tenant_id, code, name, description, is_active)
    VALUES (gen_random_uuid(), v_tenant_id, 'TEST', 'Тестирование', 'Практическое тестирование', true)
    RETURNING id INTO v_verification_test;
  END IF;
  
  SELECT id INTO v_verification_doc FROM verification_methods WHERE tenant_id = v_tenant_id AND code = 'DOC_REVIEW' LIMIT 1;
  IF v_verification_doc IS NULL THEN
    INSERT INTO verification_methods (id, tenant_id, code, name, description, is_active)
    VALUES (gen_random_uuid(), v_tenant_id, 'DOC_REVIEW', 'Проверка документации', 'Анализ документов', true)
    RETURNING id INTO v_verification_doc;
  END IF;
  
  -- Get legal articles
  SELECT id INTO v_art_kii_5 FROM legal_articles WHERE regulatory_framework_id = v_framework_kii AND clause = '5' LIMIT 1;
  SELECT id INTO v_art_kii_12 FROM legal_articles WHERE regulatory_framework_id = v_framework_kii AND clause = '12' LIMIT 1;
  SELECT id INTO v_art_kii_18 FROM legal_articles WHERE regulatory_framework_id = v_framework_kii AND clause = '18' LIMIT 1;
  SELECT id INTO v_art_kii_21 FROM legal_articles WHERE regulatory_framework_id = v_framework_kii AND clause = '21' LIMIT 1;
  SELECT id INTO v_art_kii_25 FROM legal_articles WHERE regulatory_framework_id = v_framework_kii AND clause = '25' LIMIT 1;
  SELECT id INTO v_art_kii_28 FROM legal_articles WHERE regulatory_framework_id = v_framework_kii AND clause = '28' LIMIT 1;
  
  SELECT id INTO v_art_pdn_4 FROM legal_articles WHERE regulatory_framework_id = v_framework_pdn AND clause = '4' LIMIT 1;
  SELECT id INTO v_art_pdn_6 FROM legal_articles WHERE regulatory_framework_id = v_framework_pdn AND clause = '6' LIMIT 1;
  SELECT id INTO v_art_pdn_8 FROM legal_articles WHERE regulatory_framework_id = v_framework_pdn AND clause = '8' LIMIT 1;
  SELECT id INTO v_art_pdn_13 FROM legal_articles WHERE regulatory_framework_id = v_framework_pdn AND clause = '13' LIMIT 1;
  SELECT id INTO v_art_pdn_16 FROM legal_articles WHERE regulatory_framework_id = v_framework_pdn AND clause = '16' LIMIT 1;
  
  SELECT id INTO v_art_gis_16 FROM legal_articles WHERE regulatory_framework_id = v_framework_gis AND clause = '16' LIMIT 1;
  SELECT id INTO v_art_gis_18 FROM legal_articles WHERE regulatory_framework_id = v_framework_gis AND clause = '18' LIMIT 1;
  SELECT id INTO v_art_gis_18_3 FROM legal_articles WHERE regulatory_framework_id = v_framework_gis AND clause = '18.3' LIMIT 1;
  
  -- ============================================================================
  -- КИИ (Приказ ФСТЭК №239) - 10 requirements
  -- ============================================================================
  
  -- 1. Категорирование объектов КИИ (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'КИИ-КАТ-01', 
    'Категорирование объектов критической информационной инфраструктуры',
    'Проведение категорирования принадлежащих субъекту КИИ объектов в соответствии с критериями категорирования. Категорирование проводится в течение 6 месяцев с момента ввода объекта в эксплуатацию.',
    'organizational', v_framework_kii, v_regulator_fstec, v_role_ciso, v_periodicity_annual, v_verification_audit, 'critical', 'active', '2018-01-01', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_kii_5 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_kii_5, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- 2. Создание системы безопасности КИИ (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'КИИ-СБ-01',
    'Создание и документирование системы безопасности значимого объекта КИИ',
    'Субъект КИИ обязан создать систему безопасности значимого объекта, включающую организационные и технические меры. Система безопасности должна быть документирована.',
    'organizational', v_framework_kii, v_regulator_fstec, v_role_ciso, v_periodicity_annual, v_verification_doc, 'critical', 'active', '2018-01-01', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_kii_12 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_kii_12, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- 3. Реагирование на компьютерные инциденты (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'КИИ-ИНЦ-01',
    'Обнаружение и информирование о компьютерных инцидентах',
    'Обеспечение обнаружения, предупреждения и ликвидации последствий компьютерных атак. Информирование ГосСОПКА о компьютерных инцидентах в установленные сроки.',
    'technical', v_framework_kii, v_regulator_fstec, v_role_ciso, v_periodicity_monthly, v_verification_test, 'critical', 'active', '2018-01-01', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_kii_18 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_kii_18, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- 4. Идентификация и аутентификация (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'КИИ-ИАА-01',
    'Идентификация и аутентификация субъектов и объектов доступа',
    'Обеспечение идентификации и аутентификации субъектов доступа и объектов доступа в значимом объекте КИИ. Применение многофакторной аутентификации для критичных систем.',
    'technical', v_framework_kii, v_regulator_fstec, v_role_admin, v_periodicity_quarterly, v_verification_test, 'high', 'active', '2018-01-01', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_kii_21 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_kii_21, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- 5. Регистрация событий безопасности (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'КИИ-АУД-01',
    'Регистрация событий безопасности и реагирование',
    'Обеспечение регистрации событий безопасности, хранение журналов не менее 6 месяцев, анализ и реагирование на инциденты безопасности.',
    'technical', v_framework_kii, v_regulator_fstec, v_role_admin, v_periodicity_monthly, v_verification_audit, 'high', 'active', '2018-01-01', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_kii_25 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_kii_25, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- 6. Обучение персонала (БЕЗ пункта)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'КИИ-ОБУ-01',
    'Обучение персонала по вопросам безопасности КИИ',
    'Проведение регулярного обучения и повышения квалификации персонала, работающего со значимыми объектами КИИ, по вопросам информационной безопасности.',
    'organizational', v_framework_kii, v_regulator_fstec, v_role_ciso, v_periodicity_annual, v_verification_doc, 'medium', 'active', '2018-01-01', v_admin_user_id
  );
  
  -- 7. Контроль защищенности (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'КИИ-КНТ-01',
    'Контроль (анализ) защищенности значимого объекта КИИ',
    'Проведение регулярного контроля защищенности значимого объекта КИИ, включая анализ уязвимостей, тестирование на проникновение и оценку эффективности мер защиты.',
    'technical', v_framework_kii, v_regulator_fstec, v_role_ciso, v_periodicity_annual, v_verification_test, 'high', 'active', '2018-01-01', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_kii_28 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_kii_28, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- Adding 3 more КИИ requirements to reach 10 total
  
  -- 8. Резервное копирование КИИ (БЕЗ пункта)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'КИИ-РК-01',
    'Резервное копирование данных значимого объекта КИИ',
    'Обеспечение регулярного резервного копирования данных значимого объекта КИИ с проверкой возможности восстановления. Хранение резервных копий в защищенном месте.',
    'technical', v_framework_kii, v_regulator_fstec, v_role_admin, v_periodicity_monthly, v_verification_test, 'high', 'active', '2018-01-01', v_admin_user_id
  );
  
  -- 9. Антивирусная защита КИИ (БЕЗ пункта)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'КИИ-АВ-01',
    'Антивирусная защита значимого объекта КИИ',
    'Обеспечение антивирусной защиты с регулярным обновлением антивирусных баз. Проведение регулярного сканирования системы на наличие вредоносного ПО.',
    'technical', v_framework_kii, v_regulator_fstec, v_role_admin, v_periodicity_monthly, v_verification_test, 'high', 'active', '2018-01-01', v_admin_user_id
  );
  
  -- 10. Обновление программного обеспечения КИИ (БЕЗ пункта)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'КИИ-ОБН-01',
    'Своевременное обновление программного обеспечения',
    'Обеспечение своевременного обновления программного обеспечения значимого объекта КИИ, включая установку критических обновлений безопасности.',
    'technical', v_framework_kii, v_regulator_fstec, v_role_admin, v_periodicity_monthly, v_verification_audit, 'high', 'active', '2018-01-01', v_admin_user_id
  );
  
  -- ============================================================================
  -- ПДн (Приказ ФСТЭК №21) - 10 requirements
  -- ============================================================================
  
  -- 11. Модель угроз безопасности ПДн (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ПДН-МУ-01',
    'Разработка модели угроз безопасности персональных данных',
    'Определение актуальных угроз безопасности ПДн и разработка модели угроз для информационной системы персональных данных с учетом специфики обработки.',
    'organizational', v_framework_pdn, v_regulator_roskomnadzor, v_role_dpo, v_periodicity_annual, v_verification_doc, 'critical', 'active', '2006-07-27', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_pdn_4 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_pdn_4, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- 12. Определение уровня защищенности ПДн (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ПДН-УЗ-01',
    'Определение уровня защищенности персональных данных',
    'Определение уровня защищенности ПДн (1, 2, 3 или 4) на основании категории и типа обрабатываемых персональных данных, угроз безопасности и структуры информационной системы.',
    'organizational', v_framework_pdn, v_regulator_roskomnadzor, v_role_dpo, v_periodicity_annual, v_verification_doc, 'critical', 'active', '2006-07-27', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_pdn_6 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_pdn_6, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- 13. Идентификация и аутентификация в ИСПДн (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ПДН-ИАА-01',
    'Идентификация и аутентификация субъектов доступа в ИСПДн',
    'Обеспечение идентификации и аутентификации субъектов доступа к персональным данным. Применение усиленных механизмов аутентификации для УЗ-1 и УЗ-2.',
    'technical', v_framework_pdn, v_regulator_roskomnadzor, v_role_admin, v_periodicity_quarterly, v_verification_test, 'high', 'active', '2006-07-27', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_pdn_8 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_pdn_8, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- 14. Управление доступом к ПДн (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ПДН-УД-01',
    'Управление доступом к персональным данным',
    'Обеспечение управления доступом субъектов к персональным данным на основе принципа минимальных привилегий. Регулярный пересмотр прав доступа.',
    'technical', v_framework_pdn, v_regulator_roskomnadzor, v_role_admin, v_periodicity_quarterly, v_verification_audit, 'high', 'active', '2006-07-27', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_pdn_8 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_pdn_8, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- 15. Антивирусная защита ИСПДн (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ПДН-АВ-01',
    'Антивирусная защита информационной системы персональных данных',
    'Обеспечение антивирусной защиты с регулярным обновлением антивирусных баз. Проведение регулярного сканирования системы на наличие вредоносного ПО.',
    'technical', v_framework_pdn, v_regulator_roskomnadzor, v_role_admin, v_periodicity_monthly, v_verification_test, 'high', 'active', '2006-07-27', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_pdn_13 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_pdn_13, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- 16. Использование сертифицированных СЗИ (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ПДН-СЗИ-01',
    'Применение сертифицированных средств защиты информации',
    'Использование сертифицированных ФСТЭК России или ФСБ России средств защиты информации для обеспечения безопасности персональных данных в соответствии с уровнем защищенности.',
    'technical', v_framework_pdn, v_regulator_roskomnadzor, v_role_ciso, v_periodicity_annual, v_verification_audit, 'critical', 'active', '2006-07-27', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_pdn_16 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_pdn_16, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- Adding 4 more ПДн requirements to reach 10 total
  
  -- 17. Резервное копирование ПДн (БЕЗ пункта)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ПДН-РК-01',
    'Резервное копирование персональных данных',
    'Обеспечение регулярного резервного копирования персональных данных с проверкой возможности восстановления. Хранение резервных копий в защищенном месте.',
    'technical', v_framework_pdn, v_regulator_roskomnadzor, v_role_admin, v_periodicity_monthly, v_verification_test, 'high', 'active', '2006-07-27', v_admin_user_id
  );
  
  -- 18. Уничтожение ПДн (БЕЗ пункта)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ПДН-УН-01',
    'Уничтожение персональных данных при достижении целей обработки',
    'Обеспечение безвозвратного уничтожения персональных данных при достижении целей обработки или утрате необходимости в их достижении. Документирование процесса уничтожения.',
    'procedural', v_framework_pdn, v_regulator_roskomnadzor, v_role_dpo, v_periodicity_quarterly, v_verification_doc, 'medium', 'active', '2006-07-27', v_admin_user_id
  );
  
  -- 19. Обучение персонала по ПДн (БЕЗ пункта)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ПДН-ОБУ-01',
    'Обучение персонала по вопросам защиты персональных данных',
    'Проведение регулярного обучения персонала, работающего с персональными данными, по вопросам их защиты и требованиям законодательства.',
    'organizational', v_framework_pdn, v_regulator_roskomnadzor, v_role_dpo, v_periodicity_annual, v_verification_doc, 'medium', 'active', '2006-07-27', v_admin_user_id
  );
  
  -- 20. Оценка эффективности мер защиты ПДн (БЕЗ пункта)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ПДН-ОЦЕ-01',
    'Оценка эффективности принимаемых мер по защите ПДн',
    'Проведение регулярной оценки эффективности принимаемых мер по обеспечению безопасности персональных данных с документированием результатов.',
    'procedural', v_framework_pdn, v_regulator_roskomnadzor, v_role_dpo, v_periodicity_annual, v_verification_audit, 'high', 'active', '2006-07-27', v_admin_user_id
  );
  
  -- ============================================================================
  -- ГИС (149-ФЗ) - 10 requirements
  -- ============================================================================
  
  -- 21. Политика защиты информации в ГИС (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ГИС-ПОЛ-01',
    'Разработка и утверждение политики защиты информации в ГИС',
    'Оператор ГИС обязан разработать и утвердить политику защиты информации, определяющую правила и процедуры обеспечения безопасности информации в государственной информационной системе.',
    'organizational', v_framework_gis, v_regulator_fstec, v_role_ciso, v_periodicity_annual, v_verification_doc, 'critical', 'active', '2006-07-27', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_gis_18 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_gis_18, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- 22. Назначение ответственных лиц (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ГИС-ОТВ-01',
    'Назначение лиц, ответственных за обеспечение безопасности информации',
    'Назначение приказом руководителя организации лиц, ответственных за обеспечение безопасности информации в ГИС, с определением их полномочий и обязанностей.',
    'organizational', v_framework_gis, v_regulator_fstec, v_role_ciso, v_periodicity_annual, v_verification_doc, 'high', 'active', '2006-07-27', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_gis_18 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_gis_18, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- 23. Применение организационных и технических мер (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ГИС-МЕР-01',
    'Применение организационных и технических мер защиты информации',
    'Применение комплекса организационных и технических мер по обеспечению безопасности информации в ГИС в соответствии с требованиями ФСТЭК России.',
    'technical', v_framework_gis, v_regulator_fstec, v_role_ciso, v_periodicity_quarterly, v_verification_audit, 'critical', 'active', '2006-07-27', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_gis_18_3 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_gis_18_3, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- 24. Оценка эффективности мер защиты (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ГИС-ОЦЕ-01',
    'Оценка эффективности принимаемых мер по обеспечению безопасности',
    'Проведение регулярной оценки эффективности принимаемых мер по обеспечению безопасности информации в ГИС с документированием результатов.',
    'procedural', v_framework_gis, v_regulator_fstec, v_role_ciso, v_periodicity_annual, v_verification_audit, 'high', 'active', '2006-07-27', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_gis_18_3 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_gis_18_3, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- 25. Физическая защита ГИС (БЕЗ пункта)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ГИС-ФИЗ-01',
    'Физическая защита помещений и оборудования ГИС',
    'Обеспечение физической защиты помещений, в которых размещено оборудование ГИС: контроль доступа, видеонаблюдение, охранная сигнализация.',
    'physical', v_framework_gis, v_regulator_fstec, v_role_admin, v_periodicity_quarterly, v_verification_audit, 'medium', 'active', '2006-07-27', v_admin_user_id
  );
  
  -- 26. Взаимодействие с ГосСОПКА (с пунктом)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ГИС-ГСК-01',
    'Обеспечение взаимодействия с государственной системой обнаружения компьютерных атак',
    'Обеспечение взаимодействия ГИС с государственной системой обнаружения, предупреждения и ликвидации последствий компьютерных атак (ГосСОПКА).',
    'technical', v_framework_gis, v_regulator_fstec, v_role_ciso, v_periodicity_quarterly, v_verification_test, 'critical', 'active', '2006-07-27', v_admin_user_id
  ) RETURNING id INTO v_req;
  
  IF v_art_gis_16 IS NOT NULL THEN
    INSERT INTO requirement_legal_references (requirement_id, legal_article_id, is_primary, tenant_id)
    VALUES (v_req, v_art_gis_16, true, v_tenant_id)
    ON CONFLICT (requirement_id, legal_article_id) DO NOTHING;
  END IF;
  
  -- Adding 4 more ГИС requirements to reach 10 total
  
  -- 27. Использование сертифицированных СЗИ в ГИС (БЕЗ пункта)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ГИС-СЗИ-01',
    'Применение сертифицированных средств защиты информации в ГИС',
    'Использование сертифицированных ФСТЭК России или ФСБ России средств защиты информации для обеспечения безопасности ГИС.',
    'technical', v_framework_gis, v_regulator_fstec, v_role_ciso, v_periodicity_annual, v_verification_audit, 'critical', 'active', '2006-07-27', v_admin_user_id
  );
  
  -- 28. Контроль доступа в ГИС (БЕЗ пункта)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ГИС-КД-01',
    'Контроль доступа к информации в ГИС',
    'Обеспечение контроля доступа к информации в ГИС на основе принципа минимальных привилегий. Регулярный пересмотр прав доступа пользователей.',
    'technical', v_framework_gis, v_regulator_fstec, v_role_admin, v_periodicity_quarterly, v_verification_audit, 'high', 'active', '2006-07-27', v_admin_user_id
  );
  
  -- 29. Регистрация событий безопасности в ГИС (БЕЗ пункта)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ГИС-РЕГ-01',
    'Регистрация событий безопасности в ГИС',
    'Обеспечение регистрации событий безопасности в ГИС, хранение журналов не менее 6 месяцев, анализ и реагирование на инциденты.',
    'technical', v_framework_gis, v_regulator_fstec, v_role_admin, v_periodicity_monthly, v_verification_audit, 'high', 'active', '2006-07-27', v_admin_user_id
  );
  
  -- 30. Резервное копирование данных ГИС (БЕЗ пункта)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date, created_by)
  VALUES (
    gen_random_uuid(), v_tenant_id, 'ГИС-РК-01',
    'Резервное копирование данных ГИС',
    'Обеспечение регулярного резервного копирования данных ГИС с проверкой возможности восстановления. Хранение резервных копий в защищенном месте.',
    'technical', v_framework_gis, v_regulator_fstec, v_role_admin, v_periodicity_monthly, v_verification_test, 'high', 'active', '2006-07-27', v_admin_user_id
  );
  
  -- ============================================================================
  -- ИТОГОВАЯ СТАТИСТИКА
  -- ============================================================================
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Requirements with legal references seeded!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total requirements: %', (SELECT COUNT(*) FROM requirements WHERE tenant_id = v_tenant_id);
  RAISE NOTICE 'Requirements with legal refs: %', (SELECT COUNT(DISTINCT requirement_id) FROM requirement_legal_references WHERE tenant_id = v_tenant_id);
  RAISE NOTICE 'Total legal references: %', (SELECT COUNT(*) FROM requirement_legal_references WHERE tenant_id = v_tenant_id);
  RAISE NOTICE '============================================';
  RAISE NOTICE 'КИИ requirements: 10 (6 with legal refs, 4 without)';
  RAISE NOTICE 'ПДн requirements: 10 (6 with legal refs, 4 without)';
  RAISE NOTICE 'ГИС requirements: 10 (6 with legal refs, 4 without)';
  RAISE NOTICE '============================================';
  
END $$;
