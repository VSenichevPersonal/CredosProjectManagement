-- Добавление полей для визуального отображения беджей нормативных документов
ALTER TABLE regulatory_frameworks 
ADD COLUMN IF NOT EXISTS badge_text VARCHAR(50),
ADD COLUMN IF NOT EXISTS badge_color VARCHAR(20) DEFAULT 'secondary';

-- Обновление существующих записей с визуальными настройками
UPDATE regulatory_frameworks SET 
  badge_text = '152-ФЗ',
  badge_color = 'blue'
WHERE code = '152-FZ';

UPDATE regulatory_frameworks SET 
  badge_text = '187-ФЗ',
  badge_color = 'purple'
WHERE code = '187-FZ';

UPDATE regulatory_frameworks SET 
  badge_text = 'ФСТЭК №239',
  badge_color = 'orange'
WHERE code = 'FSTEC-239';

UPDATE regulatory_frameworks SET 
  badge_text = 'ФСТЭК №21',
  badge_color = 'orange'
WHERE code = 'FSTEC-21';

UPDATE regulatory_frameworks SET 
  badge_text = 'ФСБ №378',
  badge_color = 'red'
WHERE code = 'FSB-378';

UPDATE regulatory_frameworks SET 
  badge_text = 'ГОСТ Р 57580',
  badge_color = 'green'
WHERE code = 'GOST-R-57580';

UPDATE regulatory_frameworks SET 
  badge_text = '149-ФЗ',
  badge_color = 'blue'
WHERE code = '149-FZ';

-- Комментарии для полей
COMMENT ON COLUMN regulatory_frameworks.badge_text IS 'Текст для отображения в бедже (краткое название)';
COMMENT ON COLUMN regulatory_frameworks.badge_color IS 'Цвет бе джа: blue, purple, orange, red, green, secondary, outline';

SELECT 'Badge fields added to regulatory_frameworks successfully' as status;
