-- Исправление: сделать tenant_id nullable для глобальных требований
-- Требования применяются к разным организациям через систему applicability

ALTER TABLE requirements 
ALTER COLUMN tenant_id DROP NOT NULL;

COMMENT ON COLUMN requirements.tenant_id IS 'Nullable для глобальных требований, которые применяются к разным организациям через систему applicability';
