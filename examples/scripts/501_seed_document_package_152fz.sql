-- =====================================================
-- Seed: Document Package "152-ФЗ ПДн" (полный комплект)
-- Date: 2025-10-13
-- Purpose: Seed data for 152-FZ Personal Data package
-- =====================================================

-- Вставка пакета "152-ФЗ ПДн - Полный комплект"
INSERT INTO document_packages (
  code,
  title,
  description,
  regulators,
  regulatory_framework_ids,
  document_template_ids,
  documents_count,
  questionnaire,
  estimated_time_minutes,
  complexity,
  is_available,
  is_active
) VALUES (
  '152fz-pdn-full',
  'Защита персональных данных (152-ФЗ)',
  'Полный комплект из 15 документов для соответствия требованиям 152-ФЗ: политики, инструкции, положения, приказы, ОРД',
  ARRAY['Роскомнадзор'],
  ARRAY[]::UUID[],  -- TODO: заполнить после создания regulatory_frameworks
  ARRAY[]::UUID[],  -- TODO: заполнить после создания document_templates
  15,
  -- Questionnaire (JSONB)
  '{
    "id": "152fz-pdn-full",
    "title": "Анкета по защите персональных данных",
    "sections": [
      {
        "id": "org-info",
        "title": "1. Информация об организации",
        "questions": [
          {
            "id": "org-name",
            "type": "text",
            "label": "Полное наименование организации",
            "placeholder": "ООО \\"Ромашка\\"",
            "required": true
          },
          {
            "id": "org-inn",
            "type": "text",
            "label": "ИНН",
            "placeholder": "7701234567",
            "required": true
          },
          {
            "id": "org-address",
            "type": "text",
            "label": "Юридический адрес",
            "placeholder": "г. Москва, ул. Ленина, д. 1",
            "required": true
          },
          {
            "id": "org-type",
            "type": "select",
            "label": "Тип организации",
            "required": true,
            "options": [
              { "value": "commercial", "label": "Коммерческая" },
              { "value": "government", "label": "Государственная" },
              { "value": "nko", "label": "НКО" }
            ]
          },
          {
            "id": "employee-count",
            "type": "select",
            "label": "Количество сотрудников",
            "required": true,
            "options": [
              { "value": "1-50", "label": "1-50" },
              { "value": "51-250", "label": "51-250" },
              { "value": "251-1000", "label": "251-1000" },
              { "value": "1000+", "label": "Более 1000" }
            ]
          }
        ]
      },
      {
        "id": "pdn-scope",
        "title": "2. Объем обработки персональных данных",
        "questions": [
          {
            "id": "pdn-volume",
            "type": "select",
            "label": "Объем обрабатываемых ПДн (количество субъектов)",
            "required": true,
            "options": [
              { "value": "less-100k", "label": "Менее 100 000" },
              { "value": "more-100k", "label": "Более 100 000" }
            ]
          },
          {
            "id": "pdn-subjects",
            "type": "multiselect",
            "label": "Категории субъектов ПДн (выберите все подходящие)",
            "required": true,
            "options": [
              { "value": "employees", "label": "Сотрудники" },
              { "value": "relatives", "label": "Родственники сотрудников" },
              { "value": "former-employees", "label": "Бывшие сотрудники" },
              { "value": "clients", "label": "Клиенты" },
              { "value": "contractors", "label": "Контрагенты" },
              { "value": "candidates", "label": "Кандидаты на работу" }
            ]
          }
        ]
      },
      {
        "id": "responsible",
        "title": "3. Ответственные лица",
        "questions": [
          {
            "id": "responsible-processing-name",
            "type": "text",
            "label": "ФИО ответственного за обработку ПДн",
            "placeholder": "Иванов Иван Иванович",
            "required": true
          },
          {
            "id": "responsible-processing-position",
            "type": "text",
            "label": "Должность ответственного за обработку ПДн",
            "placeholder": "Директор по персоналу",
            "required": true
          },
          {
            "id": "responsible-security-name",
            "type": "text",
            "label": "ФИО ответственного за безопасность ПДн",
            "required": true
          },
          {
            "id": "responsible-security-position",
            "type": "text",
            "label": "Должность ответственного за безопасность ПДн",
            "placeholder": "Начальник отдела ИТ",
            "required": true
          }
        ]
      },
      {
        "id": "ispdn",
        "title": "4. Информационные системы",
        "questions": [
          {
            "id": "ispdn-software",
            "type": "multiselect",
            "label": "Используемое ПО для обработки ПДн",
            "required": true,
            "options": [
              { "value": "1c-salary", "label": "1С: Зарплата и управление персоналом" },
              { "value": "1c-accounting", "label": "1С: Бухгалтерия" },
              { "value": "ms-office", "label": "Microsoft Office" },
              { "value": "email", "label": "Электронная почта" },
              { "value": "ked", "label": "Система электронного документооборота" },
              { "value": "other", "label": "Другое" }
            ]
          },
          {
            "id": "ispdn-location",
            "type": "text",
            "label": "Адрес расположения ИСПДн",
            "placeholder": "г. Москва, ул. Ленина, д.1, каб. 101",
            "required": true
          }
        ]
      }
    ]
  }'::jsonb,
  45,
  'complex',
  true,
  true
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  documents_count = EXCLUDED.documents_count,
  questionnaire = EXCLUDED.questionnaire,
  updated_at = NOW();

-- Success
SELECT 'Document package "152-ФЗ ПДн" seeded successfully' AS status;

