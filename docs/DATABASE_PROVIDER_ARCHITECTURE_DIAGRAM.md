# 📐 Диаграмма архитектуры DatabaseProvider

## 🔴 Текущее состояние (BROKEN)

```
┌──────────────────────────────────────────────────────────────────┐
│                        API Routes                                 │
│  /api/directions/route.ts, /api/employees/route.ts, etc.        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ createExecutionContext(request)
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│                    ExecutionContext                               │
│  { user, db, logger, access, requestId, timestamp }              │
│                                                                   │
│  db: DatabaseProvider ← получен из getDatabaseProvider()         │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ передаётся в сервисы
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│                      Service Layer                                │
│  DirectionService, EmployeeService, ProjectService, etc.         │
│                                                                   │
│  ❌ ПРОБЛЕМА: Использует ctx.db.query()                          │
│     const result = await ctx.db.query(sql, params)               │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ вызывает несуществующий метод
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│               DatabaseProvider Interface                          │
│  (src/providers/database-provider.interface.ts)                  │
│                                                                   │
│  ❌ НЕТ: query<T>(sql, params): Promise<QueryResult<T>>          │
│                                                                   │
│  ✅ ЕСТЬ:                                                         │
│    - directions: { getAll(), getById(), create(), ... }          │
│    - employees: { getAll(), getById(), create(), ... }           │
│    - projects: { getAll(), getById(), create(), ... }            │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ реализован как
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│            SimpleDatabaseProvider (STUB!)                         │
│  (src/providers/simple-provider.ts)                              │
│                                                                   │
│  directions = {                                                   │
│    async getAll() { return [] }  ← ❌ Всегда пустой!             │
│  }                                                                │
│                                                                   │
│  ❌ НЕТ: query() метода                                           │
│  ❌ НЕТ: подключения к реальной БД                                │
└──────────────────────────────────────────────────────────────────┘

                            ⚠️ BUILD FAILS ⚠️
           Type error: Property 'query' does not exist
```

---

## ❌ Option A: Быстрый фикс (НЕ РЕКОМЕНДУЕТСЯ)

```
┌──────────────────────────────────────────────────────────────────┐
│                      Service Layer                                │
│  DirectionService, EmployeeService, ProjectService               │
│                                                                   │
│  const result = await ctx.db.query(sql, params)  ← всё ещё так   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│               DatabaseProvider Interface                          │
│                                                                   │
│  ⚠️ ДОБАВЛЕН: query<T>(sql, params): Promise<QueryResult<T>>     │
│              @deprecated - Use repositories instead              │
│                                                                   │
│  directions: { getAll(), getById(), ... }  ← игнорируются        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│            SimpleDatabaseProvider + query()                       │
│                                                                   │
│  async query(sql, params) {                                       │
│    // Вариант 1: Прямой Supabase (нарушает архитектуру)          │
│    const supabase = createServerClient()                         │
│    return await supabase.rpc('exec_sql', { sql, params })        │
│                                                                   │
│    // Вариант 2: pg client (требует env vars)                    │
│                                                                   │
│    // ❌ В любом случае — костыль!                                │
│  }                                                                │
└──────────────────────────────────────────────────────────────────┘

ПРОБЛЕМЫ:
❌ Нарушает Repository Pattern
❌ Обходит type safety
❌ Создаёт технический долг
❌ Противоречит истории (query был REMOVED)
❌ Сложно тестировать
```

---

## ✅ Option B: Repository Pattern (РЕКОМЕНДУЕТСЯ)

```
┌──────────────────────────────────────────────────────────────────┐
│                        API Routes                                 │
│  /api/directions/route.ts, /api/employees/route.ts              │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│                    ExecutionContext                               │
│  db: DatabaseProvider ← SupabaseDatabaseProvider                 │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│                 Service Layer (REFACTORED)                        │
│  DirectionService, EmployeeService, ProjectService               │
│                                                                   │
│  ✅ ПРАВИЛЬНО:                                                    │
│  const data = await ctx.db.directions.getAll(ctx, filters)       │
│  const total = await ctx.db.directions.getCount(ctx, filters)    │
│                                                                   │
│  ❌ УБРАНО: ctx.db.query(sql, params)                             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│         DatabaseProvider Interface (EXTENDED)                     │
│  (src/providers/database-provider.interface.ts)                  │
│                                                                   │
│  directions: DirectionsRepository {                               │
│    getAll(ctx, filters?: DirectionFilters): Promise<Direction[]> │
│    getCount(ctx, filters?: DirectionFilters): Promise<number>    │
│    getById(ctx, id): Promise<Direction | null>                   │
│    create(ctx, data): Promise<Direction>                         │
│    update(ctx, id, data): Promise<Direction>                     │
│    delete(ctx, id): Promise<void>                                │
│  }                                                                │
│                                                                   │
│  employees: EmployeesRepository { ... }                           │
│  projects: ProjectsRepository { ... }                             │
│  tasks: TasksRepository { ... }                                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│           SupabaseDatabaseProvider (FULL IMPL)                    │
│  (src/providers/supabase-provider.ts)                            │
│                                                                   │
│  directions = new SupabaseDirectionsRepository(supabase)         │
│  employees = new SupabaseEmployeesRepository(supabase)           │
│  projects = new SupabaseProjectsRepository(supabase)             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│          SupabaseDirectionsRepository                             │
│  (src/providers/repositories/directions-repository.ts)           │
│                                                                   │
│  async getAll(ctx, filters) {                                     │
│    let query = this.supabase                                      │
│      .from('directions')                                          │
│      .select('*')                                                 │
│      .eq('is_active', true)                                       │
│                                                                   │
│    if (filters?.search) {                                         │
│      query = query.or(                                            │
│        `name.ilike.%${filters.search}%,` +                        │
│        `description.ilike.%${filters.search}%`                    │
│      )                                                             │
│    }                                                               │
│                                                                   │
│    const { data, error } = await query                            │
│      .range(offset, offset + limit - 1)                           │
│                                                                   │
│    return data.map(mapDirectionFromDb)                            │
│  }                                                                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓
                    ┌────────────────┐
                    │    Supabase    │
                    │   PostgreSQL   │
                    └────────────────┘

ПРЕИМУЩЕСТВА:
✅ Type-safe (полная типизация)
✅ Testable (легко мокировать репозитории)
✅ Maintainable (логика инкапсулирована)
✅ Repository Pattern (правильная архитектура)
✅ Соответствует истории решений
✅ Supabase PostgREST автоматически оптимизирует
```

---

## 📊 Пример: DirectionService до и после

### ❌ ДО (текущее состояние — broken):

```typescript
export class DirectionService {
  static async getAllDirections(ctx: ExecutionContext, filters?: DirectionFilters) {
    const whereClauses: string[] = ['is_active = true'];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (filters?.search) {
      whereClauses.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }
    
    const whereClause = `WHERE ${whereClauses.join(' AND ')}`;
    
    // ❌ ОШИБКА: query() не существует!
    const countQuery = `SELECT COUNT(*) as count FROM directions ${whereClause}`;
    const countResult = await ctx.db.query(countQuery, params);
    
    const dataQuery = `SELECT * FROM directions ${whereClause} LIMIT $2 OFFSET $3`;
    const result = await ctx.db.query(dataQuery, [...params, limit, offset]);
    
    return { data: result.rows, total };
  }
}
```

**Проблемы:**
- ❌ `ctx.db.query()` не существует
- ❌ Прямой SQL в сервисе
- ❌ Нет type safety для результатов
- ❌ Сложно тестировать
- ❌ Дублирование логики фильтров

---

### ✅ ПОСЛЕ (Option B — правильно):

```typescript
export class DirectionService {
  static async getAllDirections(
    ctx: ExecutionContext, 
    filters?: DirectionFilters
  ): Promise<{ data: Direction[]; total: number }> {
    ctx.logger.info('[DirectionService] getAllDirections', { filters });
    await ctx.access.require('directions:read');
    
    // ✅ Используем репозиторий
    const [data, total] = await Promise.all([
      ctx.db.directions.getAll(ctx, filters),
      ctx.db.directions.getCount(ctx, filters)
    ]);
    
    return { data, total };
  }
  
  static async getDirectionById(ctx: ExecutionContext, id: string) {
    await ctx.access.require('directions:read');
    return ctx.db.directions.getById(ctx, id);
  }
  
  static async createDirection(ctx: ExecutionContext, data: CreateDirectionDTO) {
    await ctx.access.require('directions:create');
    return ctx.db.directions.create(ctx, data);
  }
}
```

**Преимущества:**
- ✅ Type-safe (Direction[], number)
- ✅ Чистый код
- ✅ Легко тестировать (моки репозиториев)
- ✅ Логика фильтрации в репозитории
- ✅ Переиспользование

---

## 🔄 Repository Implementation

```typescript
// src/providers/repositories/directions-repository.ts
export class SupabaseDirectionsRepository implements DirectionsRepository {
  constructor(private supabase: SupabaseClient) {}
  
  async getAll(ctx: ExecutionContext, filters?: DirectionFilters): Promise<Direction[]> {
    ctx.logger.debug('[DirectionsRepo] getAll', { filters });
    
    let query = this.supabase
      .from('directions')
      .select('*')
      .eq('is_active', true);
    
    // Фильтр поиска
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,` +
        `description.ilike.%${filters.search}%,` +
        `code.ilike.%${filters.search}%`
      );
    }
    
    // Пагинация
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    query = query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) {
      ctx.logger.error('[DirectionsRepo] Query failed', { error });
      throw new Error(`Failed to fetch directions: ${error.message}`);
    }
    
    return data.map(mapDirectionFromDb);
  }
  
  async getCount(ctx: ExecutionContext, filters?: DirectionFilters): Promise<number> {
    let query = this.supabase
      .from('directions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,` +
        `description.ilike.%${filters.search}%,` +
        `code.ilike.%${filters.search}%`
      );
    }
    
    const { count, error } = await query;
    
    if (error) throw new Error(`Failed to count directions: ${error.message}`);
    
    return count || 0;
  }
}
```

---

## 🧪 Тестирование

### ❌ С query() — сложно:

```typescript
describe('DirectionService', () => {
  it('should filter directions', async () => {
    // ❌ Нужно мокировать query() с SQL
    const mockDb = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ count: 5 }] })  // для COUNT
        .mockResolvedValueOnce({ rows: mockDirections })  // для SELECT
    };
    
    // Сложно контролировать SQL, параметры, и т.д.
  });
});
```

### ✅ С репозиториями — легко:

```typescript
describe('DirectionService', () => {
  it('should filter directions', async () => {
    // ✅ Мокируем репозиторий
    const mockDirectionsRepo = {
      getAll: jest.fn().mockResolvedValue(mockDirections),
      getCount: jest.fn().mockResolvedValue(5)
    };
    
    const mockDb = {
      directions: mockDirectionsRepo
    };
    
    const ctx = createMockContext({ db: mockDb });
    
    const result = await DirectionService.getAllDirections(ctx, { 
      search: 'test' 
    });
    
    expect(result.data).toEqual(mockDirections);
    expect(result.total).toBe(5);
    expect(mockDirectionsRepo.getAll).toHaveBeenCalledWith(
      ctx, 
      { search: 'test' }
    );
  });
});
```

---

## 📈 Сравнение метрик

| Метрика | query() | Repository |
|---------|---------|------------|
| **Lines of Code (сервис)** | 50-80 | 10-20 |
| **Coupling** | High | Low |
| **Type Safety** | None | Full |
| **Test Complexity** | High | Low |
| **Maintainability** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Reusability** | None | High |
| **SQL Duplication** | Yes | No |

---

## 🎯 ИТОГОВАЯ РЕКОМЕНДАЦИЯ

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         ВЫБРАТЬ OPTION B: REPOSITORY PATTERN                │
│                                                             │
│  Причины:                                                   │
│  1. Архитектурно правильно                                  │
│  2. query() был удалён намеренно (REMOVED)                  │
│  3. SimpleDatabaseProvider — временная заглушка             │
│  4. 3-4 часа сейчас < 6+ часов потом                        │
│  5. Type safety + Testability критичны                      │
│                                                             │
│  Результат:                                                 │
│  ✅ Чистая архитектура                                       │
│  ✅ Нет технического долга                                   │
│  ✅ Легко поддерживать и расширять                           │
│  ✅ Production-ready код                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Prepared by:** AI Full-Stack Architect  
**Date:** 2025-10-15  
**Type:** Architecture Diagram & Comparison

