# 🚀 Stage 1: MVP Foundation

## 📋 Обзор

**Цель**: Создать базовую систему учета времени и управления проектами для Кредо-С.

**Временные рамки**: 2-3 недели  
**Статус**: 🔄 В процессе

---

## 🎯 Цели Stage 1

### Основные функции MVP
1. ✅ **Учет времени** - сотрудники ведут учет трудозатрат
2. ✅ **Управление проектами** - создание и отслеживание проектов  
3. ✅ **Управление сотрудниками** - база сотрудников и направлений
4. 🔄 **Деплой** - рабочая система в продакшене
5. 🔄 **Тестирование** - проверка основных сценариев

### Критерии готовности
- [x] Архитектура проекта настроена
- [x] UI компоненты созданы
- [x] API endpoints реализованы
- [x] Система валидации работает
- [ ] База данных развернута
- [ ] Приложение деплоено на Railway
- [ ] Основные пользовательские сценарии протестированы

---

## 🏗️ Архитектура

### Технологический стек
```
Frontend: Next.js 14 + TypeScript + Tailwind CSS
Backend: Next.js API Routes + PostgreSQL
Hosting: Railway
```

### Структура проекта
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── globals.css        # Глобальные стили
│   └── layout.tsx         # Корневой layout
├── components/            # React компоненты
│   ├── ui/               # Базовые UI компоненты
│   ├── layout/           # Компоненты макета
│   └── time-tracking/    # Компоненты учета времени
├── lib/                  # Утилиты и конфигурация
│   ├── context/          # ExecutionContext
│   ├── services/         # Бизнес-логика
│   └── utils/            # Вспомогательные функции
├── providers/            # Провайдеры данных
├── services/             # Доменные сервисы
└── types/                # TypeScript типы
    └── domain/           # Доменные типы
```

---

## 🗄️ База данных

### Схема таблиц

#### 1. Направления (directions)
```sql
CREATE TABLE directions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES employees(id),
  budget DECIMAL(15,2),
  color VARCHAR(20) DEFAULT 'blue',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Сотрудники (employees)
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  position VARCHAR(200) NOT NULL,
  direction_id UUID REFERENCES directions(id),
  manager_id UUID REFERENCES employees(id),
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. Проекты (projects)
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  direction_id UUID REFERENCES directions(id),
  manager_id UUID REFERENCES employees(id),
  status VARCHAR(20) DEFAULT 'active',
  priority VARCHAR(20) DEFAULT 'medium',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. Задачи (tasks)
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES employees(id),
  status VARCHAR(20) DEFAULT 'todo',
  priority VARCHAR(20) DEFAULT 'medium',
  estimated_hours DECIMAL(8,2),
  actual_hours DECIMAL(8,2) DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. Трудозатраты (time_entries)
```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  project_id UUID REFERENCES projects(id),
  task_id UUID REFERENCES tasks(id),
  date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  description TEXT,
  status VARCHAR(20) DEFAULT 'submitted',
  billable BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Индексы
```sql
-- Индексы для производительности
CREATE INDEX idx_employees_direction_id ON employees(direction_id);
CREATE INDEX idx_projects_direction_id ON projects(direction_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_time_entries_employee_id ON time_entries(employee_id);
CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_status ON time_entries(status);
```

---

## 🔌 API Endpoints

### Time Entries
```
GET    /api/time-entries           # Список записей времени
POST   /api/time-entries           # Создать запись времени
GET    /api/time-entries/[id]      # Получить запись
PATCH  /api/time-entries/[id]      # Обновить запись
DELETE /api/time-entries/[id]      # Удалить запись
```

### Projects
```
GET    /api/projects               # Список проектов
POST   /api/projects               # Создать проект
GET    /api/projects/[id]          # Получить проект
PATCH  /api/projects/[id]          # Обновить проект
DELETE /api/projects/[id]          # Удалить проект
```

### Employees
```
GET    /api/employees              # Список сотрудников
POST   /api/employees              # Создать сотрудника
GET    /api/employees/[id]         # Получить сотрудника
PATCH  /api/employees/[id]         # Обновить сотрудника
```

### Directions
```
GET    /api/directions             # Список направлений
POST   /api/directions             # Создать направление
GET    /api/directions/[id]        # Получить направление
PATCH  /api/directions/[id]        # Обновить направление
```

---

## 🎨 UI Components

### Основные компоненты
- ✅ **Button** - кнопки с вариантами
- ✅ **Card** - карточки контента
- ✅ **Input** - поля ввода
- ✅ **Select** - выпадающие списки
- ✅ **Dialog** - модальные окна
- ✅ **Table** - таблицы данных
- ✅ **Badge** - статусные бейджи

### Специализированные компоненты
- ✅ **TimeEntryDialog** - форма ввода времени
- ✅ **AppLayout** - основной макет приложения
- ✅ **AppSidebar** - боковая навигация
- ✅ **AppHeader** - заголовок приложения
- ✅ **MetricCard** - карточки метрик

### Дизайн-система
- **Цвета**: Монохромная палитра с акцентами Credo-S Blue
- **Типографика**: Системные шрифты (Inter)
- **Стиль**: Деловой, минималистичный (Linear/Notion)

---

## 🔧 Настройка и развертывание

### 1. Локальная разработка
```bash
# Клонирование репозитория
git clone <repository-url>
cd credos-project-management

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env.local
# Отредактировать .env.local

# Запуск в режиме разработки
npm run dev
```

### 2. Railway деплой
```bash
# Установка Railway CLI
npm install -g @railway/cli

# Логин в Railway
railway login

# Создание проекта
railway new

# Подключение PostgreSQL
railway add postgresql

# Получение DATABASE_URL
railway variables

# Деплой
railway up
```

### 3. Миграции базы данных
```bash
# Создание миграций
npm run db:migrate

# Применение миграций
npm run db:migrate:up

# Seed данные
npm run db:seed
```

---

## 🧪 Тестирование

### Тестовые сценарии MVP

#### 1. Учет времени
- [ ] Сотрудник может создать запись времени
- [ ] Валидация полей работает корректно
- [ ] Нельзя указать время на будущую дату
- [ ] Нельзя указать больше 24 часов в день

#### 2. Управление проектами
- [ ] Создание нового проекта
- [ ] Назначение менеджера проекта
- [ ] Привязка к направлению
- [ ] Обновление статуса проекта

#### 3. Управление сотрудниками
- [ ] Создание сотрудника
- [ ] Назначение направления
- [ ] Установка почасовой ставки
- [ ] Деактивация сотрудника

#### 4. Интеграции
- [ ] API endpoints отвечают корректно
- [ ] Валидация данных работает
- [ ] Обработка ошибок работает
- [ ] Логирование функционирует

---

## 📊 Метрики успеха

### Технические метрики
- [ ] Время загрузки страницы < 2 сек
- [ ] API response time < 500ms
- [ ] 99% uptime
- [ ] 0 критических ошибок

### Бизнес-метрики
- [ ] 100% сотрудников могут вести учет времени
- [ ] 90% записей времени корректны
- [ ] Время ввода записи < 30 сек
- [ ] Удовлетворенность пользователей > 4/5

---

## 🚀 Следующие этапы

### Stage 2: Advanced Features
- 📊 Дашборд рентабельности проектов
- 🔗 Интеграция с 1С УНФ
- ✅ Система утверждений времени
- 📈 Расширенная аналитика
- 📱 Мобильная версия

### Stage 3: Scale & Optimize
- ⚡ Оптимизация производительности
- 🔒 Усиление безопасности
- 📊 Мониторинг и алерты
- 🤖 Автоматизация процессов

---

## 📞 Поддержка

### Команда разработки
- **Product Owner** - требования и приоритеты
- **Senior Architect** - архитектурные решения
- **LLM Assistant** - реализация кода

### Контакты
- **Компания**: Кредо-С
- **Проект**: Credos Project Management System
- **Статус**: MVP Development

---

*Документ обновляется по мере выполнения задач Stage 1*
