-- Migration: Add Tags (P1)
-- Теги для проектов и задач

-- Создание таблицы tags
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(name)
);

-- Создание связи tags <-> projects (many-to-many)
CREATE TABLE IF NOT EXISTS project_tags (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (project_id, tag_id)
);

-- Создание связи tags <-> tasks (many-to-many)
CREATE TABLE IF NOT EXISTS task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (task_id, tag_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_project_tags_project ON project_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tags_tag ON project_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_task ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag ON task_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_active ON tags(is_active);

-- Вставка стандартных тегов
INSERT INTO tags (name, color, description) VALUES
  ('Срочно', '#EF4444', 'Срочные задачи и проекты'),
  ('Важно', '#F59E0B', 'Важные задачи и проекты'),
  ('Бэклог', '#6B7280', 'Задачи в бэклоге'),
  ('Исследование', '#8B5CF6', 'Исследовательские задачи'),
  ('Разработка', '#3B82F6', 'Задачи разработки'),
  ('Тестирование', '#10B981', 'Задачи тестирования'),
  ('Документация', '#14B8A6', 'Задачи документирования'),
  ('Багфикс', '#DC2626', 'Исправление ошибок')
ON CONFLICT (name) DO NOTHING;

