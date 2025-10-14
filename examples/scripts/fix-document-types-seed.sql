-- Fix: Re-seed regulatory document types for all tenants
-- This ensures the types are visible in the UI

DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  -- Loop through all tenants
  FOR tenant_record IN SELECT id FROM tenants WHERE is_active = true
  LOOP
    -- Insert document types if they don't exist
    INSERT INTO regulatory_document_types (id, tenant_id, code, name, description, icon, color, sort_order, is_active, is_system)
    VALUES
      (gen_random_uuid(), tenant_record.id, 'legislative', 'Законодательные', 'Федеральные законы, постановления правительства, приказы ведомств', 'scale', 'blue', 1, true, true),
      (gen_random_uuid(), tenant_record.id, 'internal', 'Внутренние', 'Внутренние политики, регламенты, инструкции организации', 'building', 'purple', 2, true, true),
      (gen_random_uuid(), tenant_record.id, 'qms', 'СМК (ISO, ГОСТ)', 'Стандарты систем менеджмента качества (ISO 27001, ISO 9001, ГОСТ Р и др.)', 'award', 'green', 3, true, true)
    ON CONFLICT (tenant_id, code) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Document types seeded for all tenants';
END $$;
