-- Добавление значения 'pending' в enum compliance_status если его нет
-- Это безопасная операция - если значение уже существует, команда будет проигнорирована

DO $$
BEGIN
    -- Проверяем, существует ли значение 'pending' в enum
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'pending'
        AND enumtypid = 'compliance_status'::regtype
    ) THEN
        -- Добавляем значение 'pending' в enum
        ALTER TYPE compliance_status ADD VALUE 'pending';
        RAISE NOTICE 'Added ''pending'' value to compliance_status enum';
    ELSE
        RAISE NOTICE '''pending'' value already exists in compliance_status enum';
    END IF;
END$$;

-- Комментарий для документации
COMMENT ON TYPE compliance_status IS 'Статусы соответствия требованиям: compliant, non_compliant, partially_compliant, not_applicable, pending';
