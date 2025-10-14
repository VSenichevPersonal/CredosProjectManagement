-- Исправление: сделать document_id nullable в таблице requirements
-- Документ может быть прикреплен к требованию позже

-- Удалить NOT NULL constraint с document_id
ALTER TABLE requirements 
ALTER COLUMN document_id DROP NOT NULL;

-- Добавить комментарий
COMMENT ON COLUMN requirements.document_id IS 'ID нормативного документа (nullable - документ может быть прикреплен позже)';

SELECT jsonb_build_object(
  'status', 'document_id constraint fixed - now nullable'
);
