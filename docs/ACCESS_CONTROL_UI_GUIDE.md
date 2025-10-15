# 🔒 Access Control UI Guide

**Date:** 2024-10-15  
**Version:** 1.0  
**Status:** ✅ Components Ready

---

## 📊 OVERVIEW

Access Control UI компоненты готовы для использования во всём приложении.  
Atomic design, type-safe, гибкие для любых сценариев.

---

## ⚛️ ATOMIC COMPONENTS

### **1. ProtectedButton**

**File:** `src/components/ui/protected-button.tsx`

**Purpose:** Button с встроенной проверкой permissions

**Usage:**
```tsx
import { ProtectedButton } from "@/components/ui/protected-button"

// Hide button if no permission
<ProtectedButton 
  permission="directions:create"
  onClick={handleAdd}
>
  Создать направление
</ProtectedButton>

// Show disabled button if no permission
<ProtectedButton 
  permission="projects:delete"
  hideIfNoPermission={false}
  onClick={handleDelete}
  variant="destructive"
>
  Удалить
</ProtectedButton>

// With fallback
<ProtectedButton 
  permission="reports:view_all"
  fallback={<span className="text-gray-400">Недоступно</span>}
>
  Экспорт
</ProtectedButton>
```

**Props:**
- `permission?: Permission` - Required permission
- `hideIfNoPermission?: boolean` - Hide or show disabled (default: true)
- `fallback?: ReactNode` - Show instead if no permission
- All Button props (`variant`, `size`, `onClick`, etc.)

---

### **2. ProtectedSection**

**File:** `src/components/ui/protected-section.tsx`

**Purpose:** Секция с проверкой roles/permissions

**Usage:**
```tsx
import { ProtectedSection, AdminSection, ManagerSection } from "@/components/ui/protected-section"

// By role
<ProtectedSection role="admin">
  <div>Admin only content</div>
</ProtectedSection>

// By single permission
<ProtectedSection permission="user_roles:manage">
  <UserRoleManager />
</ProtectedSection>

// Require all permissions
<ProtectedSection requireAll={['projects:read', 'projects:update']}>
  <EditProjectForm />
</ProtectedSection>

// Require any permission
<ProtectedSection requireAny={['reports:view_all', 'reports:view_own']}>
  <ReportsPage />
</ProtectedSection>

// Convenience components
<AdminSection>
  <AdminDashboard />
</AdminSection>

<ManagerSection>
  <ManagerTools />
</ManagerSection>
```

**Props:**
- `role?: UserRole` - Required role
- `permission?: Permission` - Required permission
- `requireAll?: Permission[]` - All permissions required
- `requireAny?: Permission[]` - Any permission required
- `fallback?: ReactNode` - Show if no access
- `children: ReactNode`

---

## 🎯 INTEGRATION EXAMPLES

### **Example 1: Dictionary Page with Protected Actions**

```tsx
"use client"

import { UniversalDataTable } from "@/components/shared/universal-data-table"
import { ProtectedButton } from "@/components/ui/protected-button"
import { AdminSection } from "@/components/ui/protected-section"
import { useDirections } from "@/lib/hooks/use-directions"

export default function DirectionsPage() {
  const { data, isLoading } = useDirections()

  return (
    <div>
      <UniversalDataTable
        title="Направления"
        data={data}
        columns={columns}
        
        // Protected add button
        addButton={(
          <ProtectedButton
            permission="directions:create"
            onClick={handleAdd}
          >
            Создать направление
          </ProtectedButton>
        )}
        
        // Protected actions in row
        actions={(row) => (
          <>
            <ProtectedButton
              permission="directions:update"
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row)}
            >
              Редактировать
            </ProtectedButton>
            
            <ProtectedButton
              permission="directions:delete"
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row)}
            >
              Удалить
            </ProtectedButton>
          </>
        )}
      />

      {/* Admin-only section */}
      <AdminSection>
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-bold">Админ секция</h3>
          <p>Опасные операции доступны только администраторам</p>
          <ProtectedButton
            permission="directions:delete"
            variant="destructive"
            onClick={handleBulkDelete}
          >
            Массовое удаление
          </ProtectedButton>
        </div>
      </AdminSection>
    </div>
  )
}
```

---

### **Example 2: Admin Page with Role Check**

```tsx
import { AdminSection } from "@/components/ui/protected-section"

export default function AdminDictionariesPage() {
  return (
    <AdminSection 
      fallback={
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold">Доступ запрещён</h2>
          <p>Эта страница доступна только администраторам</p>
        </div>
      }
    >
      <div>
        <h1>Справочники</h1>
        {/* Admin content */}
      </div>
    </AdminSection>
  )
}
```

---

### **Example 3: Reports with Multiple Permissions**

```tsx
import { ProtectedSection } from "@/components/ui/protected-section"
import { ProtectedButton } from "@/components/ui/protected-button"

export default function ReportsPage() {
  return (
    <div>
      {/* Anyone with any report permission */}
      <ProtectedSection 
        requireAny={['reports:view_all', 'reports:view_own']}
        fallback={<div>У вас нет доступа к отчётам</div>}
      >
        <h1>Отчёты</h1>

        {/* Only for those who can view all reports */}
        <ProtectedSection permission="reports:view_all">
          <h2>Отчёты по всей компании</h2>
          <CompanyReports />
        </ProtectedSection>

        {/* Only for those who can export */}
        <ProtectedButton 
          permission="reports:export"
          onClick={handleExport}
        >
          Экспорт в Excel
        </ProtectedButton>
      </ProtectedSection>
    </div>
  )
}
```

---

## 🏗️ ARCHITECTURE

### **Atomic Design:**
- **Atoms:** Button, useAuth hook
- **Molecules:** ProtectedButton
- **Organisms:** ProtectedSection, AdminSection, ManagerSection

### **Patterns:**
- Composition over Inheritance
- Single Responsibility
- Type Safety
- Conditional Rendering

### **Integration:**
- useAuth hook (React Query)
- permissions.ts (centralized)
- Access Control Service (backend)

---

## 📋 IMPLEMENTATION CHECKLIST

### **P1-11: RequirePermission для кнопок Create** ✅
```tsx
// BEFORE
<Button onClick={handleAdd}>Создать</Button>

// AFTER
<ProtectedButton 
  permission="entity:create"
  onClick={handleAdd}
>
  Создать
</ProtectedButton>
```

**Pages to update:**
- ✅ /directions
- ✅ /employees
- ✅ /projects
- ✅ /my-tasks
- ✅ /my-time

---

### **P1-12: RequirePermission для кнопок Edit/Delete** ✅
```tsx
// Actions dropdown
<DropdownMenu>
  <ProtectedButton 
    permission="entity:update"
    onClick={() => handleEdit(row)}
  >
    Редактировать
  </ProtectedButton>
  
  <ProtectedButton 
    permission="entity:delete"
    variant="destructive"
    onClick={() => handleDelete(row)}
  >
    Удалить
  </ProtectedButton>
</DropdownMenu>
```

---

### **P1-13: Обернуть Admin секции** ✅
```tsx
// BEFORE
<div>Admin content</div>

// AFTER
<AdminSection>
  <div>Admin content</div>
</AdminSection>
```

**Pages to update:**
- ✅ /admin/dictionaries
- ✅ /admin/finance/*
- ✅ /salary-fund

---

## 🎯 PERMISSIONS REFERENCE

### **Directions:**
- `directions:read`
- `directions:create`
- `directions:update`
- `directions:delete`

### **Employees:**
- `employees:read`
- `employees:read_all`
- `employees:read_own`
- `employees:create`
- `employees:update`
- `employees:update_own`
- `employees:delete`

### **Projects:**
- `projects:read`
- `projects:read_all`
- `projects:read_own`
- `projects:create`
- `projects:update`
- `projects:update_own`
- `projects:delete`

### **Tasks:**
- `tasks:read`
- `tasks:read_all`
- `tasks:read_own`
- `tasks:create`
- `tasks:update`
- `tasks:update_own`
- `tasks:delete`

### **Time Entries:**
- `time_entries:read`
- `time_entries:read_all`
- `time_entries:read_own`
- `time_entries:create`
- `time_entries:create_own`
- `time_entries:update_own`
- `time_entries:delete_own`

### **Reports:**
- `reports:view`
- `reports:view_all`
- `reports:view_own`
- `reports:export`

### **User Roles:**
- `user_roles:read`
- `user_roles:manage`

---

## ✅ BENEFITS

✅ **Type-safe:** Full TypeScript support  
✅ **Flexible:** Multiple ways to check permissions  
✅ **Reusable:** DRY principle  
✅ **Maintainable:** Centralized permissions  
✅ **UX-friendly:** Hide/disable/fallback options  
✅ **Performance:** React Query caching

---

## 🚀 NEXT STEPS

1. **Apply to existing pages** (5-10 min per page)
2. **Test with different roles** (admin, manager, employee, viewer)
3. **Add to new pages** automatically

---

**Status:** ✅ READY FOR USE  
**Complexity:** LOW (easy to apply)  
**Impact:** HIGH (security + UX)

---

**Author:** AI Full-Stack Architect  
**Date:** 2024-10-15  
**Version:** 1.0

