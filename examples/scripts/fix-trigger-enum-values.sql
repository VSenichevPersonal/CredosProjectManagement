-- Fix trigger to use correct compliance_status enum values

-- Step 1: Check what enum values exist for compliance_status
SELECT 
  '📋 Available compliance_status values:' as info,
  enumlabel as value,
  enumsortorder as sort_order
FROM pg_enum
WHERE enumtypid = 'compliance_status'::regtype
ORDER BY enumsortorder;

-- Step 2: Check compliance_records table for actual status column type
SELECT 
  '🔍 compliance_records status column:' as info,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'compliance_records'
AND column_name = 'status';

-- Step 3: Fix the trigger function with correct enum values
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
  -- Determine which compliance record to update based on trigger operation
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_compliance_record_id := NEW.compliance_record_id;
    v_measure_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    v_compliance_record_id := OLD.compliance_record_id;
    v_measure_id := OLD.id;
  END IF;

  -- Skip if this is from evidence_links or evidence table
  IF TG_TABLE_NAME IN ('evidence_links', 'evidence') THEN
    -- Get compliance_record_id from control_measure
    IF TG_OP = 'DELETE' THEN
      SELECT compliance_record_id INTO v_compliance_record_id
      FROM control_measures
      WHERE id = OLD.control_measure_id;
    ELSE
      SELECT compliance_record_id INTO v_compliance_record_id
      FROM control_measures
      WHERE id = NEW.control_measure_id;
    END IF;
  END IF;

  -- Calculate measure completion
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

  -- Determine new status using CORRECT enum values
  -- Based on types/domain/compliance.ts: 
  -- "pending" | "compliant" | "non_compliant" | "partial" | "not_applicable" | 
  -- "in_progress" | "not_started" | "pending_review" | "approved" | "rejected"
  
  IF v_total_measures = 0 THEN
    v_new_status := 'pending';  -- ✅ Changed from 'not_started'
  ELSIF v_completed_measures = 0 THEN
    v_new_status := 'pending';  -- ✅ Changed from 'not_started'
  ELSIF v_completed_measures < v_total_measures THEN
    v_new_status := 'in_progress';
  ELSE
    v_new_status := 'compliant';
  END IF;

  -- Update compliance record status (without casting, let Postgres handle it)
  UPDATE compliance_records
  SET 
    status = v_new_status,
    updated_at = NOW()
  WHERE id = v_compliance_record_id;

  -- Log the update
  RAISE NOTICE 'Updated compliance record % status to %', v_compliance_record_id, v_new_status;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 4: Recreate triggers
DROP TRIGGER IF EXISTS control_measure_status_change ON control_measures;
DROP TRIGGER IF EXISTS evidence_link_change ON evidence_links;
DROP TRIGGER IF EXISTS evidence_status_change ON evidence;

-- Trigger on control_measures changes
CREATE TRIGGER control_measure_status_change
  AFTER INSERT OR UPDATE OR DELETE ON control_measures
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_compliance_status();

-- Trigger on evidence_links changes
CREATE TRIGGER evidence_link_change
  AFTER INSERT OR DELETE ON evidence_links
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_compliance_status();

-- Trigger on evidence status changes
CREATE TRIGGER evidence_status_change
  AFTER UPDATE OF status ON evidence
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_update_compliance_status();

-- Step 5: Verify
SELECT '✅ Trigger function fixed with correct enum values!' as status;

-- Step 6: Show what triggers are active
SELECT 
  '✅ Active triggers:' as info,
  tgname as trigger_name,
  tgrelid::regclass as on_table,
  CASE tgtype & 2 WHEN 2 THEN 'BEFORE' ELSE 'AFTER' END as timing,
  CASE 
    WHEN tgtype & 4 = 4 THEN 'INSERT'
    WHEN tgtype & 8 = 8 THEN 'DELETE'
    WHEN tgtype & 16 = 16 THEN 'UPDATE'
    ELSE 'TRUNCATE'
  END as event
FROM pg_trigger
WHERE tgname IN (
  'control_measure_status_change',
  'evidence_link_change', 
  'evidence_status_change'
)
ORDER BY tgrelid::regclass, tgname;

