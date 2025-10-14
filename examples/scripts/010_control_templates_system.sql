-- =====================================================
-- CONTROL TEMPLATES SYSTEM
-- =====================================================
-- Система типовых мер защиты для быстрого внедрения
-- Версия: 1.0
-- Дата: 2025-01-10

-- =====================================================
-- 1. ENUMS
-- =====================================================

-- Типы контролей (если еще не существует)
DO $$ BEGIN
  CREATE TYPE control_type_enum AS ENUM (
    'preventive',    -- Превентивный
    'detective',     -- Детективный
    'corrective',    -- Корректирующий
    'compensating'   -- Компенсирующий
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Частота выполнения (если еще не существует)
DO $$ BEGIN
  CREATE TYPE frequency_enum AS ENUM (
    'continuous',    -- Постоянно
    'daily',         -- Ежедневно
    'weekly',        -- Еженедельно
    'monthly',       -- Ежемесячно
    'quarterly',     -- Ежеквартально
    'annually',      -- Ежегодно
    'on_demand'      -- По требованию
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. TABLES
-- =====================================================

-- Типовые меры (шаблоны от интегратора)
CREATE TABLE IF NOT EXISTS control_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Основная информация
  code VARCHAR(50) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Классификация
  control_type control_type_enum NOT NULL DEFAULT 'preventive',
  category VARCHAR(100), -- "Контроль доступа", "Защита данных", "Мониторинг"
  
  -- Параметры выполнения
  frequency frequency_enum NOT NULL DEFAULT 'annually',
  is_automated BOOLEAN DEFAULT false,
  
  -- Руководства
  implementation_guide TEXT, -- Как внедрить
  testing_procedure TEXT,    -- Как тестировать
  
  -- Метаданные
  tags TEXT[], -- Для поиска и фильтрации
  is_public BOOLEAN DEFAULT true, -- Доступен всем клиентам
  
  -- Аудит
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Связь типовых мер с требованиями (рекомендации)
CREATE TABLE IF NOT EXISTS requirement_control_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Связи
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  control_template_id UUID NOT NULL REFERENCES control_templates(id) ON DELETE CASCADE,
  
  -- Приоритет рекомендации
  is_recommended BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Чем выше, тем важнее (0-100)
  
  -- Контекст
  rationale TEXT, -- Почему эта мера рекомендуется для этого требования
  
  -- Аудит
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(requirement_id, control_template_id)
);

-- Добавляем поле template_id в таблицу controls
-- Это позволит отслеживать, какие меры были созданы из шаблонов
ALTER TABLE controls 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES control_templates(id) ON DELETE SET NULL;

-- =====================================================
-- 3. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_control_templates_type ON control_templates(control_type);
CREATE INDEX IF NOT EXISTS idx_control_templates_category ON control_templates(category);
CREATE INDEX IF NOT EXISTS idx_control_templates_public ON control_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_control_templates_tags ON control_templates USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_req_ctrl_templates_requirement ON requirement_control_templates(requirement_id);
CREATE INDEX IF NOT EXISTS idx_req_ctrl_templates_template ON requirement_control_templates(control_template_id);
CREATE INDEX IF NOT EXISTS idx_req_ctrl_templates_priority ON requirement_control_templates(priority DESC);

CREATE INDEX IF NOT EXISTS idx_controls_template ON controls(template_id);

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

CREATE TRIGGER update_control_templates_updated_at 
BEFORE UPDATE ON control_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

ALTER TABLE control_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_control_templates ENABLE ROW LEVEL SECURITY;

-- Все аутентифицированные пользователи могут просматривать публичные шаблоны
CREATE POLICY "Authenticated users can view public templates" 
ON control_templates
FOR SELECT TO authenticated 
USING (is_public = true);

-- Super admin может управлять всеми шаблонами
CREATE POLICY "Super admins can manage all templates" 
ON control_templates
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'super_admin'
  )
);

-- Все аутентифицированные пользователи могут просматривать рекомендации
CREATE POLICY "Authenticated users can view template recommendations" 
ON requirement_control_templates
FOR SELECT TO authenticated 
USING (true);

-- Super admin может управлять рекомендациями
CREATE POLICY "Super admins can manage template recommendations" 
ON requirement_control_templates
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'super_admin'
  )
);

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Функция для получения рекомендованных шаблонов для требования
CREATE OR REPLACE FUNCTION get_recommended_templates(p_requirement_id UUID)
RETURNS TABLE (
  template_id UUID,
  code VARCHAR(50),
  title TEXT,
  description TEXT,
  control_type control_type_enum,
  frequency frequency_enum,
  is_automated BOOLEAN,
  priority INTEGER,
  rationale TEXT,
  is_already_applied BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id,
    ct.code,
    ct.title,
    ct.description,
    ct.control_type,
    ct.frequency,
    ct.is_automated,
    rct.priority,
    rct.rationale,
    EXISTS (
      SELECT 1 FROM controls c
      WHERE c.template_id = ct.id
      AND c.tenant_id = (SELECT tenant_id FROM requirements WHERE id = p_requirement_id)
    ) as is_already_applied
  FROM control_templates ct
  INNER JOIN requirement_control_templates rct ON rct.control_template_id = ct.id
  WHERE rct.requirement_id = p_requirement_id
  AND rct.is_recommended = true
  AND ct.is_public = true
  ORDER BY rct.priority DESC, ct.title;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- 7. SEED DATA - Типовые меры защиты
-- =====================================================

-- Превентивные меры
INSERT INTO control_templates (code, title, description, control_type, category, frequency, is_automated, implementation_guide, testing_procedure, tags, is_public)
VALUES
  (
    'TMPL-AUTH-001',
    'Двухфакторная аутентификация (2FA)',
    'Внедрение обязательной двухфакторной аутентификации для доступа к информационным системам',
    'preventive',
    'Контроль доступа',
    'continuous',
    true,
    E'1. Выбрать решение для 2FA (Google Authenticator, SMS, hardware tokens)\n2. Настроить интеграцию с системой аутентификации\n3. Провести обучение пользователей\n4. Включить обязательную 2FA для всех пользователей\n5. Настроить резервные методы восстановления доступа',
    E'1. Попытаться войти без второго фактора (должно быть заблокировано)\n2. Проверить работу всех методов 2FA\n3. Протестировать процедуру восстановления доступа\n4. Проверить логирование попыток входа',
    ARRAY['аутентификация', 'доступ', '2FA', 'безопасность'],
    true
  ),
  (
    'TMPL-AUTH-002',
    'Ролевая модель доступа (RBAC)',
    'Настройка ролевой модели доступа с принципом минимальных привилегий',
    'preventive',
    'Контроль доступа',
    'continuous',
    true,
    E'1. Провести анализ бизнес-процессов и определить роли\n2. Определить права доступа для каждой роли\n3. Настроить RBAC в информационных системах\n4. Назначить роли пользователям\n5. Настроить процесс периодического пересмотра прав',
    E'1. Проверить, что пользователи имеют доступ только к необходимым ресурсам\n2. Попытаться получить доступ к ресурсам вне роли (должно быть заблокировано)\n3. Проверить процесс назначения и отзыва ролей\n4. Проверить логирование изменений прав доступа',
    ARRAY['RBAC', 'роли', 'доступ', 'привилегии'],
    true
  ),
  (
    'TMPL-DATA-001',
    'Шифрование данных в покое',
    'Шифрование конфиденциальных данных при хранении',
    'preventive',
    'Защита данных',
    'continuous',
    true,
    E'1. Провести классификацию данных\n2. Выбрать алгоритмы шифрования (AES-256)\n3. Настроить шифрование на уровне БД/файловой системы\n4. Организовать безопасное хранение ключей шифрования\n5. Настроить процедуры ротации ключей',
    E'1. Проверить, что данные зашифрованы в хранилище\n2. Попытаться получить доступ к данным без ключа\n3. Проверить процедуру ротации ключей\n4. Проверить производительность системы после внедрения шифрования',
    ARRAY['шифрование', 'данные', 'криптография', 'AES'],
    true
  ),
  (
    'TMPL-DATA-002',
    'Резервное копирование',
    'Регулярное резервное копирование критичных данных с проверкой восстановления',
    'preventive',
    'Защита данных',
    'daily',
    true,
    E'1. Определить критичные данные для резервного копирования\n2. Выбрать решение для backup (Veeam, Acronis и т.д.)\n3. Настроить расписание резервного копирования\n4. Организовать хранение резервных копий (3-2-1 правило)\n5. Настроить мониторинг успешности backup',
    E'1. Проверить наличие актуальных резервных копий\n2. Провести тестовое восстановление данных\n3. Проверить целостность резервных копий\n4. Проверить время восстановления (RTO)\n5. Проверить логирование процесса backup',
    ARRAY['backup', 'резервное копирование', 'восстановление', 'DR'],
    true
  );

-- Детективные меры
INSERT INTO control_templates (code, title, description, control_type, category, frequency, is_automated, implementation_guide, testing_procedure, tags, is_public)
VALUES
  (
    'TMPL-MON-001',
    'Мониторинг событий безопасности (SIEM)',
    'Централизованный сбор и анализ событий безопасности',
    'detective',
    'Мониторинг',
    'continuous',
    true,
    E'1. Выбрать SIEM решение (Splunk, ELK, MaxPatrol SIEM)\n2. Настроить сбор логов со всех критичных систем\n3. Разработать правила корреляции событий\n4. Настроить алерты на подозрительную активность\n5. Обучить SOC команду работе с SIEM',
    E'1. Проверить, что логи собираются со всех источников\n2. Сгенерировать тестовые инциденты безопасности\n3. Проверить срабатывание алертов\n4. Проверить время обнаружения инцидентов\n5. Проверить полноту собираемых данных',
    ARRAY['SIEM', 'мониторинг', 'логи', 'SOC'],
    true
  ),
  (
    'TMPL-MON-002',
    'Аудит прав доступа',
    'Регулярный пересмотр и аудит прав доступа пользователей',
    'detective',
    'Контроль доступа',
    'monthly',
    false,
    E'1. Разработать процедуру аудита прав доступа\n2. Определить ответственных за проведение аудита\n3. Создать чек-листы для проверки\n4. Настроить автоматическую генерацию отчетов о правах\n5. Организовать процесс отзыва избыточных прав',
    E'1. Провести тестовый аудит прав доступа\n2. Проверить выявление избыточных прав\n3. Проверить процесс отзыва прав\n4. Проверить документирование результатов аудита\n5. Проверить сроки проведения аудита',
    ARRAY['аудит', 'доступ', 'права', 'пересмотр'],
    true
  );

-- Корректирующие меры
INSERT INTO control_templates (code, title, description, control_type, category, frequency, is_automated, implementation_guide, testing_procedure, tags, is_public)
VALUES
  (
    'TMPL-INC-001',
    'Процесс реагирования на инциденты',
    'Формализованный процесс обнаружения, реагирования и расследования инцидентов ИБ',
    'corrective',
    'Управление инцидентами',
    'on_demand',
    false,
    E'1. Разработать политику реагирования на инциденты\n2. Создать команду реагирования (CSIRT)\n3. Разработать процедуры для разных типов инцидентов\n4. Настроить систему регистрации инцидентов\n5. Провести учения по реагированию на инциденты',
    E'1. Провести учебный инцидент (tabletop exercise)\n2. Проверить время реагирования\n3. Проверить полноту документирования инцидента\n4. Проверить процесс эскалации\n5. Проверить процесс post-mortem анализа',
    ARRAY['инциденты', 'реагирование', 'CSIRT', 'IR'],
    true
  ),
  (
    'TMPL-PATCH-001',
    'Управление обновлениями и патчами',
    'Регулярная установка обновлений безопасности и патчей',
    'corrective',
    'Управление уязвимостями',
    'monthly',
    true,
    E'1. Создать инвентаризацию всех систем и ПО\n2. Настроить мониторинг доступных обновлений\n3. Разработать процедуру тестирования патчей\n4. Определить окна обслуживания для установки патчей\n5. Настроить автоматическую установку критичных патчей',
    E'1. Проверить актуальность версий ПО\n2. Проверить наличие критичных уязвимостей\n3. Проверить процесс тестирования патчей\n4. Проверить сроки установки патчей\n5. Проверить откат патчей в случае проблем',
    ARRAY['патчи', 'обновления', 'уязвимости', 'patch management'],
    true
  );

-- =====================================================
-- SCHEMA CREATED SUCCESSFULLY
-- =====================================================
