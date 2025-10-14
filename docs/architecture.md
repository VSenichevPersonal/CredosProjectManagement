# 🏗️ Architecture Guide

## 📋 Обзор архитектуры

**Credos Project Management** построена на принципах **Domain-Driven Design (DDD)** с использованием современных паттернов и технологий.

---

## 🎯 Архитектурные принципы

### 1. Domain-Driven Design (DDD)
- **Ubiquitous Language** - единый язык между бизнесом и кодом
- **Aggregates** - инкапсуляция бизнес-логики
- **Value Objects** - неизменяемые объекты значений
- **Repository Pattern** - абстракция доступа к данным
- **Event Sourcing** - для аудита и аналитики (планируется)

### 2. Clean Architecture
```
┌─────────────────────────────────────┐
│           Presentation Layer        │ ← UI Components, API Routes
├─────────────────────────────────────┤
│           Application Layer         │ ← Services, Use Cases
├─────────────────────────────────────┤
│            Domain Layer             │ ← Entities, Business Logic
├─────────────────────────────────────┤
│          Infrastructure Layer       │ ← Database, External APIs
└─────────────────────────────────────┘
```

### 3. LLM-Friendly Code
- **Понятные имена** - самоописывающий код
- **Структурированные файлы** - логическая организация
- **Подробные комментарии** - объяснение бизнес-логики
- **Консистентные паттерны** - предсказуемость

---

## 🔧 Ключевые компоненты

### 1. ExecutionContext
Центральный контекст выполнения операций:

```typescript
interface ExecutionContext {
  user: Employee                    // Текущий пользователь
  userId: string                   // ID пользователя
  employeeId: string              // ID сотрудника
  db: DatabaseProvider            // Провайдер БД
  logger: Logger                  // Логгер
  access: AccessControlService    // Контроль доступа
  requestId: string              // ID запроса
  timestamp: Date                // Время выполнения
  request?: Request              // HTTP запрос
}
```

**Преимущества**:
- Единая точка доступа к сервисам
- Автоматическое логирование
- Контроль доступа на уровне операций
- Трассировка запросов

### 2. Provider Architecture
Абстракция внешних зависимостей:

```typescript
interface DatabaseProvider {
  employees: EmployeeRepository
  directions: DirectionRepository
  projects: ProjectRepository
  tasks: TaskRepository
  timeEntries: TimeEntryRepository
  dashboard: DashboardRepository
  utils: UtilsRepository
}
```

**Преимущества**:
- Легкая замена реализаций
- Тестирование с mock провайдерами
- Единый интерфейс для всех источников данных

### 3. Service Layer (Thin Services)
Бизнес-логика в статических методах:

```typescript
export class TimeTrackingService {
  static async getTimeEntries(ctx: ExecutionContext, filters?: any): Promise<TimeEntry[]> {
    ctx.logger.info("[TimeTrackingService] getTimeEntries", { filters })
    await ctx.access.require('time_entries:read')
    
    const timeEntries = await ctx.db.timeEntries.getAll(ctx);
    // ... бизнес-логика ...
    
    ctx.logger.info("[TimeTrackingService] Time entries fetched", { count: timeEntries.length })
    return timeEntries;
  }
}
```

**Преимущества**:
- Чистая бизнес-логика без зависимостей
- Легкое тестирование
- Переиспользование в разных контекстах

---

## 🗄️ Слой данных

### 1. Domain Types
Централизованные типы домена:

```typescript
// src/types/domain/index.ts
export interface Employee {
  id: string
  email: string
  fullName: string
  position: string
  directionId: string
  managerId?: string
  hourlyRate: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

### 2. Repository Pattern
Абстракция доступа к данным:

```typescript
interface EmployeeRepository {
  getAll(ctx: ExecutionContext): Promise<Employee[]>
  getById(ctx: ExecutionContext, id: string): Promise<Employee | null>
  create(ctx: ExecutionContext, data: CreateEmployeeDTO): Promise<Employee>
  update(ctx: ExecutionContext, id: string, data: UpdateEmployeeDTO): Promise<Employee>
  delete(ctx: ExecutionContext, id: string): Promise<void>
}
```

### 3. Database Schema
PostgreSQL с оптимизированными индексами:

```sql
-- Основные таблицы
CREATE TABLE employees (...);
CREATE TABLE directions (...);
CREATE TABLE projects (...);
CREATE TABLE tasks (...);
CREATE TABLE time_entries (...);

-- Индексы для производительности
CREATE INDEX idx_time_entries_employee_date ON time_entries(employee_id, date);
CREATE INDEX idx_projects_direction_status ON projects(direction_id, status);
```

---

## 🌐 API Layer

### 1. RESTful Endpoints
Стандартизированные API routes:

```
GET    /api/time-entries           # Список с фильтрацией
POST   /api/time-entries           # Создание новой записи
GET    /api/time-entries/[id]      # Получение по ID
PATCH  /api/time-entries/[id]      # Обновление
DELETE /api/time-entries/[id]      # Удаление
```

### 2. Request/Response Format
Единообразная структура:

```typescript
// Request
{
  "employeeId": "uuid",
  "projectId": "uuid", 
  "date": "2024-01-15",
  "hours": 8.5,
  "description": "Разработка функционала"
}

// Response
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### 3. Error Handling
Централизованная обработка ошибок:

```typescript
export function handleApiError(error: unknown) {
  if (error instanceof ValidationError) {
    return Response.json({ error: error.message, code: "VALIDATION_ERROR" }, { status: 400 })
  }
  
  if (error instanceof AppError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.statusCode })
  }
  
  // ... другие типы ошибок
}
```

---

## 🎨 Presentation Layer

### 1. Component Architecture
Иерархическая структура компонентов:

```
components/
├── ui/                    # Базовые UI компоненты
│   ├── button.tsx
│   ├── input.tsx
│   └── dialog.tsx
├── layout/               # Компоненты макета
│   ├── app-layout.tsx
│   ├── app-sidebar.tsx
│   └── app-header.tsx
└── domain/               # Доменные компоненты
    ├── time-tracking/
    ├── projects/
    └── employees/
```

### 2. Design System
Консистентная дизайн-система:

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'credos-primary': '#2563eb',    // Credo-S Blue
        'credos-secondary': '#64748b',  // Gray
        'credos-accent': '#0ea5e9',     // Sky Blue
        'credos-muted': '#f1f5f9',      // Light Gray
        'credos-border': '#e2e8f0',     // Border Gray
      }
    }
  }
}
```

### 3. State Management
Локальное состояние с SWR для кеширования:

```typescript
import useSWR from 'swr'

function TimeEntriesList() {
  const { data, error, mutate } = useSWR('/api/time-entries', fetcher)
  
  if (error) return <div>Ошибка загрузки</div>
  if (!data) return <div>Загрузка...</div>
  
  return <TimeEntriesTable entries={data} onUpdate={mutate} />
}
```

---

## 🔒 Безопасность

### 1. Access Control
Ролевая модель доступа:

```typescript
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ['*'], // Все права
  manager: ['employees:read', 'projects:read', 'time_entries:approve'],
  employee: ['time_entries:create', 'time_entries:read_own'],
  // ...
}
```

### 2. Data Validation
Валидация на всех уровнях:

```typescript
// API level
const validatedData = validate(createTimeEntrySchema, requestBody)

// Service level  
if (dto.hours <= 0 || dto.hours > 24) {
  throw new Error('Количество часов должно быть от 0 до 24')
}

// Database level
CREATE TABLE time_entries (
  hours DECIMAL(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24)
);
```

### 3. Input Sanitization
Очистка пользовательского ввода:

```typescript
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Удаление HTML тегов
    .substring(0, 1000)   // Ограничение длины
}
```

---

## 📊 Мониторинг и логирование

### 1. Structured Logging
Структурированное логирование:

```typescript
export class LoggerServiceImpl implements Logger {
  info(message: string, meta?: any): void {
    console.log(`[${this.prefix}] INFO: ${message}`, meta || '')
  }
  
  error(message: string, meta?: any): void {
    console.error(`[${this.prefix}] ERROR: ${message}`, meta || '')
  }
}
```

### 2. Request Tracing
Трассировка запросов:

```typescript
export async function createExecutionContext(request: NextRequest): Promise<ExecutionContext> {
  const requestId = generateRequestId()
  
  return {
    // ...
    requestId,
    timestamp: new Date(),
    request
  }
}
```

### 3. Performance Monitoring
Метрики производительности:

```typescript
// В сервисах
const startTime = Date.now()
const result = await someOperation()
const duration = Date.now() - startTime

ctx.logger.info("[Service] Operation completed", { 
  duration: `${duration}ms`,
  resultCount: result.length 
})
```

---

## 🚀 Масштабируемость

### 1. Database Optimization
- **Индексы** для частых запросов
- **Партиционирование** больших таблиц
- **Connection pooling** для PostgreSQL
- **Read replicas** для аналитики

### 2. Caching Strategy
- **SWR** для клиентского кеширования
- **Redis** для серверного кеша (планируется)
- **CDN** для статических ресурсов

### 3. Code Splitting
- **Dynamic imports** для больших компонентов
- **Route-based splitting** в Next.js
- **Lazy loading** для неиспользуемого кода

---

## 🔄 Deployment Architecture

### 1. Railway Deployment
```
┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │────│   PostgreSQL    │
│   (Railway)     │    │   (Railway)     │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
                 │
    ┌─────────────────────────────┐
    │      Railway Platform       │
    │   (Auto-scaling, CDN)       │
    └─────────────────────────────┘
```

### 2. Environment Configuration
```typescript
// next.config.js
module.exports = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  }
}
```

### 3. CI/CD Pipeline
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
      - run: npm ci
      - run: npm run build
      - run: railway up
```

---

## 📈 Future Architecture

### 1. Microservices (Stage 3)
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Time Tracking  │  │   Project Mgmt  │  │    Analytics    │
│    Service      │  │    Service      │  │    Service      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │   (Railway)     │
                    └─────────────────┘
```

### 2. Event-Driven Architecture
- **Event Sourcing** для аудита
- **CQRS** для разделения чтения/записи
- **Message Queues** для асинхронной обработки

### 3. Advanced Monitoring
- **APM** (Application Performance Monitoring)
- **Distributed tracing**
- **Real-time alerts**
- **Business metrics dashboard**

---

*Архитектура эволюционирует вместе с требованиями проекта*
