# 🎯 P1 Improvement Plan - UI/UX Enhancement

**Дата:** 2024-10-15  
**Цель:** Догнать Timetta по UX  
**Время:** 1-2 дня (12-16 часов)  
**Статус:** 🔄 Ready to Start

---

## 📊 OVERVIEW

**Current Score:** 7.2/10 ⭐⭐⭐⭐  
**Target Score:** 8.5/10 ⭐⭐⭐⭐  
**Gap to close:** +1.3 points

**Focus Areas:**
1. Client-side Validation (instant feedback)
2. Skeleton Loaders (better loading UX)
3. Access Control UI (permission-based UI)
4. Reports UI (visualizations + charts)
5. KIMAI-inspired Features (activity types, favorites)

---

## 🎯 TASKS BREAKDOWN

### **BLOCK 1: Client-side Validation (5 tasks, ~2-3ч)**

#### P1-1: Direction Form ✅
**File:** `/src/app/(dashboard)/admin/dictionaries/directions/page.tsx`  
**Time:** 30 min  
**Changes:**
```tsx
import { useFormValidation } from '@/lib/hooks/use-form-validation';
import { DirectionSchema } from '@/lib/validators/shared-schemas';
import { FormField } from '@/components/ui/form-field';

const { errors, validateField, validateForm } = useFormValidation(DirectionSchema);

// In form:
<FormField label="Название *" error={errors.name}>
  <Input 
    value={formData.name}
    onChange={(e) => {
      setFormData({...formData, name: e.target.value});
      validateField('name', e.target.value);
    }}
  />
</FormField>
```

**Architecture:** Uses DDD validators, ctx* pattern for validation

---

#### P1-2: Employee Form ✅
**File:** `/src/app/(dashboard)/admin/dictionaries/employees/page.tsx`  
**Time:** 30 min  
**Changes:** Same pattern, EmployeeSchema  
**Special:** Email validation (instant feedback!)

---

#### P1-3: Project Form ✅
**File:** `/src/app/(dashboard)/projects/page.tsx`  
**Time:** 30 min  
**Changes:** Same pattern, ProjectSchema  
**Special:** Budget validation (min 0)

---

#### P1-4: Task Form ✅
**File:** `/src/app/(dashboard)/my-tasks/page.tsx`  
**Time:** 30 min  
**Changes:** Same pattern, TaskSchema  
**Special:** Estimated hours validation

---

#### P1-5: Time Entry Form ✅
**File:** `/src/app/(dashboard)/my-time/page.tsx`  
**Time:** 30 min  
**Changes:** Same pattern, TimeEntrySchema  
**Special:** Hours range (0.1-24) instant validation

---

### **BLOCK 2: Skeleton Loaders (5 tasks, ~1-2ч)**

#### P1-6: Directions Page ✅
**File:** `/src/app/(dashboard)/admin/dictionaries/directions/page.tsx`  
**Time:** 15 min  
**Changes:**
```tsx
import { TableSkeleton } from '@/components/ui/skeleton';

{isLoading ? (
  <TableSkeleton rows={5} columns={5} />
) : (
  <UniversalDataTable ... />
)}
```

**Architecture:** Proper loading state management

---

#### P1-7: Employees Page ✅
**File:** `/src/app/(dashboard)/admin/dictionaries/employees/page.tsx`  
**Time:** 15 min  
**Changes:** Same pattern

---

#### P1-8: Projects Page ✅
**File:** `/src/app/(dashboard)/projects/page.tsx`  
**Time:** 15 min  
**Changes:** Same pattern

---

#### P1-9: My Tasks Page ✅
**File:** `/src/app/(dashboard)/my-tasks/page.tsx`  
**Time:** 15 min  
**Changes:** Same pattern

---

#### P1-10: Dashboard ✅
**File:** `/src/app/(dashboard)/page.tsx`  
**Time:** 30 min  
**Changes:**
```tsx
import { CardSkeleton } from '@/components/ui/skeleton';

{isLoading ? (
  <div className="grid grid-cols-4 gap-6">
    {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
  </div>
) : (
  // MetricCards
)}
```

---

### **BLOCK 3: Access Control UI (3 tasks, ~2-3ч)**

#### P1-11: RequirePermission для Create ✅
**Files:** All CRUD pages  
**Time:** 1 час  
**Changes:**
```tsx
import { RequirePermission } from '@/lib/hooks/use-auth';

<RequirePermission permission="directions:create">
  <Button onClick={handleAdd}>Создать</Button>
</RequirePermission>

// Or hide:
{hasPermission('directions:create') && (
  <Button onClick={handleAdd}>Создать</Button>
)}
```

**Pages to update:**
- `/directions`
- `/employees`
- `/projects`
- `/my-tasks`
- `/my-time`

**Architecture:** Permission-based rendering, provider pattern

---

#### P1-12: RequirePermission для Edit/Delete ✅
**Files:** All CRUD pages  
**Time:** 1 час  
**Changes:** Same pattern for Edit/Delete buttons in UniversalDataTable

**Important:** Pass `canEdit` and `canDelete` props to UniversalDataTable:
```tsx
<UniversalDataTable
  canEdit={(row) => hasPermission('directions:update')}
  canDelete={(row) => hasPermission('directions:delete')}
  ...
/>
```

---

#### P1-13: AdminOnly для Admin секций ✅
**Files:** Admin pages, Finance pages  
**Time:** 30 min  
**Changes:**
```tsx
import { AdminOnly, ManagerOnly } from '@/lib/hooks/use-auth';

<AdminOnly fallback={<div>Доступ запрещён</div>}>
  {/* Admin content */}
</AdminOnly>
```

**Pages:**
- `/admin/dictionaries`
- `/admin/finance/*`
- `/salary-fund`

---

### **BLOCK 4: Reports UI (5 tasks, ~3-4ч)**

#### P1-14: Employee Utilization Report Page ✅
**File:** `/src/app/(dashboard)/reports/utilization/page.tsx` (NEW)  
**Time:** 1 час  
**Changes:**
```tsx
"use client"

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function UtilizationReportPage() {
  const [dateRange, setDateRange] = useState({
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  });

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'utilization', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams(dateRange);
      const res = await fetch(`/api/reports/utilization?${params}`);
      return res.json();
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Загрузка сотрудников</h1>
          <p className="text-gray-600 mt-1">Анализ использования рабочего времени</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>График загрузки</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart width={800} height={400} data={data}>
            <XAxis dataKey="employeeName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalHours" fill="#2563eb" name="Часы" />
            <Bar dataKey="capacity" fill="#cbd5e1" name="Норма" />
          </BarChart>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Детальная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <table>...</table>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Dependencies:** `recharts` (уже установлен в examples)

---

#### P1-15: Project Budget Report Page ✅
**File:** `/src/app/(dashboard)/reports/projects/page.tsx` (NEW)  
**Time:** 1 час  
**Changes:** Similar to P1-14, but:
- Pie chart для budget utilization
- Table с budget vs spent
- Color coding (green/orange/red)

---

#### P1-16: My Time Report Page ✅
**File:** `/src/app/(dashboard)/reports/my-time/page.tsx` (NEW)  
**Time:** 30 min  
**Changes:**
- Line chart для hours over time
- Summary cards (total hours, days worked, avg per day)
- Project breakdown (pie chart)

---

#### P1-17: Add Charts Library ✅
**File:** `package.json`  
**Time:** 15 min  
**Changes:**
```bash
npm install recharts
```

**Or:** Copy from examples if already there

---

#### P1-18: DateRangePicker Component ✅
**File:** `/src/components/ui/date-range-picker.tsx` (NEW)  
**Time:** 30 min  
**Changes:**
```tsx
"use client"

import { useState } from 'react';
import { Input } from './input';
import { Label } from './label';

export function DateRangePicker({ 
  value, 
  onChange 
}: { 
  value: { startDate: string; endDate: string }; 
  onChange: (v: any) => void 
}) {
  return (
    <div className="flex gap-4 items-end">
      <div className="grid gap-2">
        <Label>От</Label>
        <Input 
          type="date" 
          value={value.startDate}
          onChange={(e) => onChange({ ...value, startDate: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label>До</Label>
        <Input 
          type="date" 
          value={value.endDate}
          onChange={(e) => onChange({ ...value, endDate: e.target.value })}
        />
      </div>
    </div>
  );
}
```

---

### **BLOCK 5: KIMAI-inspired Features (5 tasks, ~3-4ч)**

#### KIMAI-1: Activity Types Table ✅
**File:** `prisma/migrations/011_activity_types.sql` (NEW)  
**Time:** 30 min  
**Changes:**
```sql
-- Migration: Activity Types
-- Description: KIMAI-inspired activity categorization
-- Author: AI Architect
-- Date: 2024-10-15

CREATE TABLE activity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  color VARCHAR(7),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Default activities (KIMAI-style)
INSERT INTO activity_types (name, code, color) VALUES
  ('Разработка', 'development', '#2563eb'),
  ('Тестирование', 'testing', '#16a34a'),
  ('Встречи', 'meetings', '#dc2626'),
  ('Документация', 'documentation', '#9333ea'),
  ('Поддержка', 'support', '#ea580c'),
  ('Анализ', 'analysis', '#0891b2'),
  ('Code Review', 'code_review', '#84cc16'),
  ('Обучение', 'training', '#eab308');

-- Add to time_entries
ALTER TABLE time_entries 
ADD COLUMN activity_type_id UUID REFERENCES activity_types(id) ON DELETE SET NULL;

CREATE INDEX idx_time_entries_activity_type ON time_entries(activity_type_id);

-- Trigger
CREATE OR REPLACE FUNCTION update_activity_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activity_types_updated_at
  BEFORE UPDATE ON activity_types
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_types_updated_at();

COMMENT ON TABLE activity_types IS 'KIMAI-inspired activity categorization for time tracking';
```

**Architecture:** Service layer будет ActivityTypeService

---

#### KIMAI-2: Add Activity to Time Entries ✅
**Files:** 
- `/src/services/activity-type-service.ts` (NEW)
- `/src/app/api/activity-types/route.ts` (NEW)
- `/src/lib/hooks/use-activity-types.ts` (NEW)

**Time:** 1 час  
**Service Layer (DDD):**
```typescript
export class ActivityTypeService {
  static async getAllActivityTypes(ctx: ExecutionContext) {
    ctx.logger.info('[ActivityTypeService] getAllActivityTypes');
    await ctx.access.require('time_entries:read' as any);
    
    const result = await ctx.db.query(`
      SELECT id, name, code, description, color, is_active as "isActive"
      FROM activity_types
      WHERE is_active = true
      ORDER BY name ASC
    `);
    
    return result.rows;
  }
}
```

---

#### KIMAI-3: Activity UI in Time Entry Form ✅
**File:** `/src/app/(dashboard)/my-time/page.tsx`  
**Time:** 30 min  
**Changes:**
```tsx
import { useActivityTypes } from '@/lib/hooks/use-activity-types';

const { data: activityTypes } = useActivityTypes();

// In form:
<div className="grid gap-2">
  <Label htmlFor="activity">Тип активности</Label>
  <Select 
    value={formData.activityTypeId} 
    onValueChange={(v) => setFormData({...formData, activityTypeId: v})}
  >
    <SelectTrigger id="activity">
      <SelectValue placeholder="Выберите тип" />
    </SelectTrigger>
    <SelectContent>
      {activityTypes?.map((a) => (
        <SelectItem key={a.id} value={a.id}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{backgroundColor: a.color}}></div>
            {a.name}
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

---

#### KIMAI-4: User Favorites Table ✅
**File:** `prisma/migrations/012_user_favorites.sql` (NEW)  
**Time:** 30 min  
**Changes:**
```sql
-- Migration: User Favorites
-- Description: KIMAI-inspired quick access to favorite projects
-- Author: AI Architect
-- Date: 2024-10-15

CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (employee_id, project_id)
);

CREATE INDEX idx_user_favorites_employee ON user_favorites(employee_id);
CREATE INDEX idx_user_favorites_project ON user_favorites(project_id);

COMMENT ON TABLE user_favorites IS 'KIMAI-inspired quick access to favorite projects';
```

---

#### KIMAI-5: Favorites in Weekly Timesheet ✅
**File:** `/src/components/time-tracking/WeeklyTimesheet.tsx`  
**Time:** 1 час  
**Changes:**
```tsx
import { Star } from 'lucide-react';
import { useFavorites, useAddFavorite, useRemoveFavorite } from '@/lib/hooks/use-favorites';

const { data: favorites } = useFavorites(employeeId);
const addFavorite = useAddFavorite();
const removeFavorite = useRemoveFavorite();

// Show favorites at top
const favoriteProjects = projects.filter(p => 
  favorites?.some(f => f.projectId === p.id)
);

// Star button
<button 
  onClick={() => isFavorite ? removeFavorite.mutate(projectId) : addFavorite.mutate(projectId)}
>
  <Star className={isFavorite ? "fill-yellow-500" : ""} />
</button>
```

---

## 🏗️ ARCHITECTURAL PRINCIPLES

### **1. Provider Pattern:**
- `QueryProvider` для React Query
- `ExecutionContext` для backend

### **2. Service Layers (DDD):**
- `ActivityTypeService`
- `FavoritesService`
- Все через ExecutionContext (ctx*)

### **3. Type Safety:**
- TypeScript everywhere
- Zod schemas для validation
- Shared types в /types/domain

### **4. Design System:**
- PT Sans + JetBrains Mono
- shadcn/ui components
- Consistent colors (primary, muted, border)

### **5. Performance:**
- React Query caching
- Server-side filtering
- Optimistic updates
- Debounced inputs

---

## 📊 SUCCESS METRICS

### **After P1 Completion:**

**UX Improvements:**
- ✅ Instant validation feedback (was: after submit)
- ✅ Proper loading states (was: empty tables)
- ✅ Permission-based UI (was: all buttons visible)
- ✅ Visual reports (was: API only)

**Score Impact:**
- Client-side Validation: +0.5
- Skeleton Loaders: +0.3
- Access Control UI: +0.3
- Reports UI: +0.4
- KIMAI Features: +0.2

**Total:** 7.2 → **8.5/10** ⭐⭐⭐⭐

---

## 🚀 EXECUTION PLAN

### **Day 1 (6-8 hours):**
1. ✅ Block 1: Client-side Validation (2-3ч)
2. ✅ Block 2: Skeleton Loaders (1-2ч)
3. ✅ Block 3: Access Control UI (2-3ч)

**Expected:** Значительное улучшение UX

---

### **Day 2 (6-8 hours):**
4. ✅ Block 4: Reports UI (3-4ч)
5. ✅ Block 5: KIMAI Features (3-4ч)

**Expected:** Готовность к production 100%

---

## ✅ DEFINITION OF DONE

### **Each Task:**
- [ ] Code написан по архитектурным принципам
- [ ] Types определены
- [ ] Service layer если нужен
- [ ] API endpoint если нужен
- [ ] React Query hook если нужен
- [ ] UI component обновлён
- [ ] Validation работает
- [ ] Loading states правильные
- [ ] Toasts показываются
- [ ] Manual test пройден

### **Overall:**
- [ ] Все 23 задачи завершены
- [ ] QA check пройден
- [ ] Score ≥ 8.5/10
- [ ] Pilot users готовы тестировать
- [ ] Documentation обновлена

---

## 🎯 NEXT STEPS

**After P1:**
1. Production launch ✅
2. Pilot feedback (1 месяц)
3. P2 Features (Kanban, Comments, Attachments)
4. Phase 3: Advanced features

**Goal:** Превзойти Timetta за 2 месяца! 🚀

---

**Автор:** AI Full-Stack Architect  
**Дата:** 2024-10-15  
**Версия:** 1.0  
**Статус:** 📋 READY TO START

