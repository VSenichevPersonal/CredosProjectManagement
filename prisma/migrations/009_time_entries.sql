-- Migration: Time Entries Table Enhancement
-- Description: Add task_id to existing time_entries table for task tracking
-- Author: AI Assistant
-- Date: 2025-10-15

-- Add task_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_entries' AND column_name = 'task_id'
  ) THEN
    ALTER TABLE time_entries ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
    COMMENT ON COLUMN time_entries.task_id IS 'Reference to task';
  END IF;
END $$;

-- Create indexes for better query performance (if not exist)
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_employee_date ON time_entries(employee_id, date);

-- Add comments
COMMENT ON TABLE time_entries IS 'Tracks employee time spent on tasks';
COMMENT ON COLUMN time_entries.id IS 'Unique identifier';
COMMENT ON COLUMN time_entries.employee_id IS 'Reference to employee';
COMMENT ON COLUMN time_entries.project_id IS 'Reference to project';
COMMENT ON COLUMN time_entries.task_id IS 'Reference to task';
COMMENT ON COLUMN time_entries.date IS 'Date when work was performed';
COMMENT ON COLUMN time_entries.hours IS 'Hours spent (0-24)';
COMMENT ON COLUMN time_entries.description IS 'Optional description of work performed';
COMMENT ON COLUMN time_entries.created_at IS 'When the entry was created';
COMMENT ON COLUMN time_entries.updated_at IS 'When the entry was last updated';

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_time_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_time_entries_updated_at ON time_entries;

CREATE TRIGGER trigger_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_time_entries_updated_at();

-- Add sample data (optional, for testing)
-- INSERT INTO time_entries (employee_id, project_id, task_id, date, hours, description)
-- SELECT 
--   e.id,
--   p.id,
--   t.id,
--   CURRENT_DATE - (RANDOM() * 30)::INTEGER,
--   (RANDOM() * 8)::DECIMAL(5,2),
--   'Sample work description'
-- FROM employees e
-- CROSS JOIN LATERAL (SELECT id FROM projects LIMIT 1) p
-- CROSS JOIN LATERAL (SELECT id FROM tasks WHERE project_id = p.id LIMIT 1) t
-- LIMIT 10;

