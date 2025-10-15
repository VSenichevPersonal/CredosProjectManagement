# 🏗️ Senior Architect - Список доработок
**Система:** Credos Project Management  
**Цель:** Конкурировать с Timetta  
**Приоритет:** Production-Ready Architecture  
**От:** Product Owner  
**Кому:** Senior Architect

---

## 🎯 EXECUTIVE SUMMARY

**Текущее состояние:** Система работает, но требует архитектурных улучшений  
**Оценка:** 8.5/10 → цель 9.5/10  
**Timeline:** 1-2 недели  
**Risk Level:** Medium

---

## 🔴 КРИТИЧНЫЕ ДОРАБОТКИ (P0)

### 1. Реализовать редактирование (Edit) для всех сущностей
**Priority:** P0 - CRITICAL  
**Effort:** 2-3 дня  
**Impact:** HIGH

**Что сделать:**
1. Создать edit диалоги для:
   - Projects
   - Employees
   - Directions
   - Tasks
   - Time Entries
2. Pre-fill формы текущими данными
3. PUT запросы к API
4. Обновление UI после сохранения
5. Toast уведомления

**Acceptance Criteria:**
- [ ] Клик Edit → диалог с данными
- [ ] Изменение полей → сохраняется
- [ ] PUT /api/[entity]/[id] работает
- [ ] UI обновляется без перезагрузки
- [ ] Toast "Успешно обновлено"

**Files to modify:**
```
src/app/(dashboard)/projects/page.tsx
src/app/(dashboard)/admin/dictionaries/directions/page.tsx
src/app/(dashboard)/admin/dictionaries/employees/page.tsx
src/app/(dashboard)/admin/dictionaries/projects/page.tsx
src/app/(dashboard)/my-tasks/page.tsx
```

---

### 2. Связать auth.user с employees
**Priority:** P0 - CRITICAL  
**Effort:** 1-2 дня  
**Impact:** HIGH

**Проблема:**
Сейчас есть две отдельные сущности:
- `auth.user` (аутентификация)
- `employees` (бизнес-логика)

**Что сделать:**
1. Добавить поле `user_id` в таблицу `employees`
2. При регистрации создавать и user, и employee
3. Связать их foreign key
4. В ExecutionContext получать employee через user
5. Обновить middleware

**SQL Migration:**
```sql
ALTER TABLE employees ADD COLUMN user_id UUID REFERENCES auth."user"(id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
```

**Acceptance Criteria:**
- [ ] Регистрация → создается user + employee
- [ ] Login → получаем employeeId
- [ ] ExecutionContext.employeeId корректен
- [ ] Фильтрация "мои часы" работает

---

### 3. Реализовать batch operations
**Priority:** P0 - CRITICAL  
**Effort:** 2-3 дня  
**Impact:** MEDIUM

**Что сделать:**
1. Множественное выделение в таблицах
2. Batch delete
3. Batch update (изменение статуса)
4. Bulk import/export

**Example UI:**
```tsx
- [ ] Проект А
- [x] Проект Б  ← выбран
- [x] Проект В  ← выбран

[Удалить выбранные (2)] [Изменить статус]
```

**API:**
```typescript
POST /api/projects/batch-delete
Body: { ids: ["uuid1", "uuid2"] }

POST /api/projects/batch-update
Body: { ids: [...], updates: { status: "active" } }
```

---

## 🟡 ВАЖНЫЕ ДОРАБОТКИ (P1)

### 4. Добавить React Query для кеширования
**Priority:** P1 - HIGH  
**Effort:** 2-3 дня  
**Impact:** HIGH (UX improvement)

**Зачем:**
- Кеширование данных
- Автоматический refetch
- Optimistic updates
- Background refresh
- Offline support

**Что сделать:**
```bash
npm install @tanstack/react-query
```

```tsx
// src/lib/providers/query-provider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Использование:
const { data, isLoading, error } = useQuery({
  queryKey: ['projects'],
  queryFn: () => fetch('/api/projects').then(r => r.json())
})
```

**Refactor:**
- Заменить `useState` + `useEffect` на `useQuery`
- Использовать `useMutation` для создания
- Добавить `invalidateQueries` после операций

---

### 5. Реализовать server-side search и filtering
**Priority:** P1 - HIGH  
**Effort:** 2-3 дня  
**Impact:** MEDIUM

**Проблема:**
Сейчас поиск работает только на загруженных данных (client-side).  
Если 1000 проектов → загружаем все 1000.

**Решение:**
```typescript
GET /api/projects?search=audit&status=active&directionId=123&page=1&limit=20
```

**Что сделать:**
1. Добавить search параметры в API
2. Фильтрация на уровне SQL:
   ```sql
   WHERE name ILIKE '%search%' 
   AND status = 'active'
   AND direction_id = '...'
   ```
3. Pagination на backend
4. Обновить frontend для передачи параметров

**Acceptance Criteria:**
- [ ] Поиск отправляется на backend
- [ ] SQL использует ILIKE для поиска
- [ ] Возвращается только нужная страница
- [ ] Total count корректен

---

### 6. Добавить валидацию на клиенте (Zod)
**Priority:** P1 - HIGH  
**Effort:** 1-2 дня  
**Impact:** MEDIUM

**Что сделать:**
1. Создать shared Zod schemas
2. Использовать в формах:
   ```tsx
   import { projectSchema } from '@/lib/validators/project'
   
   const errors = projectSchema.safeParse(formData)
   if (!errors.success) {
     setFieldErrors(errors.error.flatten())
   }
   ```
3. Показывать ошибки под полями
4. Real-time validation при вводе

---

### 7. Улучшить обработку ошибок
**Priority:** P1 - HIGH  
**Effort:** 1 день  
**Impact:** MEDIUM

**Что добавить:**
```typescript
// src/lib/errors/app-errors.ts
export class ValidationError extends Error {}
export class NotFoundError extends Error {}
export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

// В API:
if (!project) {
  throw new NotFoundError("Проект не найден")
}

// В frontend:
catch (error) {
  if (error instanceof ValidationError) {
    // Показать поля с ошибками
  } else if (error instanceof NotFoundError) {
    // Toast + редирект
  }
}
```

---

## 🟢 СРЕДНИЕ ДОРАБОТКИ (P2)

### 8. Добавить unit & integration тесты
**Priority:** P2 - MEDIUM  
**Effort:** 3-5 дней  
**Impact:** HIGH (quality)

**Stack:**
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

**Что тестировать:**
1. **Unit tests:**
   - Validators
   - Services
   - Utilities
2. **Integration tests:**
   - API routes
   - Database operations
3. **E2E tests:**
   - Playwright для критичных flows

**Target coverage:** >80%

---

### 9. Реализовать activity log (аудит)
**Priority:** P2 - MEDIUM  
**Effort:** 2 дня  
**Impact:** MEDIUM

**Что сделать:**
1. Middleware для логирования всех операций
2. Сохранение в `activity_log` таблицу
3. Страница `/admin/activity-log` для просмотра
4. Фильтрация по пользователю, действию, дате

**Example:**
```typescript
// После каждой операции:
await ctx.db.activityLog.create({
  userId: ctx.userId,
  action: 'project.create',
  entityType: 'project',
  entityId: project.id,
  metadata: { name: project.name }
})
```

---

### 10. Добавить notifications систему
**Priority:** P2 - MEDIUM  
**Effort:** 2-3 дня  
**Impact:** MEDIUM

**Что сделать:**
1. API для notifications:
   ```
   GET /api/notifications
   PUT /api/notifications/[id]/read
   DELETE /api/notifications/[id]
   ```
2. NotificationBell компонент в хедере
3. Dropdown с уведомлениями
4. Badge с количеством непрочитанных
5. Auto-refresh каждые 30 сек

**Triggers:**
- Назначена задача → уведомление assignee
- Часы утверждены → уведомление employee
- Проект создан → уведомление team

---

### 11. Оптимизировать database queries
**Priority:** P2 - MEDIUM  
**Effort:** 2-3 дня  
**Impact:** HIGH (performance)

**Что сделать:**
1. **Добавить JOIN запросы:**
   ```sql
   -- Вместо N+1:
   SELECT p.*, d.name as direction_name, e.full_name as manager_name
   FROM projects p
   LEFT JOIN directions d ON p.direction_id = d.id
   LEFT JOIN employees e ON p.manager_id = e.id
   ```

2. **Добавить eager loading:**
   ```typescript
   projects.getAll(ctx, { include: ['direction', 'manager'] })
   ```

3. **Использовать EXPLAIN ANALYZE:**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM projects WHERE ...
   ```

4. **Добавить missing indexes:**
   - `projects.status`
   - `employees.is_active`
   - `time_entries.date`

---

### 12. Реализовать экспорт данных (CSV/Excel)
**Priority:** P2 - MEDIUM  
**Effort:** 1-2 дня  
**Impact:** MEDIUM

**Libraries:**
```bash
npm install papaparse xlsx
```

**Что сделать:**
1. В UniversalDataTable работает кнопка Export
2. Форматы: CSV, XLSX
3. Включать все видимые колонки
4. Правильное форматирование дат и чисел
5. Encoding: UTF-8 with BOM (для Excel)

---

## 🔵 НИЗКИЕ ДОРАБОТКИ (P3)

### 13. WebSocket для real-time updates
**Priority:** P3 - LOW  
**Effort:** 3-5 дней  
**Impact:** LOW (nice to have)

**Stack:**
```bash
npm install socket.io socket.io-client
```

**Use cases:**
- Другой пользователь создал проект → у всех обновляется
- Часы утверждены → real-time notification
- Кто-то редактирует сущность → показываем lock

---

### 14. Добавить charts и визуализации
**Priority:** P3 - LOW  
**Effort:** 2-3 дня  
**Impact:** MEDIUM (analytics)

**Libraries:**
```bash
npm install recharts
```

**Что добавить:**
- Dashboard с графиками
- Рентабельность - bar chart
- Распределение часов - pie chart
- Тренды - line chart

---

### 15. Мобильная версия
**Priority:** P3 - LOW  
**Effort:** 5-7 дней  
**Impact:** LOW

**Что сделать:**
- Responsive tables → карточки на mobile
- Боковое меню → burger menu
- Touch-friendly кнопки
- PWA support

---

## 📋 АРХИТЕКТУРНЫЕ УЛУЧШЕНИЯ

### 16. Добавить кеширование Redis (опционально)
**Priority:** P3 - LOW  
**Effort:** 2-3 дня

**Зачем:**
- Кешировать частые запросы
- Уменьшить нагрузку на БД
- Быстрее отдавать данные

**Stack:**
```bash
npm install ioredis
```

**Cache strategy:**
```typescript
// Cache GET /api/projects на 5 минут
// Invalidate при POST/PUT/DELETE
```

---

### 17. Добавить rate limiting
**Priority:** P2 - MEDIUM  
**Effort:** 1 день

**Libraries:**
```bash
npm install @upstash/ratelimit
```

**Защита:**
- 100 requests per minute per user
- 1000 requests per hour per IP
- Блокировка при превышении

---

### 18. Добавить мониторинг и alerting
**Priority:** P1 - HIGH  
**Effort:** 2 дня

**Stack:**
- **Sentry** - error tracking
- **LogRocket** - session replay
- **Uptime Robot** - availability monitoring
- **Railway metrics** - performance

**Что мониторить:**
- API response times
- Error rates
- Database query performance
- Memory usage
- CPU usage

**Alerts:**
- Error rate > 1% → email
- Response time > 5s → Slack
- DB down → SMS

---

### 19. Улучшить типизацию TypeScript
**Priority:** P2 - MEDIUM  
**Effort:** 2-3 дня

**Что сделать:**
1. **Strict mode:**
   ```json
   // tsconfig.json
   {
     "strict": true,
     "noImplicitAny": true,
     "strictNullChecks": true
   }
   ```

2. **Branded types:**
   ```typescript
   type ProjectId = string & { __brand: 'ProjectId' }
   type EmployeeId = string & { __brand: 'EmployeeId' }
   ```

3. **Type guards:**
   ```typescript
   function isProject(x: unknown): x is Project {
     return typeof x === 'object' && 'name' in x
   }
   ```

4. **Discriminated unions:**
   ```typescript
   type ApiResponse<T> =
     | { success: true; data: T }
     | { success: false; error: string }
   ```

---

### 20. Оптимизировать bundle size
**Priority:** P2 - MEDIUM  
**Effort:** 1 день

**Что сделать:**
1. **Code splitting:**
   ```tsx
   const HeavyComponent = lazy(() => import('./HeavyComponent'))
   ```

2. **Tree shaking:**
   - Проверить unused exports
   - Удалить мертвый код

3. **Dynamic imports:**
   ```tsx
   const Chart = dynamic(() => import('recharts'), { ssr: false })
   ```

4. **Analyze:**
   ```bash
   npm run build -- --analyze
   ```

**Target:** < 500KB initial JS bundle

---

### 21. Добавить E2E тесты с Playwright
**Priority:** P2 - MEDIUM  
**Effort:** 3-5 дней

**Setup:**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Critical tests:**
```typescript
test('Create project flow', async ({ page }) => {
  await page.goto('/projects')
  await page.click('text=Создать проект')
  await page.fill('#name', 'Test Project')
  // ...
  await page.click('text=Создать')
  await expect(page.locator('text=Test Project')).toBeVisible()
})
```

**Coverage:**
- [ ] Auth flow
- [ ] Create project flow
- [ ] Create employee flow
- [ ] Time tracking flow
- [ ] Analytics flow

---

### 22. Улучшить ExecutionContext
**Priority:** P2 - MEDIUM  
**Effort:** 1-2 дня

**Что добавить:**
```typescript
interface ExecutionContext {
  // Существующее...
  
  // Новое:
  tenant?: Tenant          // Multi-tenancy support
  transaction?: Transaction // DB transactions
  cache: CacheService      // Caching layer
  events: EventEmitter     // Event bus
  metrics: MetricsCollector // Performance metrics
}
```

**Benefits:**
- Transactional operations
- Event-driven architecture
- Performance tracking
- Multi-tenancy ready

---

### 23. Добавить database transactions
**Priority:** P1 - HIGH  
**Effort:** 2 дня

**Проблема:**
Сейчас нет транзакций. Если создание проекта + членов команды → может быть partial failure.

**Решение:**
```typescript
await ctx.db.transaction(async (tx) => {
  const project = await tx.projects.create(data)
  await tx.projectMembers.createMany(members)
  await tx.activityLog.create({ action: 'project.create' })
  // Все или ничего!
})
```

---

### 24. Добавить soft delete везде
**Priority:** P2 - MEDIUM  
**Effort:** 1 день

**Что сделать:**
1. Добавить `deleted_at` во все таблицы
2. Изменить DELETE на UPDATE deleted_at
3. Фильтровать deleted в SELECT
4. Добавить endpoint для восстановления

**SQL:**
```sql
ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMPTZ;
-- etc

-- Views для активных записей:
CREATE VIEW active_projects AS 
SELECT * FROM projects WHERE deleted_at IS NULL;
```

---

### 25. Реализовать audit trail
**Priority:** P2 - MEDIUM  
**Effort:** 2-3 дня

**Что сделать:**
1. Логировать ВСЕ изменения:
   ```typescript
   // Before update:
   const oldProject = await db.projects.getById(id)
   
   // After update:
   const newProject = await db.projects.update(id, data)
   
   // Save diff:
   await db.auditLog.create({
     entity: 'project',
     entityId: id,
     changes: diff(oldProject, newProject),
     userId: ctx.userId
   })
   ```

2. Страница history для каждой сущности
3. "Кто когда что изменил"

---

## 🔧 ТЕХНИЧЕСКИЕ УЛУЧШЕНИЯ

### 26. Добавить middleware цепочку
**Priority:** P2 - MEDIUM  
**Effort:** 1-2 дня

**Что сделать:**
```typescript
// src/middleware.ts
export const middleware = chain([
  withAuth(),
  withLogging(),
  withRateLimit(),
  withCors(),
  withMetrics(),
])
```

**Каждый middleware:**
- Логирование запросов
- Rate limiting
- CORS headers
- Performance metrics
- Error handling

---

### 27. Database connection pooling
**Priority:** P1 - HIGH  
**Effort:** 1 день

**Проблема:**
Каждый запрос создает новое подключение.

**Решение:**
```typescript
// src/lib/db/pool.ts
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

**Benefits:**
- Меньше latency
- Меньше нагрузка на БД
- Лучше performance

---

### 28. Добавить GraphQL (опционально)
**Priority:** P3 - LOW  
**Effort:** 5-7 дней

**Зачем:**
- Гибкие запросы
- Fetching только нужных полей
- Меньше over-fetching
- Лучше DX для frontend

**Stack:**
```bash
npm install graphql apollo-server-micro @apollo/client
```

**Пример:**
```graphql
query GetProject($id: ID!) {
  project(id: $id) {
    id
    name
    direction {
      name
      budget
    }
    members {
      employee {
        fullName
        email
      }
    }
  }
}
```

---

## 📊 DATABASE IMPROVEMENTS

### 29. Добавить материализованные представления
**Priority:** P2 - MEDIUM  
**Effort:** 1-2 дня

**Для analytics:**
```sql
CREATE MATERIALIZED VIEW project_profitability AS
SELECT 
  p.id,
  p.name,
  SUM(te.hours * e.default_hourly_rate) as salary_cost,
  COALESCE(SUM(rm.amount), 0) as revenue,
  -- ... расчеты
FROM projects p
LEFT JOIN time_entries te ON te.project_id = p.id
LEFT JOIN employees e ON te.employee_id = e.id
LEFT JOIN finance.revenue_manual rm ON rm.project_id = p.id
GROUP BY p.id, p.name;

-- Refresh:
REFRESH MATERIALIZED VIEW project_profitability;
```

**Benefits:**
- Быстрые аналитические запросы
- Меньше нагрузка на БД
- Предрасчитанные метрики

---

### 30. Добавить full-text search
**Priority:** P3 - LOW  
**Effort:** 1-2 дня

**PostgreSQL:**
```sql
-- Add tsvector column
ALTER TABLE projects ADD COLUMN search_vector tsvector;

-- Update trigger
CREATE TRIGGER projects_search_update 
BEFORE INSERT OR UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.russian', name, description);

-- Index
CREATE INDEX idx_projects_search ON projects USING GIN(search_vector);

-- Search:
SELECT * FROM projects 
WHERE search_vector @@ to_tsquery('russian', 'аудит & безопасность');
```

---

## 🎯 АРХИТЕКТУРНЫЕ ПАТТЕРНЫ

### 31. Repository Pattern (опционально)
**Priority:** P3 - LOW  
**Effort:** 3-5 дней

**Текущее:**
```typescript
ctx.db.projects.create()
```

**С Repository:**
```typescript
// src/repositories/project-repository.ts
export class ProjectRepository {
  async findAll(filters?: ProjectFilters): Promise<Project[]>
  async findById(id: string): Promise<Project | null>
  async create(data: CreateProjectDTO): Promise<Project>
  async update(id: string, data: UpdateProjectDTO): Promise<Project>
  async delete(id: string): Promise<void>
  
  // Advanced queries:
  async findByDateRange(start: Date, end: Date): Promise<Project[]>
  async findProfitable(): Promise<Project[]>
  async findOverBudget(): Promise<Project[]>
}
```

---

### 32. CQRS Pattern (advanced)
**Priority:** P3 - LOW  
**Effort:** 7-10 дней

**Concept:**
- **Commands** - изменяют данные (POST, PUT, DELETE)
- **Queries** - читают данные (GET)

**Separate models:**
```typescript
// Write model (normalized):
interface ProjectWriteModel { ... }

// Read model (denormalized):
interface ProjectReadModel {
  ...project
  directionName: string  // pre-joined
  managerName: string    // pre-joined
  totalHours: number     // pre-calculated
}
```

**Benefits:**
- Оптимизация чтения
- Оптимизация записи
- Scalability

---

## 🚀 PERFORMANCE OPTIMIZATIONS

### 33. Добавить CDN для статики
**Priority:** P2 - MEDIUM  
**Effort:** 1 день

**Что сделать:**
1. Railway → Cloudflare CDN
2. Cache static assets
3. Compress images
4. Optimize fonts

---

### 34. Lazy loading и code splitting
**Priority:** P2 - MEDIUM  
**Effort:** 1-2 дня

**Что сделать:**
```tsx
// Heavy components
const Analytics = lazy(() => import('./analytics'))
const Charts = lazy(() => import('./charts'))

// Route-based splitting (уже есть в Next.js)
// но можно улучшить с dynamic imports
```

---

### 35. Оптимизировать изображения
**Priority:** P3 - LOW  
**Effort:** 1 день

**Next.js Image:**
```tsx
import Image from 'next/image'

<Image 
  src="/logo.png" 
  width={100} 
  height={100}
  alt="Logo"
  priority
/>
```

**Benefits:**
- Автоматическая оптимизация
- Lazy loading
- Responsive images
- WebP format

---

## 📚 ДОКУМЕНТАЦИЯ

### 36. API Documentation (Swagger/OpenAPI)
**Priority:** P2 - MEDIUM  
**Effort:** 2-3 дня

**Stack:**
```bash
npm install swagger-jsdoc swagger-ui-react
```

**Что создать:**
- Swagger UI на `/api/docs`
- Описание всех endpoints
- Request/Response schemas
- Authentication
- Try it out functionality

---

### 37. Разработать Component Library
**Priority:** P3 - LOW  
**Effort:** 3-5 дней

**Что сделать:**
1. Storybook для компонентов
2. Документация каждого компонента
3. Props tables
4. Examples
5. Design tokens

```bash
npm install --save-dev @storybook/react
```

---

### 38. Создать Developer Documentation
**Priority:** P2 - MEDIUM  
**Effort:** 2-3 дня

**Что документировать:**
- Architecture overview
- Database schema
- API reference
- Component library
- Deployment guide
- Contributing guide
- Code style guide

---

## 🔒 БЕЗОПАСНОСТЬ

### 39. Добавить RBAC (Role-Based Access Control)
**Priority:** P1 - HIGH  
**Effort:** 2-3 дня

**Текущее:** Базовая проверка прав  
**Нужно:** Полноценный RBAC

**Что сделать:**
1. Таблица roles:
   ```sql
   CREATE TABLE roles (
     id UUID PRIMARY KEY,
     name VARCHAR(50) UNIQUE,
     permissions JSONB
   );
   
   CREATE TABLE employee_roles (
     employee_id UUID REFERENCES employees(id),
     role_id UUID REFERENCES roles(id),
     PRIMARY KEY (employee_id, role_id)
   );
   ```

2. Middleware для проверки:
   ```typescript
   await ctx.access.requireAny(['admin', 'project_manager'])
   await ctx.access.requireAll(['projects:read', 'projects:update'])
   ```

---

### 40. Добавить 2FA (Two-Factor Authentication)
**Priority:** P3 - LOW  
**Effort:** 3-5 дней

**Stack:**
```bash
npm install speakeasy qrcode
```

**Flow:**
1. Enable 2FA in settings
2. Scan QR code
3. Enter 6-digit code при login
4. Backup codes

---

## 💾 DATA MANAGEMENT

### 41. Backup и restore система
**Priority:** P1 - HIGH  
**Effort:** 1-2 дня

**Что сделать:**
1. Автоматические бекапы БД (Railway)
2. Script для restore
3. Тестирование восстановления
4. Point-in-time recovery

**Railway:**
```bash
# Daily backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

---

### 42. Data migration tools
**Priority:** P2 - MEDIUM  
**Effort:** 2 дня

**Что сделать:**
1. Версионирование схемы БД
2. Migration scripts
3. Rollback capability
4. Data seeding для dev/test

**Tool:**
```bash
npm install db-migrate db-migrate-pg
```

---

### 43. Import/Export полноценный
**Priority:** P2 - MEDIUM  
**Effort:** 2-3 дня

**Что реализовать:**
1. **Bulk import:**
   - Upload CSV/XLSX
   - Валидация данных
   - Preview перед импортом
   - Batch insert в БД

2. **Advanced export:**
   - Выбор полей
   - Фильтры
   - Форматы: CSV, XLSX, JSON, PDF
   - Email export results

---

## 📈 ANALYTICS IMPROVEMENTS

### 44. Advanced analytics dashboard
**Priority:** P2 - MEDIUM  
**Effort:** 5-7 дней

**Что добавить:**
1. **Ключевые метрики:**
   - Revenue vs Costs
   - Profit margins
   - Utilization rates
   - Project timelines

2. **Charts:**
   - Bar charts
   - Line charts
   - Pie charts
   - Heatmaps

3. **Filters:**
   - Date range
   - Direction
   - Project status
   - Employee

4. **Export reports:**
   - PDF reports
   - Excel dashboards

---

### 45. Predictive analytics (ML)
**Priority:** P3 - LOW  
**Effort:** 10+ дней

**Что можно предсказывать:**
- Project completion time
- Budget overruns
- Resource needs
- Profitability forecast

**Stack:**
- Python ML model
- API endpoint
- Frontend visualization

---

## 🎨 UX/UI IMPROVEMENTS

### 46. Dark mode
**Priority:** P3 - LOW  
**Effort:** 1-2 дня

**Что сделать:**
```tsx
// Theme provider
const [theme, setTheme] = useState<'light' | 'dark'>('light')

// Toggle in header
<Button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
  {theme === 'light' ? <Moon /> : <Sun />}
</Button>
```

---

### 47. Keyboard shortcuts
**Priority:** P3 - LOW  
**Effort:** 1-2 дня

**Shortcuts:**
- `Ctrl+K` - Global search
- `Ctrl+N` - New project
- `Ctrl+S` - Save form
- `Escape` - Close dialog
- `?` - Show shortcuts help

---

### 48. Onboarding и tour
**Priority:** P3 - LOW  
**Effort:** 2-3 дня

**Что добавить:**
- Welcome screen для новых пользователей
- Step-by-step tour
- Tooltips на важных элементах
- Help центр

---

## 🎯 ROADMAP PRIORITIES

### Week 1 (Immediate):
1. [P0] Редактирование для всех сущностей
2. [P0] Связать auth.user с employees
3. [P1] Database transactions
4. [P1] Server-side search

### Week 2:
5. [P1] React Query integration
6. [P1] RBAC полноценный
7. [P2] Unit & integration tests
8. [P2] Activity log

### Week 3-4:
9. [P2] Monitoring & alerting
10. [P2] Performance optimizations
11. [P2] Advanced analytics
12. [P3] Nice-to-have features

---

## 📊 SUCCESS METRICS

**После всех доработок система должна:**
- [ ] Response time < 500ms (p95)
- [ ] Uptime > 99.9%
- [ ] Error rate < 0.1%
- [ ] Test coverage > 80%
- [ ] Lighthouse score > 90
- [ ] Bundle size < 500KB
- [ ] TTI < 3s

**Тогда мы НЕ ХУЖЕ Timetta! 🏆**

---

## 📞 NEXT STEPS

**Для Senior Architect:**
1. Проанализировать этот список
2. Приоритизировать задачи
3. Оценить effort
4. Создать спринты
5. Начать реализацию

**Timeline:** 2-4 недели до production-ready  
**Budget:** [TBD]  
**Team:** Senior Architect + QA Engineer

---

**LET'S COMPETE WITH TIMETTA! 🚀**

*Документ создан: Октябрь 2024*  
*Next review: После тестирования QA*
