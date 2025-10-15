# 🔴 HANDOFF: DatabaseProvider Architecture Issue

**Date:** 2025-10-15  
**Status:** 🔴 **CRITICAL - Railway Build Failing**  
**Priority:** P0  
**Context:** Stage 2 → Stage 3 Transition

---

## ⚠️ IMMEDIATE PROBLEM

**Railway build fails with:**
```
Type error: Property 'query' does not exist on type 'DatabaseProvider'
Location: ./src/services/direction-service.ts:43:38
```

**Root Cause:**
Service layer files использует `ctx.db.query()` метод, который НЕ определён в `DatabaseProvider` interface.

---

## 🏗️ CURRENT ARCHITECTURE

### **DatabaseProvider Interface:**
**Location:** `src/providers/database-provider.ts` (предположительно)

**Expected by Services:**
```typescript
interface DatabaseProvider {
  query(sql: string, params: any[]): Promise<{ rows: any[] }>
  // ... other methods
}
```

### **Service Layer Usage (Example):**
**File:** `src/services/direction-service.ts`

```typescript
export class DirectionService {
  static async getAllDirections(
    ctx: ExecutionContext,
    filters?: DirectionFilters
  ): Promise<{ data: Direction[]; total: number }> {
    // Builds SQL query with WHERE clauses
    const whereClauses: string[] = ['is_active = true'];
    const params: any[] = [];
    
    if (filters?.search) {
      whereClauses.push(`(name ILIKE $1 OR description ILIKE $1)`);
      params.push(`%${filters.search}%`);
    }
    
    const whereClause = `WHERE ${whereClauses.join(' AND ')}`;
    
    // ❌ THIS FAILS - query() method doesn't exist
    const countQuery = `SELECT COUNT(*) as count FROM directions ${whereClause}`;
    const countResult = await ctx.db.query(countQuery, params);
    
    // ❌ THIS ALSO FAILS
    const dataQuery = `SELECT * FROM directions ${whereClause} LIMIT $2 OFFSET $3`;
    const result = await ctx.db.query(dataQuery, [...params, limit, offset]);
    
    return { data: result.rows, total };
  }
}
```

**Similar pattern in:**
- ✅ `src/services/direction-service.ts` (P0)
- ✅ `src/services/employee-service.ts` (P0)
- ✅ `src/services/project-service.ts` (P0)
- ✅ `src/services/task-service.ts` (P0)
- ✅ `src/services/time-entry-service.ts` (P1)

---

## 🤔 ARCHITECTURAL QUESTION

### **Option A: Add `query()` to DatabaseProvider** ✅ RECOMMENDED

**Pros:**
- ✅ Гибкость для complex queries
- ✅ Server-side filtering/pagination работает
- ✅ Performance оптимален
- ✅ Соответствует архитектуре DDD + ExecutionContext

**Cons:**
- ⚠️ Требует изменения provider interface
- ⚠️ Нужно обновить implementation

**Implementation:**
```typescript
// src/providers/database-provider.ts
export interface DatabaseProvider {
  // Existing methods
  directions: DirectionsRepository
  employees: EmployeesRepository
  projects: ProjectsRepository
  tasks: TasksRepository
  
  // ADD THIS:
  query<T = any>(sql: string, params?: any[]): Promise<{
    rows: T[]
    rowCount: number
  }>
}

// src/providers/supabase-provider.ts
export class SupabaseDatabaseProvider implements DatabaseProvider {
  // ... existing code
  
  async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    // Use Supabase's rpc() or direct PostgreSQL query
    const { data, error } = await this.supabase.rpc('exec_sql', {
      query: sql,
      params: params
    });
    
    if (error) throw error;
    
    return {
      rows: data as T[],
      rowCount: data?.length || 0
    };
  }
}
```

---

### **Option B: Use Repository Pattern Only** ⚠️ NOT RECOMMENDED

**Example:**
```typescript
// Instead of custom SQL queries
await ctx.db.query(...)

// Use repository methods
await ctx.db.directions.getAll()
await ctx.db.directions.findByFilter({ search: 'text' })
```

**Pros:**
- ✅ Type-safe
- ✅ Cleaner abstraction

**Cons:**
- ❌ Repository нужны new methods для каждого filter combo
- ❌ Less flexible для complex queries
- ❌ More boilerplate code
- ❌ Harder to optimize

---

## 📂 FILES AFFECTED

### **Need DatabaseProvider.query():**
```
✅ src/services/direction-service.ts (77 lines)
✅ src/services/employee-service.ts (85 lines)
✅ src/services/project-service.ts (92 lines)
✅ src/services/task-service.ts (68 lines)
✅ src/services/time-entry-service.ts (54 lines)
```

### **Provider Files (Need Update):**
```
❓ src/providers/database-provider.ts (interface)
❓ src/providers/supabase-provider.ts (implementation)
❓ src/providers/provider-factory.ts (factory)
```

### **API Routes (Working, use services):**
```
✅ src/app/api/directions/route.ts
✅ src/app/api/employees/route.ts
✅ src/app/api/projects/route.ts
✅ src/app/api/tasks/route.ts
✅ src/app/api/time-entries/route.ts
```

---

## 🔍 QUESTIONS FOR ARCHITECT

### **1. DatabaseProvider Design Intent?**
**Question:** Была ли изначальная идея предоставлять прямой SQL access через `query()` метод, или это должен быть pure repository pattern?

**Context:**
- В `examples/` проекте есть похожая архитектура
- ExecutionContext предполагает гибкость
- Server-side filtering требует dynamic SQL

**Implications:**
- Если YES → Add `query()` method (Option A)
- Если NO → Refactor services to use repositories (Option B)

---

### **2. Supabase Integration Strategy?**
**Question:** Как лучше реализовать raw SQL queries через Supabase?

**Options:**
- **A)** Supabase RPC function: `exec_sql()`
- **B)** Supabase PostgREST: direct table access
- **C)** Supabase's `from().select()` query builder
- **D)** Separate PostgreSQL client (pg library)

**Current Supabase Usage:**
```typescript
// В auth используется:
const { data, error } = await supabase
  .from('employees')
  .select('*')
  .eq('id', userId)
  .single()
```

---

### **3. Performance vs Abstraction?**
**Question:** Приоритет на performance (custom SQL) или abstraction (repositories)?

**Tradeoffs:**
- **Custom SQL:** Быстрее, гибче, но менее type-safe
- **Repositories:** Type-safe, чище, но может быть медленнее

**Current Needs:**
- Server-side search with `ILIKE`
- Pagination (`LIMIT/OFFSET`)
- Counting (`COUNT(*)`)
- Filtering with multiple `WHERE` conditions

---

## 🎯 RECOMMENDED SOLUTION

**I recommend Option A: Add `query()` method**

### **Rationale:**
1. ✅ Preserves server-side filtering performance
2. ✅ Keeps service layer clean and focused
3. ✅ Maintains ExecutionContext flexibility
4. ✅ Supabase supports raw SQL via RPC or direct client
5. ✅ Future-proof for complex queries

### **Implementation Steps (30-45 min):**

#### **Step 1: Update DatabaseProvider Interface**
```typescript
// src/providers/database-provider.ts
export interface DatabaseProvider {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>
  // ... rest
}

export interface QueryResult<T> {
  rows: T[]
  rowCount: number
}
```

#### **Step 2: Implement in SupabaseProvider**
```typescript
// src/providers/supabase-provider.ts
async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
  // Option A: Use Supabase RPC
  const { data, error } = await this.supabase.rpc('exec_raw_sql', {
    sql_query: sql,
    sql_params: params
  });
  
  // Option B: Use direct pg client
  // (if Supabase connection string available)
  
  if (error) throw new Error(`Database query failed: ${error.message}`);
  
  return {
    rows: data as T[],
    rowCount: data?.length || 0
  };
}
```

#### **Step 3: Create Supabase SQL Function (if using RPC)**
```sql
-- Run this migration in Supabase
CREATE OR REPLACE FUNCTION exec_raw_sql(
  sql_query TEXT,
  sql_params JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Execute parameterized query
  -- (implementation depends on Supabase version)
  EXECUTE sql_query INTO result USING sql_params;
  RETURN result;
END;
$$;
```

#### **Step 4: Test Services**
```bash
npm run build
# Should pass now!
```

---

## 📋 ALTERNATIVE: Quick Fix (Not Recommended)

**If time is critical, temporary workaround:**

```typescript
// In each service, replace ctx.db.query() with:
const supabase = createServerClient();
const { data, error } = await supabase
  .from('directions')
  .select('*')
  .ilike('name', `%${filters.search}%`)
  .range(offset, offset + limit - 1);

// But this bypasses ExecutionContext and loses DDD benefits
```

---

## 🔗 RELATED DOCS

- `docs/stage-2/architecture.md` - Current architecture
- `docs/stage-2/database-schema.md` - Database structure
- `docs/DATA_INTEGRITY_MODEL_V3.md` - Data integrity analysis
- `docs/UPDATED_ARCHITECT_PLAN_V3.md` - Architect's plan

---

## ✅ CURRENT BUILD STATUS

**Commit:** `894e9b5c`  
**Branch:** `main`  
**Status:** 🔴 **BUILD FAILING**

**Working:**
- ✅ Frontend compiles
- ✅ Type errors fixed (except DatabaseProvider)
- ✅ All atomic components working
- ✅ React Query integrated
- ✅ Access Control UI ready

**Blocked:**
- ❌ Railway deployment (build fails)
- ❌ Service layer (can't query DB)
- ❌ Server-side filtering (not available)

---

## 🎬 NEXT STEPS

**Once architect decides on approach:**

### **If Option A (Add query method):**
1. Update `DatabaseProvider` interface
2. Implement in `SupabaseDatabaseProvider`
3. Create Supabase RPC function (if needed)
4. Test build locally
5. Push to Railway
6. Verify deployment

**ETA:** 30-45 minutes

### **If Option B (Pure repository pattern):**
1. Add filter methods to repositories
2. Refactor all services to use repositories
3. Update API routes
4. Test build locally
5. Push to Railway

**ETA:** 2-3 hours

---

## 📞 QUESTIONS TO ANSWER

1. **Should DatabaseProvider provide raw SQL access?** (YES/NO)
2. **Which Supabase integration approach?** (RPC / Direct / Query Builder)
3. **Priority: Performance or Type Safety?** (Performance / Type Safety / Balance)

---

**Status:** ⏸️ **AWAITING ARCHITECTURAL DECISION**  
**Next:** Answer questions above, then proceed with implementation

---

**Prepared by:** AI Full-Stack Architect  
**Date:** 2025-10-15  
**Session:** Stage 2 Closure → Stage 3 Kickoff  
**Issue Type:** Critical Build Blocker

---

# 🚀 READY FOR ARCHITECTURAL REVIEW

