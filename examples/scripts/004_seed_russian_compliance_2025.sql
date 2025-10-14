-- ============================================================================
-- SEED: Российский ИБ Комплаенс 2025
-- Реальные требования и меры защиты из ФСТЭК, ФСБ, 152-ФЗ
-- ============================================================================

-- Получаем tenant_id (Правительство Тульской области)
DO $$
DECLARE
  v_tenant_id UUID;
  v_regulator_fstec UUID;
  v_regulator_fsb UUID;
  v_regulator_roskomnadzor UUID;
  v_framework_kii UUID;
  v_framework_pdn UUID;
  v_framework_skzi UUID;
  v_category_access_control UUID;
  v_category_audit UUID;
  v_category_crypto UUID;
  v_category_pdn UUID;
  v_role_ciso UUID;
  v_role_admin UUID;
  v_periodicity_annual UUID;
  v_periodicity_quarterly UUID;
  v_verification_audit UUID;
  v_verification_test UUID;
  
  -- Требования
  v_req_upd3 UUID;
  v_req_upd4 UUID;
  v_req_aud0 UUID;
  v_req_aud1 UUID;
  v_req_aud2 UUID;
  v_req_pdn_uz1 UUID;
  v_req_pdn_uz2 UUID;
  v_req_pdn_consent UUID;
  v_req_pdn_localization UUID;
  v_req_skzi_gis UUID;
  v_req_skzi_transmission UUID;
  
  -- Контроли
  v_control_trusted_boot UUID;
  v_control_rbac UUID;
  v_control_audit_log UUID;
  v_control_vulnerability UUID;
  v_control_inventory UUID;
  v_control_encryption UUID;
  v_control_pdn_policy UUID;
  v_control_consent_form UUID;
  v_control_db_localization UUID;
  v_control_skzi_cert UUID;
  
  v_admin_user_id UUID;
  v_government_org_id UUID;
  
BEGIN
  -- Получаем tenant
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'tula-region' LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant "tula-region" not found. Run 002_seed_tula_region.sql first.';
  END IF;
  
  -- Получаем ID правительства Тульской области для создания пользователя
  SELECT id INTO v_government_org_id 
  FROM organizations 
  WHERE tenant_id = v_tenant_id 
    AND name = 'Правительство Тульской области' 
  LIMIT 1;
  
  -- Создаем admin пользователя, если его нет
  SELECT id INTO v_admin_user_id 
  FROM users 
  WHERE tenant_id = v_tenant_id 
    AND role = 'super_admin' 
  LIMIT 1;
  
  IF v_admin_user_id IS NULL THEN
    INSERT INTO users (id, tenant_id, email, name, role, organization_id, is_active)
    VALUES (
      gen_random_uuid(),
      v_tenant_id,
      'admin@tula-region.ru',
      'Администратор системы',
      'super_admin',
      v_government_org_id,
      true
    )
    RETURNING id INTO v_admin_user_id;
    
    RAISE NOTICE 'Created super_admin user: %', v_admin_user_id;
  END IF;

  -- ============================================================================
  -- 1. РЕГУЛЯТОРЫ
  -- ============================================================================
  
  INSERT INTO regulators (id, tenant_id, name, short_name, description, is_active)
  VALUES (gen_random_uuid(), v_tenant_id, 'Федеральная служба по техническому и экспортному контролю', 'ФСТЭК России', 'Регулятор в области защиты информации и КИИ', true)
  RETURNING id INTO v_regulator_fstec;
  
  INSERT INTO regulators (id, tenant_id, name, short_name, description, is_active)
  VALUES (gen_random_uuid(), v_tenant_id, 'Федеральная служба безопасности', 'ФСБ России', 'Регулятор в области криптографической защиты информации', true)
  RETURNING id INTO v_regulator_fsb;
  
  INSERT INTO regulators (id, tenant_id, name, short_name, description, is_active)
  VALUES (gen_random_uuid(), v_tenant_id, 'Федеральная служба по надзору в сфере связи, информационных технологий и массовых коммуникаций', 'Роскомнадзор', 'Регулятор в области защиты персональных данных', true)
  RETURNING id INTO v_regulator_roskomnadzor;

  -- ============================================================================
  -- 2. НОРМАТИВНЫЕ БАЗЫ
  -- ============================================================================
  
  -- Разделил INSERT на отдельные запросы для каждого фреймворка
  INSERT INTO regulatory_frameworks (id, code, name, short_name, description, authority, category, effective_date, is_active)
  VALUES (gen_random_uuid(), 'FSTEC-239', 'Приказ ФСТЭК России от 25.12.2017 № 239', 'ФСТЭК №239', 'Требования по обеспечению безопасности значимых объектов критической информационной инфраструктуры', 'ФСТЭК России', 'КИИ', '2018-01-01', true)
  RETURNING id INTO v_framework_kii;
  
  INSERT INTO regulatory_frameworks (id, code, name, short_name, description, authority, category, effective_date, is_active)
  VALUES (gen_random_uuid(), 'FZ-152', 'Федеральный закон от 27.07.2006 № 152-ФЗ', '152-ФЗ', 'О персональных данных (с изменениями от 30.05.2025)', 'Роскомнадзор', 'ПДн', '2006-07-27', true)
  RETURNING id INTO v_framework_pdn;
  
  INSERT INTO regulatory_frameworks (id, code, name, short_name, description, authority, category, effective_date, is_active)
  VALUES (gen_random_uuid(), 'FSB-117', 'Приказ ФСБ России от 18.03.2025 № 117', 'ФСБ №117', 'Требования о защите информации с использованием шифровальных (криптографических) средств', 'ФСБ России', 'СКЗИ', '2025-04-06', true)
  RETURNING id INTO v_framework_skzi;

  -- ============================================================================
  -- 3. КАТЕГОРИИ ТРЕБОВАНИЙ
  -- ============================================================================
  
  -- Разделил INSERT на отдельные запросы для каждой категории
  INSERT INTO requirement_categories (id, tenant_id, code, name, description, is_active)
  VALUES (gen_random_uuid(), v_tenant_id, 'UPD', 'Управление доступом', 'Меры по управлению доступом к информации (УПД)', true)
  RETURNING id INTO v_category_access_control;
  
  INSERT INTO requirement_categories (id, tenant_id, code, name, description, is_active)
  VALUES (gen_random_uuid(), v_tenant_id, 'AUD', 'Аудит безопасности', 'Меры по регистрации и анализу событий безопасности (АУД)', true)
  RETURNING id INTO v_category_audit;
  
  INSERT INTO requirement_categories (id, tenant_id, code, name, description, is_active)
  VALUES (gen_random_uuid(), v_tenant_id, 'CRYPTO', 'Криптографическая защита', 'Меры по криптографической защите информации', true)
  RETURNING id INTO v_category_crypto;
  
  INSERT INTO requirement_categories (id, tenant_id, code, name, description, is_active)
  VALUES (gen_random_uuid(), v_tenant_id, 'PDN', 'Защита персональных данных', 'Меры по защите персональных данных', true)
  RETURNING id INTO v_category_pdn;

  -- ============================================================================
  -- 4. РОЛИ ОТВЕТСТВЕННЫХ
  -- ============================================================================
  
  -- Разделил INSERT на отдельные запросы для каждой роли
  INSERT INTO responsible_roles (id, tenant_id, code, name, description, is_active)
  VALUES (gen_random_uuid(), v_tenant_id, 'CISO', 'Руководитель службы ИБ', 'Ответственный за информационную безопасность', true)
  RETURNING id INTO v_role_ciso;
  
  INSERT INTO responsible_roles (id, tenant_id, code, name, description, is_active)
  VALUES (gen_random_uuid(), v_tenant_id, 'ADMIN', 'Системный администратор', 'Администратор информационных систем', true)
  RETURNING id INTO v_role_admin;

  -- ============================================================================
  -- 5. ПЕРИОДИЧНОСТЬ
  -- ============================================================================
  
  -- Разделил INSERT на отдельные запросы для каждой периодичности
  INSERT INTO periodicities (id, tenant_id, code, name, description, is_active)
  VALUES (gen_random_uuid(), v_tenant_id, 'ANNUAL', 'Ежегодно', 'Проверка проводится один раз в год', true)
  RETURNING id INTO v_periodicity_annual;
  
  INSERT INTO periodicities (id, tenant_id, code, name, description, is_active)
  VALUES (gen_random_uuid(), v_tenant_id, 'QUARTERLY', 'Ежеквартально', 'Проверка проводится каждый квартал', true)
  RETURNING id INTO v_periodicity_quarterly;

  -- ============================================================================
  -- 6. МЕТОДЫ ВЕРИФИКАЦИИ
  -- ============================================================================
  
  -- Разделил INSERT на отдельные запросы для каждого метода
  INSERT INTO verification_methods (id, tenant_id, code, name, description, is_active)
  VALUES (gen_random_uuid(), v_tenant_id, 'AUDIT', 'Аудит', 'Проверка документов и настроек', true)
  RETURNING id INTO v_verification_audit;
  
  INSERT INTO verification_methods (id, tenant_id, code, name, description, is_active)
  VALUES (gen_random_uuid(), v_tenant_id, 'TEST', 'Тестирование', 'Практическое тестирование мер защиты', true)
  RETURNING id INTO v_verification_test;

  -- ============================================================================
  -- 7. ТРЕБОВАНИЯ (ФСТЭК №239 - КИИ)
  -- ============================================================================
  
  -- УПД.3 Доверенная загрузка
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'УПД.3',
    'Доверенная загрузка',
    'Обеспечение доверенной загрузки программного обеспечения и программно-аппаратных средств значимого объекта КИИ. Применяется для категорий К1 и К2.',
    'Управление доступом',
    v_framework_kii,
    v_regulator_fstec,
    v_role_ciso,
    v_periodicity_annual,
    v_verification_test,
    'high',
    'active',
    '2018-01-01'
  ) RETURNING id INTO v_req_upd3;
  
  -- УПД.4 Разграничение ролей пользователей
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'УПД.4',
    'Разграничение ролей пользователей',
    'Разграничение прав доступа (ролей) пользователей, процессов и программных средств к информации, обрабатываемой на значимом объекте КИИ. Применяется для категорий К1, К2 и К3.',
    'Управление доступом',
    v_framework_kii,
    v_regulator_fstec,
    v_role_ciso,
    v_periodicity_quarterly,
    v_verification_audit,
    'critical',
    'active',
    '2018-01-01'
  ) RETURNING id INTO v_req_upd4;
  
  -- АУД.0 Регламентация правил аудита безопасности
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'АУД.0',
    'Регламентация правил аудита безопасности',
    'Регламентация правил и процедур регистрации событий безопасности, анализа и хранения регистрационной информации. Применяется для категорий К1, К2 и К3.',
    'Аудит безопасности',
    v_framework_kii,
    v_regulator_fstec,
    v_role_ciso,
    v_periodicity_annual,
    v_verification_audit,
    'high',
    'active',
    '2018-01-01'
  ) RETURNING id INTO v_req_aud0;
  
  -- АУД.1 Учет информационных ресурсов
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'АУД.1',
    'Учет информационных ресурсов',
    'Учет (инвентаризация) информационных ресурсов, программного обеспечения и программно-аппаратных средств значимого объекта КИИ. Применяется для всех категорий.',
    'Аудит безопасности',
    v_framework_kii,
    v_regulator_fstec,
    v_role_admin,
    v_periodicity_quarterly,
    v_verification_audit,
    'medium',
    'active',
    '2018-01-01'
  ) RETURNING id INTO v_req_aud1;
  
  -- АУД.2 Анализ и устранение уязвимостей
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'АУД.2',
    'Анализ и устранение уязвимостей',
    'Анализ уязвимостей программного обеспечения и программно-аппаратных средств значимого объекта КИИ и своевременное устранение или нейтрализация выявленных уязвимостей.',
    'Аудит безопасности',
    v_framework_kii,
    v_regulator_fstec,
    v_role_ciso,
    v_periodicity_quarterly,
    v_verification_test,
    'critical',
    'active',
    '2018-01-01'
  ) RETURNING id INTO v_req_aud2;

  -- ============================================================================
  -- 8. ТРЕБОВАНИЯ (152-ФЗ - ПДн)
  -- ============================================================================
  
  -- УЗ-1 Меры защиты для уровня защищенности 1
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'УЗ-1',
    'Меры защиты персональных данных (УЗ-1)',
    'Комплекс организационных и технических мер для обеспечения безопасности персональных данных при их обработке в информационных системах персональных данных 1 уровня защищенности.',
    'Защита персональных данных',
    v_framework_pdn,
    v_regulator_roskomnadzor,
    v_role_ciso,
    v_periodicity_annual,
    v_verification_audit,
    'critical',
    'active',
    '2006-07-27'
  ) RETURNING id INTO v_req_pdn_uz1;
  
  -- УЗ-2 Меры защиты для уровня защищенности 2
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'УЗ-2',
    'Меры защиты персональных данных (УЗ-2)',
    'Комплекс организационных и технических мер для обеспечения безопасности персональных данных при их обработке в информационных системах персональных данных 2 уровня защищенности.',
    'Защита персональных данных',
    v_framework_pdn,
    v_regulator_roskomnadzor,
    v_role_ciso,
    v_periodicity_annual,
    v_verification_audit,
    'high',
    'active',
    '2006-07-27'
  ) RETURNING id INTO v_req_pdn_uz2;
  
  -- Согласие на обработку ПДн (новые требования 2025)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'ПДн-Согласие',
    'Согласие на обработку персональных данных',
    'С 01.09.2025 согласие на обработку персональных данных должно быть получено строго отдельно от других документов или сведений, которые подписывает лицо. Должна использоваться единая форма согласия.',
    'Защита персональных данных',
    v_framework_pdn,
    v_regulator_roskomnadzor,
    v_role_ciso,
    v_periodicity_annual,
    v_verification_audit,
    'high',
    'active',
    '2025-09-01'
  ) RETURNING id INTO v_req_pdn_consent;
  
  -- Локализация баз данных (новые требования 2025)
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'ПДн-Локализация',
    'Локализация баз данных на территории РФ',
    'С 01.07.2025 запрещено использование баз данных, расположенных за пределами территории Российской Федерации, для обработки персональных данных граждан РФ (ФЗ №23-ФЗ).',
    'Защита персональных данных',
    v_framework_pdn,
    v_regulator_roskomnadzor,
    v_role_ciso,
    v_periodicity_annual,
    v_verification_audit,
    'critical',
    'active',
    '2025-07-01'
  ) RETURNING id INTO v_req_pdn_localization;

  -- ============================================================================
  -- 9. ТРЕБОВАНИЯ (ФСБ №117 - СКЗИ)
  -- ============================================================================
  
  -- СКЗИ для ГИС
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'СКЗИ-ГИС',
    'Применение СКЗИ в государственных информационных системах',
    'Защита информации в государственных информационных системах, информационных системах государственных органов, государственных унитарных предприятий и государственных учреждений с использованием сертифицированных ФСБ России шифровальных (криптографических) средств.',
    'Криптографическая защита',
    v_framework_skzi,
    v_regulator_fsb,
    v_role_ciso,
    v_periodicity_annual,
    v_verification_audit,
    'critical',
    'active',
    '2025-04-06'
  ) RETURNING id INTO v_req_skzi_gis;
  
  -- СКЗИ при передаче данных
  INSERT INTO requirements (id, tenant_id, code, title, description, category, regulatory_framework_id, regulator_id, responsible_role_id, periodicity_id, verification_method_id, criticality, status, effective_date)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'СКЗИ-Передача',
    'Криптографическая защита при передаче данных',
    'Обязательное применение СКЗИ при передаче информации за пределы контролируемой зоны, для электронной подписи и при хранении данных на носителях, где невозможно исключить несанкционированный доступ некриптографическими методами.',
    'Криптографическая защита',
    v_framework_skzi,
    v_regulator_fsb,
    v_role_ciso,
    v_periodicity_annual,
    v_verification_test,
    'high',
    'active',
    '2025-04-06'
  ) RETURNING id INTO v_req_skzi_transmission;

  -- ============================================================================
  -- 10. КОНТРОЛИ (Меры защиты)
  -- ============================================================================
  
  -- Контроль для УПД.3
  INSERT INTO controls (id, tenant_id, code, title, description, control_type, category, frequency, status, owner_id, created_by)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'CTRL-UPD3',
    'Реализация доверенной загрузки',
    'Настройка и контроль механизмов доверенной загрузки (Secure Boot, TPM) для обеспечения загрузки только доверенного ПО.',
    'technical',
    'Управление доступом',
    'annual',
    'active',
    v_admin_user_id,
    v_admin_user_id
  ) RETURNING id INTO v_control_trusted_boot;
  
  -- Контроль для УПД.4
  INSERT INTO controls (id, tenant_id, code, title, description, control_type, category, frequency, status, owner_id, created_by)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'CTRL-UPD4',
    'Ролевая модель доступа (RBAC)',
    'Внедрение и поддержка ролевой модели разграничения доступа к информационным ресурсам. Регулярный аудит прав доступа пользователей.',
    'technical',
    'Управление доступом',
    'quarterly',
    'active',
    v_admin_user_id,
    v_admin_user_id
  ) RETURNING id INTO v_control_rbac;
  
  -- Контроль для АУД.0
  INSERT INTO controls (id, tenant_id, code, title, description, control_type, category, frequency, status, owner_id, created_by)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'CTRL-AUD0',
    'Регламент аудита безопасности',
    'Разработка и утверждение регламента регистрации событий безопасности, определение состава регистрируемых событий, сроков хранения журналов.',
    'administrative',
    'Аудит безопасности',
    'annual',
    'active',
    v_admin_user_id,
    v_admin_user_id
  ) RETURNING id INTO v_control_audit_log;
  
  -- Контроль для АУД.2
  INSERT INTO controls (id, tenant_id, code, title, description, control_type, category, frequency, status, owner_id, created_by)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'CTRL-AUD2',
    'Управление уязвимостями',
    'Регулярное сканирование уязвимостей, анализ результатов, планирование и внедрение обновлений безопасности.',
    'technical',
    'Аудит безопасности',
    'quarterly',
    'active',
    v_admin_user_id,
    v_admin_user_id
  ) RETURNING id INTO v_control_vulnerability;
  
  -- Контроль для АУД.1
  INSERT INTO controls (id, tenant_id, code, title, description, control_type, category, frequency, status, owner_id, created_by)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'CTRL-AUD1',
    'Инвентаризация активов',
    'Ведение актуального реестра информационных ресурсов, программного обеспечения и оборудования.',
    'administrative',
    'Аудит безопасности',
    'quarterly',
    'active',
    v_admin_user_id,
    v_admin_user_id
  ) RETURNING id INTO v_control_inventory;
  
  -- Контроль для СКЗИ-ГИС
  INSERT INTO controls (id, tenant_id, code, title, description, control_type, category, frequency, status, owner_id, created_by)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'CTRL-SKZI-GIS',
    'Внедрение сертифицированных СКЗИ',
    'Внедрение и эксплуатация сертифицированных ФСБ России средств криптографической защиты информации в государственных информационных системах.',
    'technical',
    'Криптографическая защита',
    'annual',
    'active',
    v_admin_user_id,
    v_admin_user_id
  ) RETURNING id INTO v_control_encryption;
  
  -- Контроль для УЗ-1
  INSERT INTO controls (id, tenant_id, code, title, description, control_type, category, frequency, status, owner_id, created_by)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'CTRL-PDN-UZ1',
    'Политика защиты ПДн (УЗ-1)',
    'Разработка и внедрение политики защиты персональных данных для информационных систем 1 уровня защищенности.',
    'administrative',
    'Защита персональных данных',
    'annual',
    'active',
    v_admin_user_id,
    v_admin_user_id
  ) RETURNING id INTO v_control_pdn_policy;
  
  -- Контроль для ПДн-Согласие
  INSERT INTO controls (id, tenant_id, code, title, description, control_type, category, frequency, status, owner_id, created_by)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'CTRL-PDN-Consent',
    'Единая форма согласия на обработку ПДн',
    'Внедрение единой формы согласия на обработку персональных данных в соответствии с требованиями от 01.09.2025.',
    'administrative',
    'Защита персональных данных',
    'annual',
    'active',
    v_admin_user_id,
    v_admin_user_id
  ) RETURNING id INTO v_control_consent_form;
  
  -- Контроль для ПДн-Локализация
  INSERT INTO controls (id, tenant_id, code, title, description, control_type, category, frequency, status, owner_id, created_by)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'CTRL-PDN-Local',
    'Локализация баз данных ПДн',
    'Обеспечение размещения всех баз данных с персональными данными на территории Российской Федерации.',
    'technical',
    'Защита персональных данных',
    'annual',
    'active',
    v_admin_user_id,
    v_admin_user_id
  ) RETURNING id INTO v_control_db_localization;
  
  -- Контроль для СКЗИ-Передача
  INSERT INTO controls (id, tenant_id, code, title, description, control_type, category, frequency, status, owner_id, created_by)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'CTRL-SKZI-Cert',
    'Сертификация СКЗИ',
    'Получение и поддержание сертификатов ФСБ России на используемые средства криптографической защиты.',
    'administrative',
    'Криптографическая защита',
    'annual',
    'active',
    v_admin_user_id,
    v_admin_user_id
  ) RETURNING id INTO v_control_skzi_cert;

  -- ============================================================================
  -- 11. СВЯЗИ ТРЕБОВАНИЙ И КОНТРОЛЕЙ
  -- ============================================================================
  
  INSERT INTO control_mappings (tenant_id, control_id, requirement_id, mapping_type, coverage_percentage)
  VALUES 
    -- УПД.3 → Доверенная загрузка
    (v_tenant_id, v_control_trusted_boot, v_req_upd3, 'implements', 100),
    
    -- УПД.4 → RBAC
    (v_tenant_id, v_control_rbac, v_req_upd4, 'implements', 100),
    
    -- АУД.0 → Регламент аудита
    (v_tenant_id, v_control_audit_log, v_req_aud0, 'implements', 100),
    
    -- АУД.1 → Инвентаризация
    (v_tenant_id, v_control_inventory, v_req_aud1, 'implements', 100),
    
    -- АУД.2 → Управление уязвимостями
    (v_tenant_id, v_control_vulnerability, v_req_aud2, 'implements', 100),
    
    -- УЗ-1 → Политика ПДн
    (v_tenant_id, v_control_pdn_policy, v_req_pdn_uz1, 'implements', 80),
    (v_tenant_id, v_control_encryption, v_req_pdn_uz1, 'supports', 20),
    
    -- УЗ-2 → Политика ПДн
    (v_tenant_id, v_control_pdn_policy, v_req_pdn_uz2, 'implements', 100),
    
    -- ПДн-Согласие → Форма согласия
    (v_tenant_id, v_control_consent_form, v_req_pdn_consent, 'implements', 100),
    
    -- ПДн-Локализация → Локализация БД
    (v_tenant_id, v_control_db_localization, v_req_pdn_localization, 'implements', 100),
    
    -- СКЗИ-ГИС → Внедрение СКЗИ
    (v_tenant_id, v_control_encryption, v_req_skzi_gis, 'implements', 90),
    (v_tenant_id, v_control_skzi_cert, v_req_skzi_gis, 'supports', 10),
    
    -- СКЗИ-Передача → Внедрение СКЗИ
    (v_tenant_id, v_control_encryption, v_req_skzi_transmission, 'implements', 100);

  -- ============================================================================
  -- ИТОГОВАЯ СТАТИСТИКА
  -- ============================================================================
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Seed completed successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Regulators: %', (SELECT COUNT(*) FROM regulators WHERE tenant_id = v_tenant_id);
  RAISE NOTICE 'Frameworks: %', (SELECT COUNT(*) FROM regulatory_frameworks);
  RAISE NOTICE 'Categories: %', (SELECT COUNT(*) FROM requirement_categories WHERE tenant_id = v_tenant_id);
  RAISE NOTICE 'Requirements: %', (SELECT COUNT(*) FROM requirements WHERE tenant_id = v_tenant_id);
  RAISE NOTICE 'Controls: %', (SELECT COUNT(*) FROM controls WHERE tenant_id = v_tenant_id);
  RAISE NOTICE 'Mappings: %', (SELECT COUNT(*) FROM control_mappings WHERE tenant_id = v_tenant_id);
  RAISE NOTICE '============================================';
  
END $$;

-- Финальный SELECT для проверки
SELECT 
  'Russian Compliance 2025 data seeded successfully' as status,
  (SELECT COUNT(*) FROM requirements WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'tula-region')) as requirements_count,
  (SELECT COUNT(*) FROM controls WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'tula-region')) as controls_count,
  (SELECT COUNT(*) FROM control_mappings WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'tula-region')) as mappings_count;
