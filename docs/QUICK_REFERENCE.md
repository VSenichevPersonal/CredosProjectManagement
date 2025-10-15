# 📚 Quick Reference - Credos PM

## 🚀 Что работает ПРЯМО СЕЙЧАС

### ✅ Полностью рабочие страницы:

| URL | Функционал | API | Статус |
|-----|------------|-----|--------|
| `/projects` | Создать, удалить проект | ✅ | 🟢 РАБОТАЕТ |
| `/admin/dictionaries/directions` | Создать, удалить направление | ✅ | 🟢 РАБОТАЕТ |
| `/admin/dictionaries/employees` | Создать, удалить сотрудника | ✅ | 🟢 РАБОТАЕТ |
| `/directions` | Просмотр, удаление | ✅ | 🟢 РАБОТАЕТ |
| `/employees` | Просмотр, удаление | ✅ | 🟢 РАБОТАЕТ |
| `/my-tasks` | Просмотр, удаление задач | ✅ | 🟢 РАБОТАЕТ |
| `/my-time` | Просмотр часов | ✅ | 🟢 РАБОТАЕТ |
| `/approvals` | Согласование часов | ✅ | 🟡 ЧАСТИЧНО |
| `/analytics/profitability` | Рентабельность | ⏳ | 🟡 MOCK DATA |
| `/salary-fund` | Фонд ЗП | ⏳ | 🟡 MOCK DATA |

### ⏳ В разработке:

| Функция | Статус | Priority |
|---------|--------|----------|
| Редактирование | TODO | P0 |
| Server-side search | TODO | P1 |
| Batch operations | TODO | P0 |
| Export в CSV | TODO | P2 |
| Charts | TODO | P2 |

---

## 🎯 API Endpoints

### Projects
```
GET    /api/projects              # Список проектов
POST   /api/projects              # Создать проект
GET    /api/projects/[id]         # Детали проекта
PUT    /api/projects/[id]         # Обновить проект
DELETE /api/projects/[id]         # Удалить проект
```

### Employees
```
GET    /api/employees             # Список сотрудников
POST   /api/employees             # Создать сотрудника
GET    /api/employees/[id]        # Детали
PUT    /api/employees/[id]        # Обновить
DELETE /api/employees/[id]        # Soft delete
```

### Directions
```
GET    /api/directions            # Список направлений
POST   /api/directions            # Создать
GET    /api/directions/[id]       # Детали
PUT    /api/directions/[id]       # Обновить
DELETE /api/directions/[id]       # Удалить
```

### Tasks
```
GET    /api/tasks                 # Список задач
GET    /api/tasks?assigneeId=X    # Мои задачи
POST   /api/tasks                 # Создать
GET    /api/tasks/[id]            # Детали
PUT    /api/tasks/[id]            # Обновить
DELETE /api/tasks/[id]            # Удалить
```

### Time Entries
```
GET    /api/time-entries          # Список часов
POST   /api/time-entries          # Создать запись
POST   /api/time-entries          # Bulk create
```

### Finance
```
POST   /api/finance/revenues      # Ручные доходы
POST   /api/finance/salary        # Реестр зарплат
```

### Auth
```
POST   /api/auth/register         # Регистрация
POST   /api/auth/login            # Вход
POST   /api/auth/logout           # Выход
GET    /api/me                    # Текущий пользователь
```

---

## 🗄️ Database Tables

### Core Tables (5):
- `directions` - направления
- `employees` - сотрудники  
- `projects` - проекты
- `tasks` - задачи
- `time_entries` - учет времени

### Finance Tables (6):
- `finance.customer_order` - заказы
- `finance.order_service` - услуги
- `finance.revenue_manual` - доходы
- `finance.extra_cost` - затраты
- `finance.salary_register` - зарплаты
- `finance.allocation_rule` - правила

### System Tables (9):
- `auth.user` - пользователи
- `auth.session` - сессии
- `auth.key` - ключи
- `activity_log` - аудит
- `notifications` - уведомления
- `comments` - комментарии
- `project_members` - команды
- `project_phases` - фазы
- `approval_workflows` - согласования
- `settings` - настройки

**Всего:** 20+ таблиц

---

## 🎨 UI Components

### Основные:
- `AppLayout` - layout с сайдбаром
- `AppSidebar` - боковое меню
- `AppHeader` - шапка
- `UniversalDataTable` - универсальная таблица
- `Toaster` - уведомления

### shadcn/ui:
- Button, Input, Label
- Card, Dialog, Select
- Table, Badge, Textarea
- Toast

---

## 🔧 Development

### Запустить локально:
```bash
npm run dev
```

### Build:
```bash
npm run build
```

### Lint:
```bash
npm run lint
```

### Миграции:
```bash
npm run db:migrate
```

### Seed данные:
```bash
node scripts/seed.js
```

---

## 📖 Documentation Files

| Файл | Для кого | Что содержит |
|------|----------|--------------|
| `QA_TEST_PLAN.md` | QA Team | 340+ тест-кейсов |
| `SENIOR_ARCHITECT_TASKS.md` | Architect | 48 архитектурных задач |
| `PRODUCTION_READINESS_REPORT.md` | Product Owner | Оценка готовности |
| `DEPLOYMENT_INSTRUCTIONS.md` | DevOps | Инструкции по деплою |
| `QUICK_REFERENCE.md` | Все | Быстрая справка |

---

## 🎯 Quick Commands

```bash
# Применить миграции
npm run db:migrate

# Запустить dev
npm run dev

# Build
npm run build

# Проверить БД
psql $DATABASE_URL -c "SELECT COUNT(*) FROM projects"

# Railway deploy
git push origin main

# Посмотреть логи
railway logs

# Подключиться к БД
railway connect
```

---

## 🚨 Emergency Contacts

**Если что-то сломалось:**
1. Проверить логи в Railway
2. Проверить DATABASE_URL
3. Проверить миграции
4. Написать в чат разработки

**Если нашли баг:**
1. Создать issue в GitHub
2. Указать priority (P0, P1, P2, P3)
3. Приложить screenshot
4. Описать шаги воспроизведения

---

**СИСТЕМА ГОТОВА К ТЕСТИРОВАНИЮ! 🚀**
