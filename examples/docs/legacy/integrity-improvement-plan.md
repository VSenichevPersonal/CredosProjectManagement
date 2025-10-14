# План доработок для повышения целостности данных

## Приоритет 1: Критичные проблемы (немедленно)

### 1.1 Автоматический расчёт статусов соответствия
**Проблема:** Статусы `compliance_records` и `control_measures` не обновляются автоматически при изменении доказательств.

**Решение:**
- Создать функцию `calculate_measure_status(measure_id UUID)` для расчёта статуса меры
- Создать функцию `calculate_compliance_status(compliance_record_id UUID)` для агрегации статусов мер
- Добавить триггеры на `evidence_links` для автоматического пересчёта при изменениях
- Добавить триггеры на `evidence` для обновления статусов при изменении актуальности

**Файлы:**
\`\`\`sql
-- scripts/500_add_status_calculation_system.sql
CREATE OR REPLACE FUNCTION calculate_measure_completion(p_measure_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_required_count INT;
  v_provided_count INT;
  v_result JSONB;
BEGIN
  -- Получить количество требуемых типов доказательств из шаблона
  SELECT array_length(cmt.recommended_evidence_type_ids, 1)
  INTO v_required_count
  FROM control_measures cm
  JOIN control_measure_templates cmt ON cm.template_id = cmt.id
  WHERE cm.id = p_measure_id;
  
  -- Получить количество предоставленных типов доказательств
  SELECT COUNT(DISTINCT e.evidence_type_id)
  INTO v_provided_count
  FROM evidence_links el
  JOIN evidence e ON el.evidence_id = e.id
  WHERE el.control_measure_id = p_measure_id
    AND e.status = 'approved';
  
  v_result := jsonb_build_object(
    'required_count', COALESCE(v_required_count, 0),
    'provided_count', COALESCE(v_provided_count, 0),
    'completion_percentage', 
      CASE 
        WHEN COALESCE(v_required_count, 0) = 0 THEN 100
        ELSE (COALESCE(v_provided_count, 0)::FLOAT / v_required_count * 100)::INT
      END
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического обновления статусов
CREATE OR REPLACE FUNCTION trigger_update_compliance_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Обновить статус меры
  UPDATE control_measures cm
  SET 
    updated_at = NOW(),
    status = CASE
      WHEN (calculate_measure_completion(cm.id)->>'completion_percentage')::INT >= 100 THEN 'implemented'
      WHEN (calculate_measure_completion(cm.id)->>'completion_percentage')::INT > 0 THEN 'in_progress'
      ELSE 'planned'
    END
  WHERE cm.id = COALESCE(NEW.control_measure_id, OLD.control_measure_id);
  
  -- Обновить статус записи соответствия
  UPDATE compliance_records cr
  SET 
    updated_at = NOW(),
    status = CASE
      WHEN NOT EXISTS (
        SELECT 1 FROM control_measures cm2 
        WHERE cm2.compliance_record_id = cr.id 
          AND cm2.status != 'implemented'
      ) THEN 'compliant'
      WHEN EXISTS (
        SELECT 1 FROM control_measures cm2 
        WHERE cm2.compliance_record_id = cr.id 
          AND cm2.status = 'in_progress'
      ) THEN 'partial'
      ELSE 'non_compliant'
    END
  FROM control_measures cm
  WHERE cm.id = COALESCE(NEW.control_measure_id, OLD.control_measure_id)
    AND cm.compliance_record_id = cr.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Применить триггер к evidence_links
DROP TRIGGER IF EXISTS update_compliance_status_on_evidence_link ON evidence_links;
CREATE TRIGGER update_compliance_status_on_evidence_link
  AFTER INSERT OR UPDATE OR DELETE ON evidence_links
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_compliance_status();

-- Применить триггер к evidence (при изменении статуса)
DROP TRIGGER IF EXISTS update_compliance_status_on_evidence ON evidence;
CREATE TRIGGER update_compliance_status_on_evidence
  AFTER UPDATE OF status ON evidence
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_update_compliance_status();
\`\`\`

**Оценка:** 4 часа разработки + 2 часа тестирования

---

### 1.2 Валидация режимов мер (strict/flexible)
**Проблема:** Нет проверки, что в strict режиме нельзя создавать кастомные меры.

**Решение:**
- Добавить CHECK constraint на уровне БД
- Добавить валидацию в `ControlMeasureService`
- Добавить UI индикацию режима

**Файлы:**
\`\`\`sql
-- scripts/501_add_measure_mode_validation.sql

-- Функция для проверки режима мер
CREATE OR REPLACE FUNCTION validate_measure_mode()
RETURNS TRIGGER AS $$
DECLARE
  v_measure_mode TEXT;
BEGIN
  -- Получить режим мер из требования
  SELECT r.measure_mode INTO v_measure_mode
  FROM compliance_records cr
  JOIN requirements r ON cr.requirement_id = r.id
  WHERE cr.id = NEW.compliance_record_id;
  
  -- Если режим strict и мера не из шаблона - ошибка
  IF v_measure_mode = 'strict' AND NEW.template_id IS NULL THEN
    RAISE EXCEPTION 'Cannot create custom measures in strict mode for requirement';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_measure_mode_trigger ON control_measures;
CREATE TRIGGER validate_measure_mode_trigger
  BEFORE INSERT OR UPDATE ON control_measures
  FOR EACH ROW
  EXECUTE FUNCTION validate_measure_mode();

-- Добавить комментарий
COMMENT ON TRIGGER validate_measure_mode_trigger ON control_measures IS 
  'Prevents creation of custom measures when requirement is in strict mode';
\`\`\`

\`\`\`typescript
// services/control-measure-service.ts
static async validateMeasureCreation(
  ctx: ExecutionContext,
  complianceRecordId: string,
  templateId: string | null
): Promise<void> {
  const { data: compliance } = await ctx.db.supabase
    .from("compliance_records")
    .select("requirements(measure_mode)")
    .eq("id", complianceRecordId)
    .single();

  if (!compliance) {
    throw new Error("Compliance record not found");
  }

  const measureMode = compliance.requirements?.measure_mode;

  if (measureMode === "strict" && !templateId) {
    throw new ValidationError(
      "Cannot create custom measures in strict mode. Please use suggested templates."
    );
  }
}
\`\`\`

**Оценка:** 2 часа разработки + 1 час тестирования

---

### 1.3 Проверка типов доказательств при создании evidence_links
**Проблема:** Можно привязать доказательство неподходящего типа к мере.

**Решение:**
- Добавить CHECK constraint для проверки соответствия типа доказательства
- Добавить валидацию в `EvidenceLinkService`

**Файлы:**
\`\`\`sql
-- scripts/502_add_evidence_type_validation.sql

-- Функция для проверки типа доказательства
CREATE OR REPLACE FUNCTION validate_evidence_type_for_measure()
RETURNS TRIGGER AS $$
DECLARE
  v_evidence_type_id UUID;
  v_allowed_types UUID[];
BEGIN
  -- Получить тип доказательства
  SELECT evidence_type_id INTO v_evidence_type_id
  FROM evidence
  WHERE id = NEW.evidence_id;
  
  -- Получить разрешённые типы из шаблона меры
  SELECT cmt.recommended_evidence_type_ids INTO v_allowed_types
  FROM control_measures cm
  JOIN control_measure_templates cmt ON cm.template_id = cmt.id
  WHERE cm.id = NEW.control_measure_id;
  
  -- Если есть ограничения и тип не подходит - ошибка
  IF v_allowed_types IS NOT NULL 
     AND array_length(v_allowed_types, 1) > 0 
     AND NOT (v_evidence_type_id = ANY(v_allowed_types)) THEN
    RAISE EXCEPTION 'Evidence type % is not allowed for this measure. Allowed types: %', 
      v_evidence_type_id, v_allowed_types;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_evidence_type_trigger ON evidence_links;
CREATE TRIGGER validate_evidence_type_trigger
  BEFORE INSERT OR UPDATE ON evidence_links
  FOR EACH ROW
  EXECUTE FUNCTION validate_evidence_type_for_measure();
\`\`\`

**Оценка:** 2 часа разработки + 1 час тестирования

---

## Приоритет 2: Важные улучшения (1-2 недели)

### 2.1 Добавить недостающие индексы для производительности
**Проблема:** Медленные запросы при фильтрации и поиске.

**Решение:**
\`\`\`sql
-- scripts/503_add_performance_indexes_and_constraints.sql

-- Индексы для быстрого поиска записей соответствия
CREATE INDEX IF NOT EXISTS idx_compliance_records_requirement_org 
  ON compliance_records(requirement_id, organization_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_compliance_records_status 
  ON compliance_records(status, tenant_id) 
  WHERE deleted_at IS NULL;

-- Индексы для мер
CREATE INDEX IF NOT EXISTS idx_control_measures_compliance_status 
  ON control_measures(compliance_record_id, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_control_measures_template 
  ON control_measures(template_id, tenant_id) 
  WHERE deleted_at IS NULL;

-- Индексы для доказательств
CREATE INDEX IF NOT EXISTS idx_evidence_org_type 
  ON evidence(organization_id, evidence_type_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_evidence_status 
  ON evidence(status, tenant_id) 
  WHERE deleted_at IS NULL;

-- Индексы для evidence_links
CREATE INDEX IF NOT EXISTS idx_evidence_links_measure 
  ON evidence_links(control_measure_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_evidence_links_evidence 
  ON evidence_links(evidence_id) 
  WHERE deleted_at IS NULL;

-- Составной индекс для проверки дубликатов
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_links_unique 
  ON evidence_links(evidence_id, control_measure_id) 
  WHERE deleted_at IS NULL;

-- Индексы для требований
CREATE INDEX IF NOT EXISTS idx_requirements_framework 
  ON requirements(regulatory_framework_id, tenant_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_requirements_code 
  ON requirements(code, tenant_id) 
  WHERE deleted_at IS NULL;

-- GIN индексы для массивов
CREATE INDEX IF NOT EXISTS idx_requirements_templates_gin 
  ON requirements USING GIN(suggested_control_measure_template_ids);

CREATE INDEX IF NOT EXISTS idx_control_templates_evidence_gin 
  ON control_measure_templates USING GIN(recommended_evidence_type_ids);

-- Анализ таблиц для обновления статистики
ANALYZE compliance_records;
ANALYZE control_measures;
ANALYZE evidence;
ANALYZE evidence_links;
ANALYZE requirements;
\`\`\`

**Оценка:** 1 час разработки + 2 часа тестирования производительности

---

### 2.2 Добавить audit trail для критичных изменений
**Проблема:** Нет истории изменений статусов и доказательств.

**Решение:**
\`\`\`sql
-- scripts/504_add_audit_trail.sql

-- Таблица для аудита изменений
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Что изменилось
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  
  -- Данные
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  
  -- Метаданные
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_log_record ON audit_log(table_name, record_id, created_at DESC);
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);

-- RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_tenant_isolation ON audit_log
  FOR SELECT
  USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE));

-- Функция для логирования изменений
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_changed_fields TEXT[];
BEGIN
  -- Получить tenant_id и user_id из контекста
  v_tenant_id := current_setting('app.current_tenant_id', TRUE)::UUID;
  v_user_id := current_setting('app.current_user_id', TRUE)::UUID;
  
  -- Определить изменённые поля
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(key)
    INTO v_changed_fields
    FROM jsonb_each(to_jsonb(NEW))
    WHERE to_jsonb(NEW)->key IS DISTINCT FROM to_jsonb(OLD)->key;
  END IF;
  
  -- Записать в audit_log
  INSERT INTO audit_log (
    tenant_id,
    user_id,
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_fields
  ) VALUES (
    v_tenant_id,
    v_user_id,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    v_changed_fields
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Применить к критичным таблицам
CREATE TRIGGER audit_compliance_records
  AFTER INSERT OR UPDATE OR DELETE ON compliance_records
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_control_measures
  AFTER INSERT OR UPDATE OR DELETE ON control_measures
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_evidence
  AFTER INSERT OR UPDATE OR DELETE ON evidence
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_evidence_links
  AFTER INSERT OR UPDATE OR DELETE ON evidence_links
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
\`\`\`

**Оценка:** 3 часа разработки + 2 часа тестирования

---

### 2.3 Добавить валидацию уникальности записей соответствия
**Проблема:** Можно создать несколько записей соответствия для одного требования и организации.

**Решение:**
\`\`\`sql
-- scripts/505_add_uniqueness_constraints.sql

-- Уникальность записи соответствия
CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_records_unique
  ON compliance_records(requirement_id, organization_id, tenant_id)
  WHERE deleted_at IS NULL;

-- Уникальность меры в рамках записи соответствия
CREATE UNIQUE INDEX IF NOT EXISTS idx_control_measures_unique
  ON control_measures(compliance_record_id, template_id)
  WHERE deleted_at IS NULL AND template_id IS NOT NULL;

-- Уникальность связи доказательства с мерой (уже есть, но проверим)
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_links_unique_pair
  ON evidence_links(evidence_id, control_measure_id)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_compliance_records_unique IS 
  'Ensures one compliance record per requirement per organization';
COMMENT ON INDEX idx_control_measures_unique IS 
  'Prevents duplicate measures from same template in one compliance record';
\`\`\`

**Оценка:** 1 час разработки + 1 час тестирования

---

### 2.4 Добавить каскадное удаление и архивацию
**Проблема:** При удалении требования остаются "осиротевшие" записи соответствия.

**Решение:**
\`\`\`sql
-- scripts/506_add_cascade_rules.sql

-- Изменить внешние ключи для каскадного soft delete
ALTER TABLE compliance_records
  DROP CONSTRAINT IF EXISTS compliance_records_requirement_id_fkey,
  ADD CONSTRAINT compliance_records_requirement_id_fkey
    FOREIGN KEY (requirement_id) 
    REFERENCES requirements(id)
    ON DELETE RESTRICT; -- Запретить удаление требования с активными записями

ALTER TABLE control_measures
  DROP CONSTRAINT IF EXISTS control_measures_compliance_record_id_fkey,
  ADD CONSTRAINT control_measures_compliance_record_id_fkey
    FOREIGN KEY (compliance_record_id)
    REFERENCES compliance_records(id)
    ON DELETE CASCADE; -- При удалении записи удалить меры

ALTER TABLE evidence_links
  DROP CONSTRAINT IF EXISTS evidence_links_control_measure_id_fkey,
  ADD CONSTRAINT evidence_links_control_measure_id_fkey
    FOREIGN KEY (control_measure_id)
    REFERENCES control_measures(id)
    ON DELETE CASCADE; -- При удалении меры удалить связи

-- Функция для архивации требования
CREATE OR REPLACE FUNCTION archive_requirement(p_requirement_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Проверить, есть ли активные записи соответствия
  IF EXISTS (
    SELECT 1 FROM compliance_records 
    WHERE requirement_id = p_requirement_id 
      AND deleted_at IS NULL
      AND status IN ('compliant', 'partial', 'in_progress')
  ) THEN
    RAISE EXCEPTION 'Cannot archive requirement with active compliance records';
  END IF;
  
  -- Архивировать требование
  UPDATE requirements
  SET deleted_at = NOW()
  WHERE id = p_requirement_id;
  
  -- Архивировать все связанные записи соответствия
  UPDATE compliance_records
  SET deleted_at = NOW()
  WHERE requirement_id = p_requirement_id
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
\`\`\`

**Оценка:** 2 часа разработки + 2 часа тестирования

---

## Приоритет 3: Оптимизации и улучшения UX (2-4 недели)

### 3.1 Добавить материализованные представления для дашбордов
**Проблема:** Медленные запросы для статистики и отчётов.

**Решение:**
\`\`\`sql
-- scripts/507_add_materialized_views.sql

-- Статистика по организациям
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_organization_compliance_stats AS
SELECT 
  o.id AS organization_id,
  o.name AS organization_name,
  o.tenant_id,
  COUNT(DISTINCT cr.id) AS total_compliance_records,
  COUNT(DISTINCT cr.id) FILTER (WHERE cr.status = 'compliant') AS compliant_count,
  COUNT(DISTINCT cr.id) FILTER (WHERE cr.status = 'partial') AS partial_count,
  COUNT(DISTINCT cr.id) FILTER (WHERE cr.status = 'non_compliant') AS non_compliant_count,
  COUNT(DISTINCT cm.id) AS total_measures,
  COUNT(DISTINCT cm.id) FILTER (WHERE cm.status = 'implemented') AS implemented_measures,
  COUNT(DISTINCT e.id) AS total_evidence,
  MAX(cr.updated_at) AS last_updated
FROM organizations o
LEFT JOIN compliance_records cr ON cr.organization_id = o.id AND cr.deleted_at IS NULL
LEFT JOIN control_measures cm ON cm.compliance_record_id = cr.id AND cm.deleted_at IS NULL
LEFT JOIN evidence_links el ON el.control_measure_id = cm.id AND el.deleted_at IS NULL
LEFT JOIN evidence e ON e.id = el.evidence_id AND e.deleted_at IS NULL
WHERE o.deleted_at IS NULL
GROUP BY o.id, o.name, o.tenant_id;

-- Индексы для быстрого доступа
CREATE UNIQUE INDEX idx_mv_org_stats_org ON mv_organization_compliance_stats(organization_id);
CREATE INDEX idx_mv_org_stats_tenant ON mv_organization_compliance_stats(tenant_id);

-- Функция для обновления статистики
CREATE OR REPLACE FUNCTION refresh_compliance_stats()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_organization_compliance_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Автоматическое обновление каждый час
-- (требует pg_cron extension)
-- SELECT cron.schedule('refresh-compliance-stats', '0 * * * *', 'SELECT refresh_compliance_stats()');
\`\`\`

**Оценка:** 4 часа разработки + 2 часа тестирования

---

### 3.2 Добавить полнотекстовый поиск
**Проблема:** Медленный поиск по требованиям и мерам.

**Решение:**
\`\`\`sql
-- scripts/508_add_fulltext_search.sql

-- Добавить tsvector колонки
ALTER TABLE requirements 
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

ALTER TABLE control_measure_templates 
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Функция для обновления search_vector
CREATE OR REPLACE FUNCTION update_requirements_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('russian', COALESCE(NEW.code, '')), 'A') ||
    setweight(to_tsvector('russian', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('russian', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_requirements_search_vector_trigger
  BEFORE INSERT OR UPDATE ON requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_requirements_search_vector();

-- GIN индекс для быстрого поиска
CREATE INDEX idx_requirements_search ON requirements USING GIN(search_vector);

-- Обновить существующие записи
UPDATE requirements SET search_vector = 
  setweight(to_tsvector('russian', COALESCE(code, '')), 'A') ||
  setweight(to_tsvector('russian', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('russian', COALESCE(description, '')), 'B');
\`\`\`

**Оценка:** 3 часа разработки + 2 часа тестирования

---

### 3.3 Добавить уведомления о критичных событиях
**Проблема:** Пользователи не знают об изменениях статусов.

**Решение:**
\`\`\`sql
-- scripts/509_add_notifications_system.sql

-- Таблица уведомлений
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Тип уведомления
  type TEXT NOT NULL CHECK (type IN (
    'compliance_status_changed',
    'measure_completed',
    'evidence_approved',
    'evidence_rejected',
    'requirement_assigned'
  )),
  
  -- Данные
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  metadata JSONB,
  
  -- Статус
  read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_user_access ON notifications
  FOR ALL
  USING (
    user_id::TEXT = current_setting('app.current_user_id', TRUE)
    AND tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE)
  );

-- Функция для создания уведомления
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Получить tenant_id пользователя
  SELECT tenant_id INTO v_tenant_id
  FROM users
  WHERE id = p_user_id;
  
  INSERT INTO notifications (
    tenant_id,
    user_id,
    type,
    title,
    message,
    link,
    metadata
  ) VALUES (
    v_tenant_id,
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_metadata
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для уведомлений о изменении статуса
CREATE OR REPLACE FUNCTION notify_compliance_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_responsible_user_id UUID;
  v_requirement_title TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Получить ответственного пользователя
    SELECT responsible_user_id INTO v_responsible_user_id
    FROM compliance_records
    WHERE id = NEW.id;
    
    -- Получить название требования
    SELECT title INTO v_requirement_title
    FROM requirements r
    JOIN compliance_records cr ON cr.requirement_id = r.id
    WHERE cr.id = NEW.id;
    
    IF v_responsible_user_id IS NOT NULL THEN
      PERFORM create_notification(
        v_responsible_user_id,
        'compliance_status_changed',
        'Изменён статус соответствия',
        format('Статус требования "%s" изменён с "%s" на "%s"', 
          v_requirement_title, OLD.status, NEW.status),
        format('/compliance/%s', NEW.id),
        jsonb_build_object(
          'compliance_record_id', NEW.id,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_compliance_status_change_trigger
  AFTER UPDATE OF status ON compliance_records
  FOR EACH ROW
  EXECUTE FUNCTION notify_compliance_status_change();
\`\`\`

**Оценка:** 6 часов разработки + 3 часа тестирования

---

## Приоритет 4: Долгосрочные улучшения (1-2 месяца)

### 4.1 Добавить версионирование требований
**Проблема:** При изменении требования теряется история.

**Решение:**
- Создать таблицу `requirement_versions`
- Добавить триггер для автоматического создания версий
- Добавить UI для просмотра истории изменений

**Оценка:** 8 часов разработки + 4 часа тестирования

---

### 4.2 Добавить экспорт отчётов
**Проблема:** Нет возможности выгрузить данные для аудита.

**Решение:**
- Создать API endpoints для экспорта в PDF/Excel
- Добавить шаблоны отчётов
- Добавить UI для генерации отчётов

**Оценка:** 16 часов разработки + 4 часа тестирования

---

### 4.3 Добавить интеграцию с внешними системами
**Проблема:** Нет автоматической синхронизации с 1С.

**Решение:**
- Создать API для интеграции
- Добавить webhook'и для уведомлений
- Добавить планировщик задач для синхронизации

**Оценка:** 24 часа разработки + 8 часов тестирования

---

## Статус выполнения (обновлено 2025-01-10)

### ✅ Завершённые задачи

| Задача | Скрипт | Статус | Дата |
|--------|--------|--------|------|
| 1.1 Автоматический расчёт статусов | 500_add_status_calculation_system.sql | ✅ Выполнено | 2025-01-10 |
| 1.2 Валидация режимов мер | 501_add_measure_mode_validation.sql | ✅ Выполнено | 2025-01-10 |
| 1.3 Проверка типов доказательств | 502_add_evidence_type_validation.sql | ✅ Выполнено | 2025-01-10 |
| 2.1 Индексы производительности | 503_add_performance_indexes_and_constraints.sql | ✅ Выполнено | 2025-01-10 |
| - Исправление RLS users | 410_fix_users_rls_bootstrap.sql, 420_fix_users_rls_final.sql | ✅ Выполнено | 2025-01-10 |
| - Маппинг полей мер | ControlMeasureService.createFromTemplate | ✅ Выполнено | 2025-01-10 |
| - Автосоздание мер | ComplianceService.assignRequirementToOrganizations | ✅ Выполнено | 2025-01-10 |
| - API синхронизации мер | /api/compliance/[id]/sync-measures | ✅ Выполнено | 2025-01-10 |

### 🔄 В процессе

| Задача | Проблема | Решение |
|--------|----------|---------|
| Заполнение шаблонов мер | Требования имеют пустые `suggested_control_measure_template_ids` | Создать UI для управления шаблонами |
| Синхронизация существующих записей | Записи соответствия созданы без мер | Использовать API /api/compliance/[id]/sync-measures |

### ⏳ Ожидают выполнения

**Приоритет 2: Важные улучшения**
- 2.2 Audit trail (5 часов)
- 2.3 Уникальность записей (2 часа) - частично выполнено
- 2.4 Каскадное удаление (4 часа)

**Приоритет 3: Оптимизации**
- 3.1 Материализованные представления (6 часов)
- 3.2 Полнотекстовый поиск (5 часов)
- 3.3 Система уведомлений (9 часов)

**Приоритет 4: Долгосрочные**
- 4.1 Версионирование требований (12 часов)
- 4.2 Экспорт отчётов (20 часов)
- 4.3 Интеграция с 1С (32 часа)

---

## Новые задачи (добавлено 2025-01-10)

### N.1 UI для управления шаблонами мер в требованиях
**Проблема:** Нет интерфейса для добавления/редактирования `suggested_control_measure_template_ids` в требованиях.

**Решение:**
- Создать компонент `RequirementTemplatesTab` для управления шаблонами мер
- Добавить drag-and-drop для изменения порядка шаблонов
- Добавить поиск и фильтрацию шаблонов мер
- Добавить preview шаблона перед добавлением

**Файлы:**
\`\`\`typescript
// components/requirements/requirement-templates-tab.tsx
export function RequirementTemplatesTab({ requirement }: { requirement: Requirement }) {
  const [templates, setTemplates] = useState<ControlMeasureTemplate[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(
    requirement.suggestedControlMeasureTemplateIds || []
  );

  // Загрузить все доступные шаблоны
  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleAddTemplate = async (templateId: string) => {
    const updated = [...selectedTemplates, templateId];
    await updateRequirement(requirement.id, {
      suggested_control_measure_template_ids: updated
    });
    setSelectedTemplates(updated);
  };

  const handleRemoveTemplate = async (templateId: string) => {
    const updated = selectedTemplates.filter(id => id !== templateId);
    await updateRequirement(requirement.id, {
      suggested_control_measure_template_ids: updated
    });
    setSelectedTemplates(updated);
  };

  return (
    <div>
      <h3>Типовые меры защиты</h3>
      <TemplateSelector
        availableTemplates={templates}
        selectedTemplates={selectedTemplates}
        onAdd={handleAddTemplate}
        onRemove={handleRemoveTemplate}
      />
    </div>
  );
}
\`\`\`

**Оценка:** 6 часов разработки + 2 часа тестирования

---

### N.2 Bulk-операции для назначения требований
**Проблема:** Назначение требований организациям происходит по одной, что медленно для больших объёмов.

**Решение:**
- Создать API endpoint `/api/requirements/bulk-assign`
- Добавить UI для множественного выбора организаций
- Добавить прогресс-бар для отслеживания процесса
- Добавить обработку ошибок и retry логику

**Файлы:**
\`\`\`typescript
// app/api/requirements/bulk-assign/route.ts
export async function POST(request: Request) {
  const { requirementIds, organizationIds, measureMode } = await request.json();
  
  const results = [];
  for (const reqId of requirementIds) {
    for (const orgId of organizationIds) {
      try {
        const result = await ComplianceService.assignRequirementToOrganizations(
          ctx,
          reqId,
          [orgId],
          measureMode
        );
        results.push({ requirementId: reqId, organizationId: orgId, success: true });
      } catch (error) {
        results.push({ 
          requirementId: reqId, 
          organizationId: orgId, 
          success: false, 
          error: error.message 
        });
      }
    }
  }
  
  return Response.json({ results });
}
\`\`\`

**Оценка:** 4 часа разработки + 2 часа тестирования

---

### N.3 Миграция данных для существующих записей
**Проблема:** Существующие записи соответствия созданы без мер.

**Решение:**
- Создать скрипт для массовой синхронизации мер
- Добавить UI для запуска миграции
- Добавить отчёт о результатах миграции

**Файлы:**
\`\`\`sql
-- scripts/510_migrate_existing_compliance_records.sql

-- Функция для синхронизации мер для всех записей соответствия
CREATE OR REPLACE FUNCTION sync_all_compliance_measures()
RETURNS TABLE (
  compliance_record_id UUID,
  measures_created INT,
  status TEXT
) AS $$
DECLARE
  v_record RECORD;
  v_measures_created INT;
BEGIN
  FOR v_record IN 
    SELECT 
      cr.id,
      cr.requirement_id,
      cr.organization_id,
      r.suggested_control_measure_template_ids,
      r.measure_mode
    FROM compliance_records cr
    JOIN requirements r ON cr.requirement_id = r.id
    WHERE r.suggested_control_measure_template_ids IS NOT NULL
      AND array_length(r.suggested_control_measure_template_ids, 1) > 0
  LOOP
    -- Подсчитать существующие меры
    SELECT COUNT(*) INTO v_measures_created
    FROM control_measures
    WHERE compliance_record_id = v_record.id;
    
    -- Если мер нет - создать из шаблонов
    IF v_measures_created = 0 THEN
      -- Создать меры из шаблонов
      INSERT INTO control_measures (
        tenant_id,
        compliance_record_id,
        requirement_id,
        organization_id,
        template_id,
        title,
        description,
        implementation_notes,
        status,
        from_template,
        is_locked,
        created_by
      )
      SELECT 
        v_record.tenant_id,
        v_record.id,
        v_record.requirement_id,
        v_record.organization_id,
        cmt.id,
        cmt.title,
        cmt.description,
        cmt.implementation_guide,
        'planned',
        true,
        CASE WHEN v_record.measure_mode = 'strict' THEN true ELSE false END,
        current_setting('app.current_user_id', TRUE)::UUID
      FROM control_measure_templates cmt
      WHERE cmt.id = ANY(v_record.suggested_control_measure_template_ids);
      
      GET DIAGNOSTICS v_measures_created = ROW_COUNT;
      
      RETURN QUERY SELECT 
        v_record.id,
        v_measures_created,
        'success'::TEXT;
    ELSE
      RETURN QUERY SELECT 
        v_record.id,
        v_measures_created,
        'skipped'::TEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Запустить миграцию
SELECT * FROM sync_all_compliance_measures();
\`\`\`

**Оценка:** 3 часа разработки + 2 часа тестирования

---

## Обновлённая сводная таблица приоритетов

| Приоритет | Задача | Оценка времени | Статус | Критичность |
|-----------|--------|----------------|--------|-------------|
| 1.1 | Автоматический расчёт статусов | 6 часов | ✅ Выполнено | 🔴 Критично |
| 1.2 | Валидация режимов мер | 3 часа | ✅ Выполнено | 🔴 Критично |
| 1.3 | Проверка типов доказательств | 3 часа | ✅ Выполнено | 🔴 Критично |
| N.1 | UI для управления шаблонами | 8 часов | ⏳ Ожидает | 🔴 Критично |
| N.2 | Bulk-операции назначения | 6 часов | ⏳ Ожидает | 🟡 Важно |
| N.3 | Миграция существующих записей | 5 часов | ⏳ Ожидает | 🟡 Важно |
| 2.1 | Индексы производительности | 3 часа | ✅ Выполнено | 🟡 Важно |
| 2.2 | Audit trail | 5 часов | ⏳ Ожидает | 🟡 Важно |
| 2.3 | Уникальность записей | 2 часа | ✅ Частично | 🟡 Важно |
| 2.4 | Каскадное удаление | 4 часа | ⏳ Ожидает | 🟡 Важно |
| 3.1 | Материализованные представления | 6 часов | ⏳ Ожидает | 🟢 Желательно |
| 3.2 | Полнотекстовый поиск | 5 часов | ⏳ Ожидает | 🟢 Желательно |
| 3.3 | Система уведомлений | 9 часов | ⏳ Ожидает | 🟢 Желательно |
| 4.1 | Версионирование требований | 12 часов | ⏳ Ожидает | ⚪ Долгосрочно |
| 4.2 | Экспорт отчётов | 20 часов | ⏳ Ожидает | ⚪ Долгосрочно |
| 4.3 | Интеграция с 1С | 32 часа | ⏳ Ожидает | ⚪ Долгосрочно |

**Прогресс Приоритета 1:** 3/3 задачи выполнено (100%)
**Прогресс Приоритета 2:** 1/4 задачи выполнено (25%)
**Прогресс новых задач:** 0/3 задачи выполнено (0%)

**Общий прогресс:** 4/10 критичных и важных задач выполнено (40%)
