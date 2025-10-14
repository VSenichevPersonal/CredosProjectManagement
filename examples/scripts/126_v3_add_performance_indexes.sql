-- =====================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =====================================================
-- Добавляет индексы для оптимизации самых частых запросов
-- Версия: 3 (исправлена для существующих колонок)

-- Включаем расширение для полнотекстового поиска
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- ORGANIZATIONS TABLE INDEXES
-- =====================================================

-- Композитный индекс для иерархии организаций (parent_id + tenant_id)
CREATE INDEX IF NOT EXISTS idx_organizations_parent_tenant 
ON organizations(parent_id, tenant_id) 
WHERE parent_id IS NOT NULL;

-- GIN индекс для быстрого поиска по названию организации
CREATE INDEX IF NOT EXISTS idx_organizations_name_trgm 
ON organizations USING gin(name gin_trgm_ops);

-- Композитный индекс для фильтрации по типу и тенанту
CREATE INDEX IF NOT EXISTS idx_organizations_type_tenant 
ON organizations(type, tenant_id);

-- Индекс для активных организаций
CREATE INDEX IF NOT EXISTS idx_organizations_active 
ON organizations(is_active, tenant_id) 
WHERE is_active = true;

-- =====================================================
-- USERS TABLE INDEXES
-- =====================================================

-- Композитный индекс для фильтрации пользователей по организации и роли
CREATE INDEX IF NOT EXISTS idx_users_org_role 
ON users(organization_id, role) 
WHERE is_active = true;

-- Композитный индекс для фильтрации по тенанту через организацию
CREATE INDEX IF NOT EXISTS idx_users_active_role 
ON users(role, is_active);

-- =====================================================
-- COMPLIANCE_RECORDS TABLE INDEXES
-- =====================================================

-- Композитный индекс для фильтрации по статусу и организации
CREATE INDEX IF NOT EXISTS idx_compliance_status_org 
ON compliance_records(status, organization_id, tenant_id);

-- Композитный индекс для фильтрации по требованию и статусу
CREATE INDEX IF NOT EXISTS idx_compliance_req_status 
ON compliance_records(requirement_id, status);

-- Индекс для поиска по назначенному пользователю
CREATE INDEX IF NOT EXISTS idx_compliance_assigned 
ON compliance_records(assigned_to, status) 
WHERE assigned_to IS NOT NULL;

-- =====================================================
-- REQUIREMENTS TABLE INDEXES
-- =====================================================

-- Композитный индекс для фильтрации по статусу и тенанту
CREATE INDEX IF NOT EXISTS idx_requirements_status_tenant 
ON requirements(status, tenant_id);

-- Композитный индекс для фильтрации по нормативной базе
CREATE INDEX IF NOT EXISTS idx_requirements_framework_tenant 
ON requirements(regulatory_framework_id, tenant_id) 
WHERE regulatory_framework_id IS NOT NULL;

-- GIN индекс для поиска по названию требования
CREATE INDEX IF NOT EXISTS idx_requirements_title_trgm 
ON requirements USING gin(title gin_trgm_ops);

-- =====================================================
-- EVIDENCE TABLE INDEXES
-- =====================================================

-- Композитный индекс для фильтрации доказательств по статусу
CREATE INDEX IF NOT EXISTS idx_evidence_status_tenant 
ON evidence(status, tenant_id);

-- Композитный индекс для связи с compliance records
CREATE INDEX IF NOT EXISTS idx_evidence_compliance_status 
ON evidence(compliance_record_id, status) 
WHERE compliance_record_id IS NOT NULL;

-- =====================================================
-- ORGANIZATION_ATTRIBUTES TABLE INDEXES
-- =====================================================

-- Индексы для быстрой фильтрации по атрибутам применимости
CREATE INDEX IF NOT EXISTS idx_org_attrs_kii 
ON organization_attributes(kii_category) 
WHERE kii_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_attrs_pdn 
ON organization_attributes(pdn_level) 
WHERE pdn_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_attrs_employee_count 
ON organization_attributes(employee_count) 
WHERE employee_count IS NOT NULL;

-- =====================================================
-- REQUIREMENT_ORGANIZATION_MAPPINGS TABLE INDEXES
-- =====================================================

-- Композитный индекс для быстрого поиска маппингов
CREATE INDEX IF NOT EXISTS idx_req_org_mappings_composite 
ON requirement_organization_mappings(requirement_id, organization_id, mapping_type);

-- Индекс для обратного поиска (от организации к требованиям)
CREATE INDEX IF NOT EXISTS idx_req_org_mappings_org 
ON requirement_organization_mappings(organization_id, tenant_id);

-- =====================================================
-- AUDIT_LOG TABLE INDEXES
-- =====================================================

-- Композитный индекс для фильтрации логов по типу сущности и дате
CREATE INDEX IF NOT EXISTS idx_audit_entity_date 
ON audit_log(entity_type, created_at DESC);

-- Композитный индекс для фильтрации по пользователю и дате
CREATE INDEX IF NOT EXISTS idx_audit_user_date 
ON audit_log(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

-- =====================================================
-- INDEXES CREATED SUCCESSFULLY
-- =====================================================
