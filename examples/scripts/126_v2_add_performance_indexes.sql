-- Миграция: Добавление индексов для оптимизации производительности
-- Версия 2: С установкой pg_trgm расширения

-- Установить расширение pg_trgm для полнотекстового поиска
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Индексы для таблицы organizations
-- 1. Композитный индекс для иерархии (parent_id + tenant_id)
CREATE INDEX IF NOT EXISTS idx_organizations_parent_tenant 
ON organizations(parent_id, tenant_id) 
WHERE parent_id IS NOT NULL;

-- 2. Индекс для поиска корневых организаций
CREATE INDEX IF NOT EXISTS idx_organizations_root_tenant 
ON organizations(tenant_id) 
WHERE parent_id IS NULL;

-- 3. GIN индекс для полнотекстового поиска по имени
CREATE INDEX IF NOT EXISTS idx_organizations_name_trgm 
ON organizations USING gin(name gin_trgm_ops);

-- 4. Композитный индекс для фильтрации по типу и тенанту
CREATE INDEX IF NOT EXISTS idx_organizations_type_tenant 
ON organizations(organization_type_id, tenant_id) 
WHERE organization_type_id IS NOT NULL;

-- Индексы для таблицы users
-- 5. Композитный индекс для фильтрации пользователей по организации и тенанту
CREATE INDEX IF NOT EXISTS idx_users_org_tenant 
ON users(organization_id, tenant_id) 
WHERE organization_id IS NOT NULL;

-- 6. Индекс для поиска по email (часто используется при логине)
CREATE INDEX IF NOT EXISTS idx_users_email_tenant 
ON users(email, tenant_id);

-- 7. Индекс для фильтрации по роли
CREATE INDEX IF NOT EXISTS idx_users_role_tenant 
ON users(role, tenant_id);

-- Индексы для таблицы compliance_records
-- 8. Композитный индекс для фильтрации по статусу и организации
CREATE INDEX IF NOT EXISTS idx_compliance_status_org 
ON compliance_records(status, organization_id, tenant_id);

-- 9. Индекс для поиска по требованию
CREATE INDEX IF NOT EXISTS idx_compliance_requirement_tenant 
ON compliance_records(requirement_id, tenant_id);

-- Индексы для таблицы requirements
-- 10. Композитный индекс для фильтрации по статусу и тенанту
CREATE INDEX IF NOT EXISTS idx_requirements_status_tenant 
ON requirements(status, tenant_id);

-- 11. Индекс для сортировки по дате создания
CREATE INDEX IF NOT EXISTS idx_requirements_created_tenant 
ON requirements(created_at DESC, tenant_id);

-- Добавить комментарии для документации
COMMENT ON INDEX idx_organizations_parent_tenant IS 'Оптимизация запросов иерархии организаций';
COMMENT ON INDEX idx_organizations_root_tenant IS 'Быстрый поиск корневых организаций';
COMMENT ON INDEX idx_organizations_name_trgm IS 'Полнотекстовый поиск по названию организации';
COMMENT ON INDEX idx_users_org_tenant IS 'Фильтрация пользователей по организации';
COMMENT ON INDEX idx_compliance_status_org IS 'Фильтрация записей соответствия по статусу';
