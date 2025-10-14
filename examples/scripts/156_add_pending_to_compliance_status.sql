-- Add 'pending' value to compliance_status enum if it doesn't exist
-- This is needed because the enum was created without 'pending' initially

DO $$
BEGIN
    -- Check if 'pending' value already exists in the enum
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'pending'
        AND enumtypid = 'compliance_status'::regtype
    ) THEN
        -- Add 'pending' to the enum
        ALTER TYPE compliance_status ADD VALUE 'pending';
        RAISE NOTICE 'Added ''pending'' value to compliance_status enum';
    ELSE
        RAISE NOTICE '''pending'' value already exists in compliance_status enum';
    END IF;
END$$;
