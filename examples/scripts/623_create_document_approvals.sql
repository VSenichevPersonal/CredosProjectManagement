-- =====================================================
-- МИГРАЦИЯ 623: WORKFLOW УТВЕРЖДЕНИЯ ДОКУМЕНТОВ
-- =====================================================
-- Многоступенчатое согласование и утверждение документов
-- Stage: 16
-- Дата: 13 октября 2025

-- =====================================================
-- 1. ENUM ДЛЯ СТАТУСА УТВЕРЖДЕНИЯ
-- =====================================================

DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM (
    'pending',        -- Ожидает начала
    'in_progress',    -- В процессе согласования
    'approved',       -- Утвержден
    'rejected',       -- Отклонен
    'cancelled'       -- Отменен
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. ТАБЛИЦА: document_approvals
-- =====================================================

CREATE TABLE document_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Что утверждается
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_id UUID REFERENCES document_versions(id) ON DELETE SET NULL,
  
  -- Тип workflow
  workflow_type VARCHAR(50) DEFAULT 'serial',  -- serial (последовательно), parallel (параллельно)
  
  -- Согласующие
  required_approvers UUID[],  -- Массив user_id кто должен согласовать
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 1,
  
  -- Статус
  status approval_status DEFAULT 'pending',
  
  -- Результаты
  approved_by UUID[],  -- Кто уже утвердил
  rejected_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  
  -- SLA
  due_date DATE,
  escalation_sent BOOLEAN DEFAULT false,
  
  -- Audit
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Индексы
CREATE INDEX idx_document_approvals_document ON document_approvals(document_id);
CREATE INDEX idx_document_approvals_status ON document_approvals(status);
CREATE INDEX idx_document_approvals_due_date ON document_approvals(due_date) 
  WHERE status IN ('pending', 'in_progress');

COMMENT ON TABLE document_approvals IS 'Workflow утверждения документов';

-- =====================================================
-- 3. ТАБЛИЦА: document_approval_steps
-- =====================================================

CREATE TABLE document_approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Связь с approval
  approval_id UUID NOT NULL REFERENCES document_approvals(id) ON DELETE CASCADE,
  
  -- Шаг
  step_number INTEGER NOT NULL,
  approver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approver_role VARCHAR(100),  -- CISO, CEO, Legal, etc (для отображения)
  
  -- Статус этого шага
  status approval_status DEFAULT 'pending',
  comments TEXT,
  
  -- Timestamps
  notified_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  
  UNIQUE(approval_id, step_number),
  UNIQUE(approval_id, approver_id)  -- Один человек не может быть дважды в одном approval
);

-- Индексы
CREATE INDEX idx_approval_steps_approval ON document_approval_steps(approval_id);
CREATE INDEX idx_approval_steps_approver ON document_approval_steps(approver_id);
CREATE INDEX idx_approval_steps_status ON document_approval_steps(status);
CREATE INDEX idx_approval_steps_pending ON document_approval_steps(approver_id, status) 
  WHERE status = 'pending';

COMMENT ON TABLE document_approval_steps IS 'Этапы согласования документа';

-- =====================================================
-- 4. ФУНКЦИЯ: Автоматическое продвижение workflow
-- =====================================================

CREATE OR REPLACE FUNCTION process_approval_step()
RETURNS TRIGGER AS $$
DECLARE
  v_approval RECORD;
  v_next_step RECORD;
BEGIN
  -- Получить approval
  SELECT * INTO v_approval
  FROM document_approvals
  WHERE id = NEW.approval_id;
  
  -- Если этот шаг утвержден
  IF NEW.status = 'approved' THEN
    
    -- Обновить approved_by в approval
    UPDATE document_approvals
    SET approved_by = array_append(approved_by, NEW.approver_id)
    WHERE id = NEW.approval_id;
    
    -- Если это был последний шаг
    IF NEW.step_number >= v_approval.total_steps THEN
      
      -- Завершить approval
      UPDATE document_approvals
      SET 
        status = 'approved',
        completed_at = NOW()
      WHERE id = NEW.approval_id;
      
      -- Утвердить документ
      UPDATE documents
      SET 
        approved_at = CURRENT_DATE,
        approved_by = NEW.approver_id,
        lifecycle_status = 'active'
      WHERE id = v_approval.document_id;
      
      RAISE NOTICE 'Document approved! All steps completed.';
      
    ELSE
      -- Перейти к следующему шагу (если serial)
      IF v_approval.workflow_type = 'serial' THEN
        SELECT * INTO v_next_step
        FROM document_approval_steps
        WHERE approval_id = NEW.approval_id
          AND step_number = NEW.step_number + 1;
        
        -- Уведомить следующего approver
        -- TODO: Создать notification
        RAISE NOTICE 'Moving to next step: %', NEW.step_number + 1;
      END IF;
    END IF;
    
  -- Если шаг отклонен
  ELSIF NEW.status = 'rejected' THEN
    
    -- Отклонить весь approval
    UPDATE document_approvals
    SET 
      status = 'rejected',
      rejected_by = NEW.approver_id,
      rejection_reason = NEW.comments,
      completed_at = NOW()
    WHERE id = NEW.approval_id;
    
    RAISE NOTICE 'Document rejected by %', NEW.approver_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_process_approval_step ON document_approval_steps;
CREATE TRIGGER trigger_process_approval_step
  AFTER UPDATE OF status ON document_approval_steps
  FOR EACH ROW
  WHEN (NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending')
  EXECUTE FUNCTION process_approval_step();

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

ALTER TABLE document_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_approval_steps ENABLE ROW LEVEL SECURITY;

-- Approvals: видят все своего тенанта
CREATE POLICY "Users can view approvals of their tenant" 
  ON document_approvals
  FOR SELECT TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Создавать могут все
CREATE POLICY "Users can create approvals for their tenant" 
  ON document_approvals
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Обновлять могут создатели или участники
CREATE POLICY "Users can update their approvals" 
  ON document_approvals
  FOR UPDATE TO authenticated
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::UUID AND
    (created_by = current_setting('app.current_user_id', true)::UUID OR
     current_setting('app.current_user_id', true)::UUID = ANY(required_approvers))
  );

-- Approval steps: участники видят свои шаги
CREATE POLICY "Approvers can view their steps" 
  ON document_approval_steps
  FOR SELECT TO authenticated
  USING (
    approver_id = current_setting('app.current_user_id', true)::UUID OR
    EXISTS (
      SELECT 1 FROM document_approvals da
      WHERE da.id = approval_id
        AND (
          da.created_by = current_setting('app.current_user_id', true)::UUID OR
          da.tenant_id = current_setting('app.current_tenant_id', true)::UUID
        )
    )
  );

-- Обновлять шаги могут только approvers
CREATE POLICY "Approvers can update their steps" 
  ON document_approval_steps
  FOR UPDATE TO authenticated
  USING (approver_id = current_setting('app.current_user_id', true)::UUID);

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Функция для запуска approval
CREATE OR REPLACE FUNCTION start_document_approval(
  p_document_id UUID,
  p_version_id UUID,
  p_approvers UUID[],
  p_workflow_type VARCHAR DEFAULT 'serial',
  p_due_date DATE DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_approval_id UUID;
  v_approver UUID;
  v_step_num INTEGER := 1;
BEGIN
  -- Создать approval
  INSERT INTO document_approvals (
    tenant_id,
    document_id,
    version_id,
    workflow_type,
    required_approvers,
    total_steps,
    due_date,
    created_by,
    started_at,
    status
  ) VALUES (
    (SELECT tenant_id FROM documents WHERE id = p_document_id),
    p_document_id,
    p_version_id,
    p_workflow_type,
    p_approvers,
    array_length(p_approvers, 1),
    p_due_date,
    p_created_by,
    NOW(),
    'in_progress'
  )
  RETURNING id INTO v_approval_id;
  
  -- Создать шаги для каждого approver
  FOREACH v_approver IN ARRAY p_approvers
  LOOP
    INSERT INTO document_approval_steps (
      approval_id,
      step_number,
      approver_id,
      notified_at
    ) VALUES (
      v_approval_id,
      v_step_num,
      v_approver,
      NOW()
    );
    
    v_step_num := v_step_num + 1;
  END LOOP;
  
  RAISE NOTICE 'Approval workflow started: %', v_approval_id;
  
  RETURN v_approval_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION start_document_approval IS 'Запустить workflow утверждения документа';

-- =====================================================
-- 7. ПРОВЕРКА
-- =====================================================

SELECT 'Document approval system ready!' as status;

SELECT 
  COUNT(*) as total_recommendations
FROM requirement_document_templates;

