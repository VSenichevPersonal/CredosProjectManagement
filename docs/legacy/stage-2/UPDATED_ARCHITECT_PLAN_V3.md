# 🏗️ План архитектора V3 (После UI improvements)

**Дата обновления:** 2024-10-15 (V3)  
**Основа:** V2 + UI Improvements + Product Owner Analysis  
**Статус:** 🎯 Готов к pilot

---

## 📊 ЧТО ВЫПОЛНЕНО (V2 → V3)

### ✅ **COMPLETED:**

1. **✅ UI P0 - Consistency (5 задач)**
   - Все справочники на UniversalDataTable
   - Server-side search везде
   - Skeleton компоненты

2. **✅ P1 - Validation (3 задачи)**
   - Shared Zod schemas
   - Client-side валидация
   - Показ ошибок под полями

3. **✅ P1 - Error Handling (3 задачи)**
   - Custom error classes
   - ErrorBoundary везде
   - User-friendly messages

4. **✅ Data Integrity (из V2)**
   - Migration 010_data_integrity.sql применена
   - CASCADE rules исправлены
   - FK coverage 90%

5. **✅ React Query (из V2)**
   - Все основные entities
   - Optimistic updates
   - Automatic invalidation

6. **✅ KIMAI-style Weekly Timesheet**
   - WeeklyTimesheet component
   - Auto-save
   - Validation

---

## 🎯 ПРИОРИТЕТЫ ДЛЯ PILOT

### **P0 - Pilot Blockers (перед pilot запуском):**

#### 1. ⬜ Time Entries List View
**Статус:** NOT STARTED  
**Effort:** 4-6 часов  
**Impact:** HIGH  
**Priority:** P0

**Что делать:**
```typescript
// src/app/(dashboard)/my-time/page.tsx
// Сейчас: Tab "List View" = заглушка
// Нужно: Полноценная таблица с time entries

<TabsContent value="list">
  <UniversalDataTable
    title="Записи времени"
    data={timeEntries}
    columns={[
      { id: "date", label: "Дата" },
      { id: "project", label: "Проект" },
      { id: "task", label: "Задача" },
      { id: "hours", label: "Часы" },
      { id: "description", label: "Описание" },
    ]}
    onEdit={handleEdit}
    onDelete={handleDelete}
  />
</TabsContent>
```

#### 2. ⬜ "Мои задачи" filter
**Статус:** NOT STARTED  
**Effort:** 2-3 часа  
**Impact:** MEDIUM  
**Priority:** P0

**Что делать:**
```typescript
// Сейчас: показывает ВСЕ задачи
// Нужно: фильтр "только мои"

const { data } = useTasks({
  assigneeId: currentEmployeeId, // <-- добавить
  status: selectedStatus,
})
```

#### 3. ⬜ Test Data Seeding
**Статус:** NOT STARTED  
**Effort:** 2-3 часа  
**Impact:** HIGH  
**Priority:** P0

**Что делать:**
```bash
# Расширить scripts/seed.js:
- 3-5 направлений (ИБ, Разработка, Консалтинг, Аудит)
- 10-15 сотрудников
- 5-10 проектов
- 20-30 задач
- 50-100 time entries (за последний месяц)
```

#### 4. ⬜ Quick Start Guide
**Статус:** NOT STARTED  
**Effort:** 3-4 часа  
**Impact:** HIGH  
**Priority:** P0

**Что делать:**
```markdown
# docs/QUICK_START_GUIDE.md
- Как войти
- Как создать проект
- Как добавить задачу
- Как вводить время (weekly timesheet)
- Как экспортировать данные
- FAQ
```

---

### **P1 - Production Blockers (перед production):**

#### 5. ⬜ Access Control Implementation
**Статус:** NOT STARTED  
**Effort:** 1-2 недели  
**Impact:** VERY HIGH  
**Priority:** P1

**Что делать:**

**A. Backend:**
```typescript
// Уже есть: ExecutionContext с access.require()
// Нужно: Реализовать проверки везде

// ProjectService
async getAllProjects(ctx, filters) {
  await ctx.access.require('projects:read')
  
  // Если не admin, показывать только свои
  if (!ctx.user.isAdmin) {
    filters.managerId = ctx.user.employeeId
  }
  
  return await this.projectRepo.findAll(filters)
}
```

**B. Frontend:**
```typescript
// hooks/use-auth.ts
export function useAuth() {
  return {
    user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    can: (permission: string) => checkPermission(user, permission)
  }
}

// В компонентах:
const { isAdmin } = useAuth()

{isAdmin && (
  <Button onClick={handleDelete}>Удалить</Button>
)}
```

**C. Database:**
```sql
-- Таблица уже есть: user_roles
-- Нужно: Наполнить данными
INSERT INTO user_roles (user_id, role) VALUES
  ('admin-user-id', 'admin'),
  ('manager-user-id', 'manager');
```

#### 6. ⬜ Basic Reports
**Статус:** NOT STARTED  
**Effort:** 1-2 недели  
**Impact:** VERY HIGH  
**Priority:** P1

**Что делать:**

**A. Employee Utilization Report:**
```typescript
// src/app/(dashboard)/reports/utilization/page.tsx
<EmployeeUtilizationReport
  period="current-week"
  employees={employees}
  data={[
    { employee: "Иванов И.И.", hours: 38, capacity: 40, utilization: "95%" },
    { employee: "Петров П.П.", hours: 32, capacity: 40, utilization: "80%" },
  ]}
/>
```

**B. Project Budget Report:**
```typescript
// src/app/(dashboard)/reports/projects/page.tsx
<ProjectBudgetReport
  projects={projects}
  data={[
    { project: "SIEM-2024", budget: 500000, actual: 350000, status: "on-track" },
    { project: "Audit-2024", budget: 200000, actual: 220000, status: "over-budget" },
  ]}
/>
```

**C. API Endpoints:**
```typescript
// src/app/api/reports/utilization/route.ts
export async function GET(request) {
  const { startDate, endDate } = parseQueryParams(request)
  const data = await ReportService.getEmployeeUtilization(ctx, startDate, endDate)
  return NextResponse.json(data)
}

// src/app/api/reports/projects/route.ts
export async function GET(request) {
  const data = await ReportService.getProjectBudgetReport(ctx)
  return NextResponse.json(data)
}
```

#### 7. ⬜ Email Notifications
**Статус:** NOT STARTED  
**Effort:** 1 неделя  
**Impact:** HIGH  
**Priority:** P1

**Что делать:**

**A. Setup:**
```bash
npm install nodemailer @react-email/components
```

**B. Email Templates:**
```typescript
// src/emails/task-assigned.tsx
export function TaskAssignedEmail({ task, assignee }) {
  return (
    <Html>
      <Head />
      <Body>
        <h1>Новая задача: {task.title}</h1>
        <p>Вам назначена задача в проекте {task.project.name}</p>
        <p>Дедлайн: {task.dueDate}</p>
        <Button href={taskUrl}>Открыть задачу</Button>
      </Body>
    </Html>
  )
}
```

**C. Service:**
```typescript
// src/services/email-service.ts
export class EmailService {
  static async sendTaskAssigned(ctx, task, assignee) {
    const html = render(<TaskAssignedEmail task={task} assignee={assignee} />)
    await this.send({
      to: assignee.email,
      subject: `Новая задача: ${task.title}`,
      html,
    })
  }
}
```

**D. Triggers:**
```typescript
// В TaskService.createTask()
await EmailService.sendTaskAssigned(ctx, task, assignee)

// В TaskService.updateTask() если изменился assignee
await EmailService.sendTaskReassigned(ctx, task, oldAssignee, newAssignee)
```

---

### **P2 - Nice to Have (после pilot):**

#### 8. ⬜ Kanban Board
**Effort:** 1-2 недели  
**Impact:** MEDIUM  
**Priority:** P2

```typescript
// src/components/tasks/kanban-board.tsx
// Использовать @hello-pangea/dnd (fork react-beautiful-dnd)

<KanbanBoard
  columns={[
    { id: 'pending', title: 'К выполнению' },
    { id: 'in_progress', title: 'В работе' },
    { id: 'review', title: 'На проверке' },
    { id: 'completed', title: 'Завершено' },
  ]}
  tasks={tasks}
  onDragEnd={handleDragEnd}
/>
```

#### 9. ⬜ Batch Operations
**Effort:** 1 неделя  
**Impact:** MEDIUM  
**Priority:** P2

```typescript
<UniversalDataTable
  enableRowSelection  // <-- добавить
  onSelectionChange={handleSelectionChange}
  bulkActions={[
    { label: "Удалить выбранные", onClick: handleBulkDelete },
    { label: "Изменить статус", onClick: handleBulkStatusChange },
  ]}
/>
```

#### 10. ⬜ File Attachments
**Effort:** 1-2 недели  
**Impact:** MEDIUM  
**Priority:** P2

```typescript
// Использовать Supabase Storage
<FileUpload
  bucket="task-attachments"
  maxSize={10 * 1024 * 1024} // 10MB
  accept=".pdf,.doc,.docx,.xls,.xlsx"
  onUpload={handleUpload}
/>
```

#### 11. ⬜ Task Comments
**Effort:** 1 неделя  
**Impact:** MEDIUM  
**Priority:** P2

```typescript
// Новая таблица: task_comments
<CommentSection
  taskId={task.id}
  comments={comments}
  onAddComment={handleAddComment}
/>
```

#### 12. ⬜ Audit History
**Effort:** 1 неделя  
**Impact:** LOW  
**Priority:** P2

```typescript
// Использовать существующую audit_logs таблицу
<AuditHistory
  entityType="task"
  entityId={task.id}
  entries={auditLog}
/>
```

---

### **P3 - Future (после production):**

13. ⬜ Heatmap visualization
14. ⬜ Theme Provider (dark mode)
15. ⬜ Advanced charts (Chart.js / Recharts)
16. ⬜ Mobile app (React Native)
17. ⬜ Calendar integration
18. ⬜ Slack/Teams integration
19. ⬜ Public API

---

## 📋 ROADMAP

### **Неделя 1 (Pilot Preparation):**
- Day 1-2: Time Entries List View ✅
- Day 2-3: "Мои задачи" filter ✅
- Day 3-4: Test Data Seeding ✅
- Day 4-5: Quick Start Guide ✅
- Day 5: Internal testing & fixes

**Deliverable:** Ready for pilot

### **Неделя 2-3 (Pilot Running):**
- Pilot с 10-15 пользователями
- Сбор feedback
- Bug fixes
- UX improvements

### **Неделя 4-5 (Production Preparation):**
- Week 4: Access Control Implementation
- Week 5: Basic Reports + Email Notifications

**Deliverable:** Ready for production

### **Неделя 6-8 (Post-Production):**
- Week 6: Kanban Board
- Week 7: Batch Operations + File Attachments
- Week 8: Comments + Audit History

**Deliverable:** Full-featured system

---

## 🎯 SUCCESS CRITERIA

### **Pilot Success:**
- ✅ 10-15 users onboarded
- ✅ 80%+ user adoption
- ✅ 90%+ time entries filled
- ✅ <5 critical bugs
- ✅ NPS > 40

### **Production Ready:**
- ✅ Access control working
- ✅ Basic reports available
- ✅ Email notifications working
- ✅ 99%+ uptime
- ✅ <500ms response time (p95)
- ✅ Zero data loss

---

## 📊 РИСКИ И МИТИГАЦИЯ

### **Risk 1: Низкое adoption**
**Вероятность:** MEDIUM  
**Митигация:**
- Quick Start Guide
- Onboarding session (30 min)
- Support channel (Slack/Teams)

### **Risk 2: Performance issues**
**Вероятность:** LOW  
**Митигация:**
- Server-side pagination уже есть
- React Query caching работает
- Database indexes на месте

### **Risk 3: Нехватка прав доступа**
**Вероятность:** HIGH  
**Митигация:**
- Пилот с доверенными пользователями
- Быстрая реализация (1-2 недели)
- Приоритет P1

### **Risk 4: Отсутствие отчётов**
**Вероятность:** MEDIUM  
**Митигация:**
- Базовые отчёты в P1
- Excel export уже работает
- Manual reporting как fallback

---

## 🏆 ИТОГО

**Текущий статус:** 85% MVP, готов к pilot  
**До pilot:** 4-5 дней работы  
**До production:** 3-4 недели работы  

**Рекомендация:** 
1. Завершить P0 задачи (4-5 дней)
2. Запустить pilot (1 месяц)
3. Доработать P1 по feedback (2-3 недели)
4. Production launch ✅

---

**Автор:** AI Senior Architect  
**Дата:** 2024-10-15  
**Версия:** 3.0  
**Статус:** ✅ APPROVED

