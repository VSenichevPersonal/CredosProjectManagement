/**
 * Script: Seed recommendation rules
 * Version: Stage 14.4
 * Purpose: Seed system recommendation rules for all tenants
 */

-- Insert system recommendation rules (will be copied for each tenant)

-- Rule 1: Critical requirements low completion
INSERT INTO recommendation_rules (
  code, name, description, category,
  condition_type, condition_field, condition_operator, condition_value,
  priority, title_template, description_template, action_template,
  deadline_days, estimated_budget_min, estimated_budget_max, legal_basis,
  is_active, is_system_rule, sort_order
) VALUES (
  'CRITICAL_REQ_LOW',
  'Низкое выполнение критических требований',
  'Срабатывает когда процент выполнения критических требований ниже порога',
  'critical_requirements',
  'percentage', 'criticalCompletionRate', '<', 80.00,
  'critical',
  'Критические требования не выполнены',
  'Выполнено только {criticalCompletionRate}% критических требований. Это создаёт высокий риск для организации и может привести к санкциям регуляторов.',
  'Срочно выделить ресурсы на устранение критических пробелов. Рекомендуемый бюджет: {estimatedBudget} руб. Назначить ответственных и установить еженедельный контроль выполнения.',
  30, 500000, 1500000, 'Приказ ФСТЭК №239, 187-ФЗ',
  true, true, 10
) ON CONFLICT (code) DO NOTHING;

-- Rule 2: Many overdue requirements
INSERT INTO recommendation_rules (
  code, name, description, category,
  condition_type, condition_field, condition_operator, condition_value,
  priority, title_template, description_template, action_template,
  deadline_days, estimated_budget_min, estimated_budget_max, legal_basis,
  is_active, is_system_rule, sort_order
) VALUES (
  'OVERDUE_COUNT_HIGH',
  'Множественные просрочки требований',
  'Срабатывает когда количество просроченных требований превышает порог',
  'overdue',
  'count', 'overdueCount', '>', 10.00,
  'high',
  'Множественные просрочки по требованиям',
  'Просрочено {overdueCount} требований более чем на 30 дней. Это указывает на системные проблемы в процессах комплаенса.',
  'Провести анализ причин просрочек. Пересмотреть распределение ответственности и ресурсов. Установить реалистичные сроки с учётом текущей загрузки команды. Рассмотреть привлечение внешних консультантов.',
  14, 200000, 800000, '187-ФЗ, внутренние политики',
  true, true, 20
) ON CONFLICT (code) DO NOTHING;

-- Rule 3: Organizations without responsible person
INSERT INTO recommendation_rules (
  code, name, description, category,
  condition_type, condition_field, condition_operator, condition_value,
  priority, title_template, description_template, action_template,
  deadline_days, estimated_budget_min, estimated_budget_max, legal_basis,
  is_active, is_system_rule, sort_order
) VALUES (
  'NO_RESPONSIBLE_PERSON',
  'Отсутствуют ответственные за ИБ',
  'Срабатывает когда есть организации без назначенного ответственного за ИБ',
  'missing_responsible',
  'count', 'orgsWithoutResponsible', '>', 0.00,
  'high',
  'Отсутствуют ответственные за информационную безопасность',
  'В {orgsWithoutResponsible} организациях не назначены ответственные за обеспечение безопасности информации. Это прямое нарушение требований 187-ФЗ и может привести к штрафам.',
  'Издать приказы о назначении ответственных за ИБ в каждой организации. Провести инструктаж назначенных лиц. Направить копии приказов регулятору. Организовать обучение ответственных лиц.',
  7, 50000, 200000, '187-ФЗ ст. 9, Приказ ФСТЭК №239',
  true, true, 15
) ON CONFLICT (code) DO NOTHING;

-- Rule 4: Low evidence coverage
INSERT INTO recommendation_rules (
  code, name, description, category,
  condition_type, condition_field, condition_operator, condition_value,
  priority, title_template, description_template, action_template,
  deadline_days, estimated_budget_min, estimated_budget_max, legal_basis,
  is_active, is_system_rule, sort_order
) VALUES (
  'EVIDENCE_COVERAGE_LOW',
  'Недостаточное покрытие доказательствами',
  'Срабатывает когда процент мер с доказательствами ниже порога',
  'evidence_coverage',
  'percentage', 'evidenceCoverage', '<', 60.00,
  'medium',
  'Недостаточно подтверждающих документов',
  'Только {evidenceCoverage}% мер контроля имеют подтверждающие доказательства. Без документальных доказательств невозможно продемонстрировать соответствие регуляторам.',
  'Организовать систематический сбор доказательств: приказы, политики безопасности, акты проверок, скриншоты настроек, журналы аудита. Назначить ответственных за сбор документов в каждой организации. Внедрить регламент документирования мер контроля.',
  30, 100000, 300000, 'Приказ ФСТЭК №17, методические рекомендации ФСТЭК',
  true, true, 30
) ON CONFLICT (code) DO NOTHING;

-- Rule 5: Weak regulator performance - FSTEC
INSERT INTO recommendation_rules (
  code, name, description, category,
  condition_type, condition_field, condition_operator, condition_value,
  priority, title_template, description_template, action_template,
  deadline_days, estimated_budget_min, estimated_budget_max, legal_basis,
  is_active, is_system_rule, sort_order
) VALUES (
  'FSTEC_PERFORMANCE_LOW',
  'Низкое выполнение требований ФСТЭК',
  'Срабатывает когда процент выполнения требований ФСТЭК ниже порога',
  'regulator_performance',
  'percentage', 'fstecCompletionRate', '<', 70.00,
  'high',
  'Низкий уровень соответствия требованиям ФСТЭК',
  'Выполнено только {fstecCompletionRate}% требований ФСТЭК. Для организаций КИИ это критично и может привести к приостановке деятельности.',
  'Провести срочный аудит требований ФСТЭК с привлечением аттестованных специалистов. Приоритет: Приказы №17, №31, №239. Разработать поэтапный план устранения несоответствий. Рассмотреть внедрение SIEM и DLP систем.',
  45, 1000000, 5000000, 'Приказ ФСТЭК №17, №31, №239, 187-ФЗ',
  true, true, 12
) ON CONFLICT (code) DO NOTHING;

-- Rule 6: Weak regulator performance - FSB
INSERT INTO recommendation_rules (
  code, name, description, category,
  condition_type, condition_field, condition_operator, condition_value,
  priority, title_template, description_template, action_template,
  deadline_days, estimated_budget_min, estimated_budget_max, legal_basis,
  is_active, is_system_rule, sort_order
) VALUES (
  'FSB_PERFORMANCE_LOW',
  'Низкое выполнение требований ФСБ',
  'Срабатывает когда процент выполнения требований ФСБ ниже порога',
  'regulator_performance',
  'percentage', 'fsbCompletionRate', '<', 70.00,
  'high',
  'Низкий уровень соответствия требованиям ФСБ',
  'Выполнено только {fsbCompletionRate}% требований ФСБ по защите конфиденциальной информации и криптографической защите.',
  'Провести аудит требований Приказа ФСБ №378-ПП и №382-ПП. Приоритет: требования к шифрованию, контролю доступа, аттестации. Проверить наличие лицензий на СКЗИ. Организовать обучение операторов средств криптографической защиты.',
  45, 800000, 3000000, 'Приказ ФСБ №378-ПП, №382-ПП',
  true, true, 13
) ON CONFLICT (code) DO NOTHING;

-- Rule 7: Weak regulator performance - Roskomnadzor
INSERT INTO recommendation_rules (
  code, name, description, category,
  condition_type, condition_field, condition_operator, condition_value,
  priority, title_template, description_template, action_template,
  deadline_days, estimated_budget_min, estimated_budget_max, legal_basis,
  is_active, is_system_rule, sort_order
) VALUES (
  'RKN_PERFORMANCE_LOW',
  'Низкое выполнение требований Роскомнадзор',
  'Срабатывает когда процент выполнения требований Роскомнадзор ниже порога',
  'regulator_performance',
  'percentage', 'roskomnadzorCompletionRate', '<', 70.00,
  'medium',
  'Низкий уровень соответствия требованиям по защите ПДн',
  'Выполнено только {roskomnadzorCompletionRate}% требований 152-ФЗ по защите персональных данных.',
  'Провести аудит соответствия 152-ФЗ. Актуализировать модель угроз и политику обработки ПДн. Проверить уведомление Роскомнадзора об обработке ПДн. Провести инвентаризацию ИСПДн. Организовать обучение операторов ПДн.',
  60, 300000, 1000000, '152-ФЗ, Постановление Правительства №1119',
  true, true, 25
) ON CONFLICT (code) DO NOTHING;

-- Rule 8: No risk assessment
INSERT INTO recommendation_rules (
  code, name, description, category,
  condition_type, condition_field, condition_operator, condition_value,
  priority, title_template, description_template, action_template,
  deadline_days, estimated_budget_min, estimated_budget_max, legal_basis,
  is_active, is_system_rule, sort_order
) VALUES (
  'NO_RISK_ASSESSMENT',
  'Отсутствует актуальная оценка рисков',
  'Срабатывает когда нет актуальной оценки рисков ИБ',
  'risk_management',
  'count', 'currentRiskAssessments', '==', 0.00,
  'high',
  'Не проведена оценка рисков информационной безопасности',
  'Отсутствует актуальная оценка рисков ИБ, что является нарушением требований большинства регуляторов.',
  'Провести оценку рисков ИБ по методологии ФСТЭК/ФСБ. Разработать модель угроз. Оценить актуальность угроз и уязвимости. Определить остаточные риски. Актуализировать меры защиты на основе результатов.',
  60, 400000, 1200000, 'Приказ ФСТЭК №239, методика оценки угроз ФСТЭК',
  true, true, 18
) ON CONFLICT (code) DO NOTHING;

-- Copy system rules to first tenant (if exists)
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get first tenant
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  
  IF v_tenant_id IS NOT NULL THEN
    -- Copy system rules to tenant
    INSERT INTO recommendation_rules (
      tenant_id, code, name, description, category,
      condition_type, condition_field, condition_operator, condition_value,
      priority, title_template, description_template, action_template,
      deadline_days, estimated_budget_min, estimated_budget_max, legal_basis,
      is_active, is_system_rule, sort_order
    )
    SELECT 
      v_tenant_id, code, name, description, category,
      condition_type, condition_field, condition_operator, condition_value,
      priority, title_template, description_template, action_template,
      deadline_days, estimated_budget_min, estimated_budget_max, legal_basis,
      is_active, is_system_rule, sort_order
    FROM recommendation_rules
    WHERE tenant_id IS NULL
    ON CONFLICT (code) DO NOTHING;
    
    RAISE NOTICE 'Copied system rules to tenant %', v_tenant_id;
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN recommendation_rules.condition_field IS 'Field to evaluate: criticalCompletionRate, overdueCount, evidenceCoverage, fstecCompletionRate, etc.';
COMMENT ON COLUMN recommendation_rules.title_template IS 'Template string with {placeholders} for dynamic values';
COMMENT ON COLUMN recommendation_rules.description_template IS 'Template string with {placeholders} for dynamic values';
COMMENT ON COLUMN recommendation_rules.action_template IS 'Template string with {placeholders} for dynamic values';

