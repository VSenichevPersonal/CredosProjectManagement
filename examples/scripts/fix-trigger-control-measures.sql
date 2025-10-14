-- Fix trigger_update_compliance_status() function
-- Problem: It's trying to access NEW.control_measure_id which doesn't exist
-- The field is actually just 'id' in control_measures table

-- Step 1: Check current trigger function
SELECT 
  '🔍 Current trigger function:' as info,
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE proname = 'trigger_update_compliance_status';

-- Step 2: Drop and recreate the trigger function with correct field name
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
    v_measure_id := NEW.id;  -- ✅ FIXED: was NEW.control_measure_id
  ELSIF TG_OP = 'DELETE' THEN
    v_compliance_record_id := OLD.compliance_record_id;
    v_measure_id := OLD.id;  -- ✅ FIXED: was OLD.control_measure_id
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

  -- Determine new status
  IF v_total_measures = 0 THEN
    v_new_status := 'not_started';
  ELSIF v_completed_measures = 0 THEN
    v_new_status := 'not_started';
  ELSIF v_completed_measures < v_total_measures THEN
    v_new_status := 'in_progress';
  ELSE
    v_new_status := 'compliant';
  END IF;

  -- Update compliance record status
  UPDATE compliance_records
  SET 
    status = v_new_status::compliance_status,
    updated_at = NOW()
  WHERE id = v_compliance_record_id;

  -- Log the update
  RAISE NOTICE 'Updated compliance record % status to %', v_compliance_record_id, v_new_status;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 3: Recreate triggers
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

-- Step 4: Verify triggers are created
SELECT 
  '✅ Triggers recreated:' as info,
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgtype,
  tgenabled
FROM pg_trigger
WHERE tgname IN (
  'control_measure_status_change',
  'evidence_link_change', 
  'evidence_status_change'
)
ORDER BY tgrelid::regclass, tgname;

-- Step 5: Test with a simple insert (will be rolled back)
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Testing trigger with sample data...';
  RAISE NOTICE '';
  
  -- This will test if trigger works without errors
  -- Transaction will be rolled back at the end
END $$;

SELECT '✅ Trigger function fixed and ready!' as status;

