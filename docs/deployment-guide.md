# 🚀 Deployment Guide

## 📋 Обзор

**Цель**: Развернуть Credos Project Management на Railway с PostgreSQL

**Время**: ~30 минут  
**Статус**: 🔄 Готов к выполнению

---

## 🎯 Предварительные требования

### 1. Аккаунты и инструменты
- [ ] **Railway аккаунт** - [railway.app](https://railway.app)
- [ ] **GitHub репозиторий** - код проекта
- [ ] **Node.js 18+** - локальная разработка
- [ ] **Git** - версионный контроль

### 2. Railway CLI
```bash
# Установка Railway CLI
npm install -g @railway/cli

# Проверка установки
railway --version
```

---

## 🚀 Пошаговое развертывание

### Шаг 1: Подготовка проекта

#### 1.1 Создание Railway проекта
```bash
# Логин в Railway
railway login

# Создание нового проекта
railway new

# Выбор имени проекта
# Рекомендуется: credos-project-management
```

#### 1.2 Подключение к GitHub
```bash
# Связывание с GitHub репозиторием
railway connect

# Выбор репозитория
# Указать: credos-project-management
```

### Шаг 2: Настройка базы данных

#### 2.1 Добавление PostgreSQL
```bash
# Добавление PostgreSQL сервиса
railway add postgresql

# Проверка добавления
railway status
```

#### 2.2 Получение connection string
```bash
# Просмотр переменных окружения
railway variables

# Копирование DATABASE_URL
# Формат: postgresql://user:password@host:port/database
```

#### 2.3 Настройка переменных окружения
```bash
# Добавление переменных в Railway
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=<your-database-url>
railway variables set NEXTAUTH_SECRET=<random-secret>
```

### Шаг 3: Создание миграций

#### 3.1 Структура миграций
```bash
# Создание папки для миграций
mkdir -p prisma/migrations

# Создание файла миграции
touch prisma/migrations/001_initial_schema.sql
```

#### 3.2 SQL миграция (001_initial_schema.sql)
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create directions table
CREATE TABLE directions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  manager_id UUID,
  budget DECIMAL(15,2),
  color VARCHAR(20) DEFAULT 'blue',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create time_entries table
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create indexes for performance
CREATE INDEX idx_employees_direction_id ON employees(direction_id);
CREATE INDEX idx_projects_direction_id ON projects(direction_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_time_entries_employee_id ON time_entries(employee_id);
CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_status ON time_entries(status);

-- Add foreign key constraints
ALTER TABLE directions ADD CONSTRAINT fk_directions_manager 
  FOREIGN KEY (manager_id) REFERENCES employees(id);
```

#### 3.3 Seed данные (002_seed_data.sql)
```sql
-- Insert directions
INSERT INTO directions (id, name, description, color, is_active) VALUES
  (uuid_generate_v4(), 'Информационная безопасность', 'Направление ИБ', 'blue', true),
  (uuid_generate_v4(), 'Промышленная ИБ', 'Направление ПИБ', 'cyan', true),
  (uuid_generate_v4(), 'Технический консалтинг', 'Направление ТК', 'emerald', true),
  (uuid_generate_v4(), 'Аудит', 'Направление Аудит', 'orange', true);

-- Insert employees (managers first)
INSERT INTO employees (id, email, full_name, position, direction_id, hourly_rate, is_active) VALUES
  (uuid_generate_v4(), 'manager.ib@credos.ru', 'Иванов И.И.', 'Руководитель направления ИБ', 
   (SELECT id FROM directions WHERE name = 'Информационная безопасность'), 5000, true),
  (uuid_generate_v4(), 'manager.pib@credos.ru', 'Петров П.П.', 'Руководитель направления ПИБ',
   (SELECT id FROM directions WHERE name = 'Промышленная ИБ'), 4500, true);

-- Insert regular employees
INSERT INTO employees (id, email, full_name, position, direction_id, manager_id, hourly_rate, is_active) VALUES
  (uuid_generate_v4(), 'employee1@credos.ru', 'Сидоров С.С.', 'Специалист по ИБ',
   (SELECT id FROM directions WHERE name = 'Информационная безопасность'),
   (SELECT id FROM employees WHERE email = 'manager.ib@credos.ru'), 3000, true),
  (uuid_generate_v4(), 'employee2@credos.ru', 'Козлов К.К.', 'Инженер по ПИБ',
   (SELECT id FROM directions WHERE name = 'Промышленная ИБ'),
   (SELECT id FROM employees WHERE email = 'manager.pib@credos.ru'), 2800, true);

-- Insert projects
INSERT INTO projects (id, name, description, direction_id, manager_id, status, budget, start_date) VALUES
  (uuid_generate_v4(), 'Внедрение СЭД', 'Внедрение системы электронного документооборота',
   (SELECT id FROM directions WHERE name = 'Информационная безопасность'),
   (SELECT id FROM employees WHERE email = 'manager.ib@credos.ru'),
   'active', 500000, '2024-01-01'),
  (uuid_generate_v4(), 'Аудит ИБ', 'Комплексный аудит информационной безопасности',
   (SELECT id FROM directions WHERE name = 'Аудит'),
   (SELECT id FROM employees WHERE email = 'manager.ib@credos.ru'),
   'active', 300000, '2024-01-15');

-- Insert tasks
INSERT INTO tasks (id, project_id, name, description, assignee_id, status, estimated_hours, due_date) VALUES
  (uuid_generate_v4(), (SELECT id FROM projects WHERE name = 'Внедрение СЭД'),
   'Анализ требований', 'Проведение анализа требований к СЭД',
   (SELECT id FROM employees WHERE email = 'employee1@credos.ru'),
   'in_progress', 40, '2024-02-01'),
  (uuid_generate_v4(), (SELECT id FROM projects WHERE name = 'Аудит ИБ'),
   'Проверка политик ИБ', 'Аудит политик информационной безопасности',
   (SELECT id FROM employees WHERE email = 'employee2@credos.ru'),
   'todo', 60, '2024-02-15');
```

### Шаг 4: Настройка приложения

#### 4.1 Обновление package.json
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev",
    "db:migrate": "node scripts/migrate.js",
    "db:seed": "node scripts/seed.js"
  }
}
```

#### 4.2 Создание скрипта миграций (scripts/migrate.js)
```javascript
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read and execute migration files
    const migrationsDir = path.join(__dirname, '../prisma/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      console.log(`✓ Migration ${file} completed`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
```

#### 4.3 Обновление Railway конфигурации
```bash
# Добавление build команды
railway variables set RAILWAY_BUILD_COMMAND="npm run build"

# Добавление start команды  
railway variables set RAILWAY_START_COMMAND="npm start"

# Добавление порта
railway variables set PORT=3000
```

### Шаг 5: Деплой

#### 5.1 Первый деплой
```bash
# Деплой на Railway
railway up

# Проверка статуса
railway status

# Просмотр логов
railway logs
```

#### 5.2 Применение миграций
```bash
# Подключение к Railway
railway connect

# Выполнение миграций
railway run npm run db:migrate

# Добавление seed данных
railway run npm run db:seed
```

#### 5.3 Проверка деплоя
```bash
# Получение URL приложения
railway domain

# Проверка доступности
curl https://your-app.railway.app/api/health
```

---

## 🔧 Настройка домена

### 1. Кастомный домен
```bash
# Добавление домена в Railway
railway domain add your-domain.com

# Настройка DNS записей
# CNAME: www -> your-app.railway.app
# A: @ -> Railway IP
```

### 2. SSL сертификат
- Railway автоматически выдает SSL сертификаты
- Обновление происходит автоматически
- Поддержка Let's Encrypt

---

## 📊 Мониторинг

### 1. Railway Dashboard
- **Метрики** - CPU, Memory, Network
- **Логи** - в реальном времени
- **Деплои** - история развертываний
- **Переменные** - управление env vars

### 2. Настройка алертов
```bash
# Добавление уведомлений
railway notifications add email your-email@credos.ru

# Настройка алертов по ресурсам
railway alerts add cpu --threshold 80
railway alerts add memory --threshold 85
```

---

## 🔒 Безопасность

### 1. Переменные окружения
```bash
# Секретные переменные
railway variables set NEXTAUTH_SECRET=$(openssl rand -base64 32)
railway variables set JWT_SECRET=$(openssl rand -base64 32)

# Проверка переменных
railway variables
```

### 2. Доступ к базе данных
```bash
# Подключение к PostgreSQL
railway connect postgresql

# Выполнение SQL команд
psql $DATABASE_URL
```

---

## 🚨 Troubleshooting

### 1. Частые проблемы

#### Проблема: Build fails
```bash
# Проверка логов
railway logs --build

# Решение: Проверить package.json и зависимости
```

#### Проблема: Database connection error
```bash
# Проверка DATABASE_URL
railway variables get DATABASE_URL

# Решение: Пересоздать переменную
railway variables set DATABASE_URL="new-connection-string"
```

#### Проблема: App не запускается
```bash
# Проверка логов приложения
railway logs

# Решение: Проверить start команду и порт
```

### 2. Полезные команды
```bash
# Перезапуск приложения
railway redeploy

# Просмотр переменных окружения
railway variables

# Подключение к контейнеру
railway shell

# Просмотр метрик
railway metrics
```

---

## 📈 Оптимизация

### 1. Производительность
- **Build cache** - кеширование зависимостей
- **Image optimization** - оптимизация изображений Next.js
- **CDN** - статические ресурсы через Railway CDN

### 2. Масштабирование
- **Auto-scaling** - автоматическое масштабирование
- **Resource limits** - настройка лимитов ресурсов
- **Database scaling** - масштабирование PostgreSQL

---

## 🔄 CI/CD Pipeline

### 1. GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 2. Railway GitHub Integration
- **Автоматический деплой** при push в main
- **Preview deployments** для pull requests
- **Rollback** к предыдущим версиям

---

## 📞 Поддержка

### 1. Railway Support
- **Документация** - [docs.railway.app](https://docs.railway.app)
- **Discord** - [discord.gg/railway](https://discord.gg/railway)
- **GitHub** - [github.com/railwayapp](https://github.com/railwayapp)

### 2. Мониторинг
- **Status Page** - [status.railway.app](https://status.railway.app)
- **Uptime monitoring** - настройка внешнего мониторинга
- **Error tracking** - интеграция с Sentry

---

*Документ обновляется по мере развития проекта*
