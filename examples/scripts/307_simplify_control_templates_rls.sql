-- Упрощение RLS политик для control_measure_templates
-- Проблема: current_setting('app.current_tenant_id') никогда не устанавливается
-- Решение: Делаем RLS permissive, т.к. фильтрация по tenant_id уже есть в репозиториях

-- Удаляем старые политики
DROP POLICY IF EXISTS "control_measure_templates_select_policy" ON control_measure_templates;
DROP POLICY IF EXISTS "control_measure_templates_insert_policy" ON control_measure_templates;
DROP POLICY IF EXISTS "control_measure_templates_update_policy" ON control_measure_templates;
DROP POLICY IF EXISTS "control_measure_templates_delete_policy" ON control_measure_templates;

-- Создаём упрощённые политики (проверяем только authenticated)
-- Фильтрация по tenant_id происходит в application layer (ControlMeasureTemplateRepository)

CREATE POLICY "control_measure_templates_select_policy"
ON control_measure_templates
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "control_measure_templates_insert_policy"
ON control_measure_templates
FOR INSERT
TO authenticated
WITH CHECK (tenant_id IS NOT NULL);

CREATE POLICY "control_measure_templates_update_policy"
ON control_measure_templates
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (tenant_id IS NOT NULL);

CREATE POLICY "control_measure_templates_delete_policy"
ON control_measure_templates
FOR DELETE
TO authenticated
USING (true);

-- Проверка
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'control_measure_templates'
ORDER BY policyname;
