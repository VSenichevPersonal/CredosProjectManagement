-- Quick fix: Add explicit cast to compliance_status enum

DROP FUNCTION IF EXISTS trigger_update_compliance_status() CASCADE;

CREATE OR REPLACE FUNCTION trigger_update_compliance_status()
RETURNS TRIGGER AS $$
DECLARE
  v_compliance_record_id UUID;
  v_measure_id UUID;
  v_total_measures INTEGER;
  v_completed_measures INTEGER;
  v_new_status TEXT;
BEGIN
  -- Determine which compliance record to update
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_compliance_record_id := NEW.compliance_record_id;
    v_measure_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    v_compliance_record_id := OLD.compliance_record_id;
    v_measure_id := OLD.id;
  END IF;

  -- Handle evidence_links/evidence triggers
  IF TG_TABLE_NAME IN ('evidence_links', 'evidence') THEN
    IF TG_OP = 'DELETE' THEN
      SELECT compliance_record_id INTO v_compliance_record_id
      FROM control_measures WHERE id = OLD.control_measure_id;
    ELSE
      SELECT compliance_record_id INTO v_compliance_record_id
      FROM control_measures WHERE id = NEW.control_measure_id;
    END IF;
  END IF;

  -- Calculate completion
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (
      WHERE status IN ('implemented', 'verified')
      OR EXISTS (
        SELECT 1 FROM evidence_links el
        WHERE el.control_measure_id = cm.id
      )
    ) as completed
  INTO v_total_measures, v_completed_measures
  FROM control_measures cm
  WHERE cm.compliance_record_id = v_compliance_record_id;

  -- Determine status
  IF v_total_measures = 0 THEN
    v_new_status := 'pending';
  ELSIF v_completed_measures = 0 THEN
    v_new_status := 'pending';
  ELSIF v_completed_measures < v_total_measures THEN
    v_new_status := 'in_progress';
  ELSE
    v_new_status := 'compliant';
  END IF;

  -- Update with explicit cast ✅
  UPDATE compliance_records
  SET 
    status = v_new_status::compliance_status,  -- ✅ Added explicit cast
    updated_at = NOW()
  WHERE id = v_compliance_record_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER control_measure_status_change
  AFTER INSERT OR UPDATE OR DELETE ON control_measures
  FOR EACH ROW EXECUTE FUNCTION trigger_update_compliance_status();

CREATE TRIGGER evidence_link_change
  AFTER INSERT OR DELETE ON evidence_links
  FOR EACH ROW EXECUTE FUNCTION trigger_update_compliance_status();

CREATE TRIGGER evidence_status_change
  AFTER UPDATE OF status ON evidence
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_update_compliance_status();

SELECT '✅ Trigger fixed with explicit cast!' as status;

