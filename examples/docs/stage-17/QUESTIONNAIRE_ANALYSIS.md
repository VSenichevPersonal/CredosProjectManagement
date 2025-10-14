# Анализ анкет GLy по ПДн и адаптация под мастер генерации

**Дата:** 13 октября 2025  
**Источник:** Документы от Олега (152-ФЗ, защита ПДн)

---

## 📋 ИСХОДНЫЕ АНКЕТЫ

### Анкета 1: "Перечень процессов ПДн"

**Назначение:** Определить какие процессы обработки ПДн есть в организации

**Структура:**
```
Общие вопросы (20 пунктов)
├─ Цели обработки ПДн
├─ Объем (< 100К или > 100К субъектов)
├─ Бизнес-процесс найма
├─ Перечень документов с ПДн
├─ Состав личного дела
├─ Перечень субъектов ПДн
├─ Правовые основания
├─ Места хранения
├─ Сроки хранения
├─ Перечень программ
├─ Состав работников с доступом
├─ Подразделения для передачи
├─ Сторонние организации
├─ Каналы передачи
├─ Рассылки
├─ Размещение на сайтах
├─ ЭП
├─ Съемные носители
└─ Ознакомление с ЛНА

9 Разделов процессов (80+ процессов)
├─ 1. Кадровые (27)
├─ 2. Бухгалтерские и финансовые (11)
├─ 3. Юридические (6)
├─ 4. Маркетинг и PR (12)
├─ 5. ИТ-процессы и безопасность (7)
├─ 6. Комплаенс (3)
├─ 7. Производство (4)
├─ 8. Работа с потребителями (7)
└─ 9. Логистика (3)
```

### Анкета 2: "ПДн опросник полный"

**Назначение:** Собрать детальную информацию для подготовки ОРД по ПДн

**Структура:**
```
1. Организационная структура
   ├─ Комиссия по определению уровня защищенности
   ├─ Ответственный за обработку ПДн
   └─ Ответственный за безопасность ПДн

2. Цели обработки ПДн (список целей)

3. Информация по каждой ИСПДн
   ├─ Адрес расположения
   ├─ Перечень обрабатываемых ПДн
   ├─ Перечень ПО
   ├─ Субъекты ПДн
   ├─ Должности с доступом
   ├─ Ответственные за изменения конфигурации
   └─ Места хранения носителей

4. Ответственные лица
   ├─ За хранение материальных носителей
   ├─ За ведение форм документов
   ├─ За эксплуатацию криптосредств
   └─ За режим доступа в контролируемую зону

5. Криптография
   ├─ Работники, допущенные к криптосредствам
   ├─ Работники с доступом в помещения с криптосредствами
   └─ Помещения хранения криптосредств

6. Комиссии
   ├─ По уничтожению ПДн
   ├─ По внутреннему контролю
   └─ По оценке вреда субъектам
```

---

## 🔄 АДАПТАЦИЯ ПОД НАШУ АРХИТЕКТУРУ

### DocumentPackage: "Документы по 152-ФЗ (ПДн)"

```typescript
{
  id: "pkg-152fz-pdn",
  code: "152fz-pdn-full",
  title: "Комплект документов по защите персональных данных (152-ФЗ)",
  description: "Полный пакет документов для соответствия 152-ФЗ",
  regulatoryFrameworkIds: ["152-fz", "prikaz-rkn-996"],
  
  documentTemplateIds: [
    "policy-pdn",              // Политика обработки ПДн
    "instruction-pdn",         // Инструкция по обработке ПДн
    "ord-pdn",                 // ОРД по ИСПДн
    "pologenie-vnutr-control", // Положение о внутреннем контроле
    "pologenie-komisii",       // Положение о комиссиях
    "prikaz-naznachenie",      // Приказ о назначении ответственных
  ],
  
  questionnaire: {
    // См. ниже
  }
}
```

---

## 📝 ПРОЕКТИРОВАНИЕ АНКЕТЫ

### QuestionnaireDefinition для 152-ФЗ

```typescript
{
  id: "questionnaire-152fz-pdn",
  title: "Анкета для подготовки документов по 152-ФЗ",
  sections: [
    // Раздел 1: Общая информация об организации
    {
      id: "section-org-info",
      title: "1. Общая информация об организации",
      description: "Основные данные о вашей организации",
      questions: [
        {
          id: "org-name",
          type: "text",
          label: "Полное наименование организации",
          required: true
        },
        {
          id: "org-inn",
          type: "text",
          label: "ИНН",
          required: true
        },
        {
          id: "org-address",
          type: "text",
          label: "Юридический адрес",
          required: true
        },
        {
          id: "org-type",
          type: "select",
          label: "Тип организации",
          required: true,
          options: [
            { value: "commercial", label: "Коммерческая" },
            { value: "government", label: "Государственная" },
            { value: "nko", label: "НКО" }
          ]
        },
        {
          id: "employee-count",
          type: "select",
          label: "Количество сотрудников",
          required: true,
          options: [
            { value: "1-50", label: "1-50" },
            { value: "51-250", label: "51-250" },
            { value: "251-1000", label: "251-1000" },
            { value: "1000+", label: "Более 1000" }
          ]
        }
      ]
    },
    
    // Раздел 2: Объем обработки ПДн
    {
      id: "section-pdn-scope",
      title: "2. Объем обработки персональных данных",
      questions: [
        {
          id: "pdn-volume",
          type: "select",
          label: "Объем обрабатываемых ПДн (количество субъектов)",
          required: true,
          options: [
            { value: "less-100k", label: "Менее 100 000" },
            { value: "more-100k", label: "Более 100 000" }
          ]
        },
        {
          id: "pdn-subjects",
          type: "multiselect",
          label: "Категории субъектов ПДн",
          required: true,
          options: [
            { value: "employees", label: "Сотрудники" },
            { value: "relatives", label: "Родственники сотрудников" },
            { value: "former-employees", label: "Бывшие сотрудники" },
            { value: "clients", label: "Клиенты" },
            { value: "contractors", label: "Контрагенты" },
            { value: "candidates", label: "Кандидаты на работу" },
            { value: "other", label: "Иные" }
          ]
        },
        {
          id: "pdn-goals",
          type: "multiselect",
          label: "Основные цели обработки ПДн",
          required: true,
          options: [
            { value: "hr", label: "Кадровый учет" },
            { value: "payroll", label: "Расчет заработной платы" },
            { value: "recruitment", label: "Подбор персонала" },
            { value: "contracts", label: "Исполнение договоров" },
            { value: "marketing", label: "Маркетинг" },
            { value: "security", label: "Обеспечение безопасности" },
            { value: "compliance", label: "Соблюдение законодательства" }
          ]
        }
      ]
    },
    
    // Раздел 3: Ответственные лица
    {
      id: "section-responsible",
      title: "3. Ответственные лица и комиссии",
      description: "Укажите ответственных за обработку и защиту ПДн",
      questions: [
        {
          id: "responsible-processing-name",
          type: "text",
          label: "ФИО ответственного за обработку ПДн",
          placeholder: "Иванов Иван Иванович",
          required: true
        },
        {
          id: "responsible-processing-position",
          type: "text",
          label: "Должность ответственного за обработку ПДн",
          placeholder: "Директор по персоналу",
          required: true
        },
        {
          id: "responsible-security-name",
          type: "text",
          label: "ФИО ответственного за безопасность ПДн",
          required: true
        },
        {
          id: "responsible-security-position",
          type: "text",
          label: "Должность ответственного за безопасность ПДн",
          placeholder: "Начальник отдела ИТ",
          required: true
        },
        {
          id: "commission-chairman-name",
          type: "text",
          label: "ФИО председателя комиссии по определению уровня защищенности",
          required: true
        },
        {
          id: "commission-chairman-position",
          type: "text",
          label: "Должность председателя комиссии",
          placeholder: "Генеральный директор",
          required: true
        }
      ]
    },
    
    // Раздел 4: Информационные системы
    {
      id: "section-ispdn",
      title: "4. Информационные системы ПДн (ИСПДн)",
      description: "Опишите системы, в которых обрабатываются ПДн",
      questions: [
        {
          id: "ispdn-count",
          type: "select",
          label: "Количество ИСПДн",
          required: true,
          options: [
            { value: "1", label: "1 система" },
            { value: "2", label: "2 системы" },
            { value: "3", label: "3 системы" },
            { value: "4+", label: "4 и более" }
          ]
        },
        {
          id: "ispdn-1-software",
          type: "multiselect",
          label: "ИСПДн №1: Используемое ПО",
          required: true,
          dependsOn: { questionId: "ispdn-count", values: ["1", "2", "3", "4+"] },
          options: [
            { value: "1c-salary", label: "1С: Зарплата и управление персоналом" },
            { value: "1c-accounting", label: "1С: Бухгалтерия" },
            { value: "1c-crm", label: "1С: CRM" },
            { value: "ms-office", label: "Microsoft Office" },
            { value: "email", label: "Электронная почта" },
            { value: "ked", label: "Система электронного документооборота" },
            { value: "custom", label: "Собственная разработка" },
            { value: "other", label: "Другое" }
          ]
        },
        {
          id: "ispdn-1-location",
          type: "text",
          label: "ИСПДн №1: Адрес расположения",
          placeholder: "г. Москва, ул. Ленина, д.1, каб. 101",
          required: true,
          dependsOn: { questionId: "ispdn-count", values: ["1", "2", "3", "4+"] }
        }
      ]
    },
    
    // Раздел 5: Процессы обработки ПДн
    {
      id: "section-processes",
      title: "5. Процессы обработки ПДн",
      description: "Отметьте процессы, которые есть в вашей организации",
      questions: [
        {
          id: "processes-hr",
          type: "multiselect",
          label: "Кадровые процессы",
          required: false,
          options: [
            { value: "recruitment", label: "Подбор кандидатов" },
            { value: "reserve", label: "Формирование кадрового резерва" },
            { value: "hiring", label: "Трудоустройство" },
            { value: "foreign-workers", label: "Оформление виз для иностранцев" },
            { value: "training", label: "Обучение работников" },
            { value: "medical", label: "Медицинские осмотры" },
            { value: "business-trips", label: "Организация командировок" },
            { value: "insurance", label: "Оформление полисов страхования" },
            { value: "corporate-events", label: "Корпоративные мероприятия" }
          ]
        },
        {
          id: "processes-finance",
          type: "multiselect",
          label: "Бухгалтерские и финансовые процессы",
          required: false,
          options: [
            { value: "payroll", label: "Расчет заработной платы" },
            { value: "reporting", label: "Государственная отчетность" },
            { value: "salary-cards", label: "Оформление карт зарплатного проекта" },
            { value: "loans", label: "Выдача займов работникам" },
            { value: "certificates", label: "Предоставление справок" }
          ]
        },
        {
          id: "processes-security",
          type: "multiselect",
          label: "ИТ и безопасность",
          required: false,
          options: [
            { value: "access-control", label: "Пропускной режим" },
            { value: "video", label: "Видеонаблюдение" },
            { value: "it-access", label: "Доступ в информационные системы" },
            { value: "backup", label: "Резервное копирование" },
            { value: "incidents", label: "Расследование инцидентов ИБ" }
          ]
        },
        {
          id: "processes-marketing",
          type: "multiselect",
          label: "Маркетинг и работа с клиентами",
          required: false,
          options: [
            { value: "email-campaigns", label: "Email-рассылки" },
            { value: "sms-campaigns", label: "СМС-рассылки" },
            { value: "events", label: "Организация мероприятий" },
            { value: "analytics", label: "Аналитика поведения пользователей" },
            { value: "loyalty", label: "Программа лояльности" },
            { value: "feedback", label: "Сбор обратной связи" }
          ]
        }
      ]
    },
    
    // Раздел 6: Хранение и передача ПДн
    {
      id: "section-storage",
      title: "6. Хранение и передача ПДн",
      questions: [
        {
          id: "storage-paper",
          type: "multiselect",
          label: "Места хранения бумажных носителей ПДн",
          required: true,
          options: [
            { value: "cabinet", label: "Шкаф с замком" },
            { value: "safe", label: "Сейф" },
            { value: "archive", label: "Архив" },
            { value: "hr-office", label: "Кабинет отдела кадров" },
            { value: "none", label: "Нет бумажных носителей" }
          ]
        },
        {
          id: "transfer-channels",
          type: "multiselect",
          label: "Каналы передачи ПДн",
          required: true,
          options: [
            { value: "email", label: "Электронная почта" },
            { value: "ked", label: "Система электронного документооборота" },
            { value: "internet", label: "Через сеть Интернет" },
            { value: "paper", label: "Бумажные документы" },
            { value: "removable", label: "Съемные носители (флешки)" },
            { value: "internal", label: "Внутренняя сеть организации" }
          ]
        },
        {
          id: "external-transfer",
          type: "boolean",
          label: "Передаете ли ПДн сторонним организациям?",
          required: true
        },
        {
          id: "external-orgs",
          type: "multiselect",
          label: "Сторонние организации, которым передаются ПДн",
          required: false,
          dependsOn: { questionId: "external-transfer", values: [true] },
          options: [
            { value: "fns", label: "ФНС" },
            { value: "pfr", label: "ПФР / СФР" },
            { value: "fss", label: "ФСС" },
            { value: "banks", label: "Банки" },
            { value: "medical", label: "Медицинские организации" },
            { value: "recruiters", label: "Рекрутинговые агентства" },
            { value: "contractors", label: "Контрагенты" }
          ]
        }
      ]
    },
    
    // Раздел 7: Защита ПДн
    {
      id: "section-protection",
      title: "7. Меры защиты ПДн",
      questions: [
        {
          id: "crypto-tools",
          type: "boolean",
          label: "Используются ли криптографические средства защиты?",
          required: true
        },
        {
          id: "crypto-tools-list",
          type: "multiselect",
          label: "Используемые криптосредства",
          required: false,
          dependsOn: { questionId: "crypto-tools", values: [true] },
          options: [
            { value: "cryptopro", label: "КриптоПро CSP" },
            { value: "vipnet", label: "ViPNet CSP" },
            { value: "signal-kom", label: "Сигнал-КОМ" },
            { value: "other", label: "Другое" }
          ]
        },
        {
          id: "antivirus",
          type: "boolean",
          label: "Установлены ли антивирусные средства?",
          required: true
        },
        {
          id: "firewall",
          type: "boolean",
          label: "Используется ли межсетевой экран (firewall)?",
          required: true
        },
        {
          id: "access-control-tech",
          type: "boolean",
          label: "Настроено ли разграничение прав доступа в ИСПДн?",
          required: true
        },
        {
          id: "backup-enabled",
          type: "boolean",
          label: "Выполняется ли резервное копирование?",
          required: true
        }
      ]
    },
    
    // Раздел 8: Организационные меры
    {
      id: "section-organizational",
      title: "8. Организационные меры",
      questions: [
        {
          id: "policies-exist",
          type: "boolean",
          label: "Есть ли утвержденная Политика обработки ПДн?",
          required: true
        },
        {
          id: "instruction-exist",
          type: "boolean",
          label: "Есть ли Инструкция по обработке ПДн?",
          required: true
        },
        {
          id: "employee-agreements",
          type: "boolean",
          label: "Подписывают ли работники обязательство о неразглашении?",
          required: true
        },
        {
          id: "employee-training",
          type: "boolean",
          label: "Проводится ли обучение работников по защите ПДн?",
          required: true
        },
        {
          id: "internal-control",
          type: "boolean",
          label: "Проводится ли внутренний контроль обработки ПДн?",
          required: true
        }
      ]
    }
  ]
}
```

---

## 🔄 MAPPING: Анкета → Генерация документов

### Как данные используются для генерации

```typescript
// Пример использования ответов для генерации "Политики ИБ"

// Ответы из анкеты:
answers = {
  "org-name": "ООО \"Ромашка\"",
  "org-inn": "7701234567",
  "org-address": "г. Москва, ул. Ленина, д. 1",
  "responsible-processing-name": "Иванов Иван Иванович",
  "responsible-processing-position": "Директор по персоналу",
  "pdn-subjects": ["employees", "clients", "contractors"],
  "pdn-goals": ["hr", "payroll", "contracts"],
  "processes-hr": ["recruitment", "hiring", "training"],
  "ispdn-1-software": ["1c-salary", "ms-office", "email"],
  ...
}

// → LLM генерирует документ с подстановкой:

"ПОЛИТИКА ОБРАБОТКИ ПЕРСОНАЛЬНЫХ ДАННЫХ
ООО \"Ромашка\"

1. ОБЩИЕ ПОЛОЖЕНИЯ
1.1. Настоящая Политика обработки персональных данных (далее — Политика) 
     разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ...

2. ОТВЕТСТВЕННЫЕ ЛИЦА
2.1. Ответственным за организацию обработки персональных данных 
     в ООО \"Ромашка\" является Иванов Иван Иванович, Директор по персоналу.

3. ЦЕЛИ ОБРАБОТКИ
3.1. ООО \"Ромашка\" осуществляет обработку персональных данных в следующих целях:
     - Ведение кадрового учета работников;
     - Расчет и выплата заработной платы;
     - Исполнение договоров с контрагентами.

4. КАТЕГОРИИ СУБЪЕКТОВ
4.1. ООО \"Ромашка\" обрабатывает персональные данные следующих категорий субъектов:
     - Работники организации;
     - Клиенты;
     - Контрагенты.

5. ИНФОРМАЦИОННЫЕ СИСТЕМЫ
5.1. Для обработки персональных данных используются следующие 
     информационные системы:
     - 1С: Зарплата и управление персоналом;
     - Microsoft Office;
     - Корпоративная электронная почта.

..."
```

---

## 💡 КЛЮЧЕВЫЕ НАБЛЮДЕНИЯ

### 1. Анкеты очень детальные
- **80+ процессов** в чек-листе
- **Много конкретных данных** (ФИО, должности, адреса)
- **Специфика 152-ФЗ** (комиссии, криптосредства, уровни защищенности)

### 2. Структура идеально ложится на нашу архитектуру
```
Раздел анкеты = QuestionSection
Вопрос = Question
Процесс = Option в multiselect
```

### 3. Нужны уточняющие вопросы от LLM
После базовой анкеты LLM может спросить:
- "Вы указали, что используете 1С. Какая версия?"
- "Вы передаете ПДн в банки. Какие именно банки?"
- "Где физически расположены сервера с ИСПДн?"

### 4. Можно создать несколько пакетов
```
pkg-152fz-basic       // Базовый пакет (малый бизнес)
pkg-152fz-full        // Полный пакет (средний/крупный бизнес)
pkg-152fz-government  // Для госучреждений
```

---

## 🎯 ПЛАН АДАПТАЦИИ

### Шаг 1: Создать QuestionnaireDefinition
- [x] Проанализировать исходные анкеты
- [ ] Создать структуру для 152-ФЗ
- [ ] Добавить условную логику (dependsOn)
- [ ] Валидация полей

### Шаг 2: Создать DocumentPackage
- [ ] "Документы по 152-ФЗ (базовый)"
- [ ] "Документы по 152-ФЗ (полный)"
- [ ] Связать с шаблонами документов

### Шаг 3: Шаблоны документов
- [ ] Политика обработки ПДн
- [ ] Инструкция по обработке ПДн
- [ ] ОРД по ИСПДн
- [ ] Положение о комиссии
- [ ] Приказы о назначении ответственных

### Шаг 4: Промпты для LLM
- [ ] Системный промпт для 152-ФЗ
- [ ] Промпт генерации уточняющих вопросов
- [ ] Промпт генерации каждого типа документа

---

## 📊 СРАВНЕНИЕ: Исходная анкета vs Наш мастер

| Аспект | Исходная анкета | Наш мастер |
|--------|----------------|------------|
| **Формат** | Word/PDF, ручное заполнение | Веб-форма, валидация |
| **Логика** | Линейная, все вопросы | Условная, зависимости |
| **Уточнения** | Нет | LLM задает вопросы |
| **Результат** | Заполненная анкета | Готовые документы |
| **Время** | Несколько часов | 30-40 минут |
| **Ошибки** | Легко допустить | Валидация, подсказки |

---

## 🚀 СЛЕДУЮЩИЕ ШАГИ

1. **Реализовать QuestionnaireDefinition** для 152-ФЗ
2. **Создать DocumentPackage** "152-ФЗ базовый"
3. **Подготовить шаблоны** документов с плейсхолдерами
4. **Настроить промпты** для Claude 4.5
5. **Протестировать** на реальных данных

---

**Готовность:** Анкеты изучены, структура понятна, можно начинать реализацию! 🎉

