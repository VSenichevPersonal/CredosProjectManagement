-- Создание индексов для оптимизации производительности
-- Версия 5: Исправлены все несуществующие колонки

-- Включаем расширение pg_trgm для полнотекстового поиска
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- ORGANIZATIONS - Индексы для иерархии и поиска
-- ============================================

-- Композитный индекс для иерархии организаций (parent_id + tenant_id)
CREATE INDEX IF NOT EXISTS idx_organizations_parent_tenant 
ON organizations(parent_id, tenant_id) 
WHERE parent_id IS NOT NULL;

-- Индекс для полнотекстового поиска по названию
CREATE INDEX IF NOT EXISTS idx_organizations_name_trgm 
ON organizations USING gin(name gin_trgm_ops);

-- Индекс для связи с типом организации (справочник)
CREATE INDEX IF NOT EXISTS idx_organizations_type_id 
ON organizations(type_id) 
WHERE type_id IS NOT NULL;

-- Композитный индекс для фильтрации активных организаций по тенанту
CREATE INDEX IF NOT EXISTS idx_organizations_tenant_active 
ON organizations(tenant_id, created_at DESC);

-- ============================================
-- USERS - Индексы для фильтрации и поиска
-- ============================================

-- Композитный индекс для фильтрации пользователей по организации и роли
CREATE INDEX IF NOT EXISTS idx_users_org_role_tenant 
ON users(organization_id, role, tenant_id);

-- Индекс для поиска по email
CREATE INDEX IF NOT EXISTS idx_users_email_trgm 
ON users USING gin(email gin_trgm_ops);

-- Индекс для фильтрации активных пользователей
CREATE INDEX IF NOT EXISTS idx_users_tenant_active 
ON users(tenant_id, created_at DESC);

-- ============================================
-- REQUIREMENTS - Индексы для поиска и фильтрации
-- ============================================

-- Индекс для полнотекстового поиска по названию требования
CREATE INDEX IF NOT EXISTS idx_requirements_title_trgm 
ON requirements USING gin(title gin_trgm_ops);

-- Композитный индекс для фильтрации требований по тенанту и статусу
CREATE INDEX IF NOT EXISTS idx_requirements_tenant_status 
ON requirements(tenant_id, created_at DESC);

-- ============================================
-- COMPLIANCE_RECORDS - Индексы для статусов и фильтрации
-- ============================================

-- Композитный индекс для фильтрации записей соответствия
CREATE INDEX IF NOT EXISTS idx_compliance_req_org_tenant 
ON compliance_records(requirement_id, organization_id, tenant_id);

-- Индекс для фильтрации по статусу
CREATE INDEX IF NOT EXISTS idx_compliance_status_tenant 
ON compliance_records(status, tenant_id);

-- Индекс для сортировки по дате обновления
CREATE INDEX IF NOT EXISTS idx_compliance_updated 
ON compliance_records(updated_at DESC);

-- ============================================
-- AUDIT_LOG - Индексы для журнала аудита
-- ============================================

-- Композитный индекс для поиска по типу сущности и ID
CREATE INDEX IF NOT EXISTS idx_audit_entity_tenant 
ON audit_log(entity_type, entity_id, tenant_id);

-- Индекс для фильтрации по пользователю
CREATE INDEX IF NOT EXISTS idx_audit_user_tenant 
ON audit_log(user_id, tenant_id);

-- Индекс для сортировки по времени
CREATE INDEX IF NOT EXISTS idx_audit_created 
ON audit_log(created_at DESC);

-- ============================================
-- APPLICABILITY_RULES - Индексы для правил применимости
-- ============================================

-- Композитный индекс для поиска правил по требованию
CREATE INDEX IF NOT EXISTS idx_applicability_req_tenant 
ON applicability_rules(requirement_id, tenant_id);

-- Индекс для фильтрации активных правил
CREATE INDEX IF NOT EXISTS idx_applicability_active 
ON applicability_rules(is_active, tenant_id);

SELECT 'Performance indexes created successfully' as status;
