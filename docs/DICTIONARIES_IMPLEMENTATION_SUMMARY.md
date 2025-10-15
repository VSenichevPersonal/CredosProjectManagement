# Реализация справочников в Credos PM

## Дата: 15 октября 2025

---

## 🎯 Цель

Реализовать настраиваемые справочники в системе Credos Project Management, вдохновляясь лучшими практиками из Timetta и Kimai.

## ✅ Выполненные задачи

### 1. Фиксы c.map is not a function (Критический баг)

**Проблема:** При открытии `/my-time` пользователь видел ошибку `c.map is not a function`.

**Root Cause:** Когда пользователь не авторизован, middleware редиректит на `/login`, но React Query успевает выполнить запросы к API. API возвращает HTML (страницу логина) вместо JSON, что вызывает ошибку при попытке `.map()` на некорректном объекте.

**Решение:**
- Добавлена проверка статуса `401/403` в React Query хуках
- Защита от некорректного формата: `if (!Array.isArray(data.data)) return { data: [], total: 0 }`
- Обновлены хуки:
  - `use-projects.ts`
  - `use-tasks.ts`
  - `use-time-entries.ts`

---

### 2. Generic компонент DictionaryManagementPanel

**Файл:** `src/components/admin/dictionary-management-panel.tsx`

**Возможности:**
- Универсальный CRUD для любого справочника
- Поддержка различных типов полей:
  - `text` — текстовое поле
  - `number` — числовое поле
  - `textarea` — многострочный текст
  - `email` — email с валидацией
  - `url` — URL с валидацией
  - `boolean` — переключатель (Switch)
- Валидация обязательных полей
- Интеграция с React Query
- Диалоги создания и редактирования
- Поиск и фильтрация
- Экспорт в Excel

**Использование:**
```typescript
<DictionaryManagementPanel config={{
  title: "Клиенты",
  description: "Управление клиентами",
  icon: Building2,
  apiPath: "/api/customers",
  columns: [...],
  fields: [...],
}} />
```

---

### 3. Справочник Customers (Клиенты)

**Миграция:** `prisma/migrations/011_customers_activities.sql`

**Таблица `customers`:**
- `id` — UUID, primary key
- `name` — Название (обязательно)
- `legal_name` — Полное юридическое название
- `inn` — ИНН
- `kpp` — КПП
- `contact_person` — Контактное лицо
- `email` — Email
- `phone` — Телефон
- `address` — Адрес
- `website` — Веб-сайт
- `notes` — Примечания
- `is_active` — Активен (по умолчанию `true`)
- `created_at`, `updated_at` — Метки времени

**API:**
- `GET /api/customers` — Список с фильтрами (`search`, `isActive`, `limit`, `offset`)
- `POST /api/customers` — Создание
- `GET /api/customers/[id]` — Получить по ID
- `PUT /api/customers/[id]` — Обновление
- `DELETE /api/customers/[id]` — Soft delete (`is_active = false`)

**UI:**
- `/admin/dictionaries/customers`

**Связи:**
- `projects.customer_id` → `customers.id` (FK)

---

### 4. Справочник Activities (Виды деятельности)

**Миграция:** `prisma/migrations/011_customers_activities.sql`

**Таблица `activities`:**
- `id` — UUID, primary key
- `name` — Название (обязательно)
- `description` — Описание
- `color` — Цвет (hex-код, по умолчанию `#3B82F6`)
- `default_hourly_rate` — Стандартная ставка (₽/ч)
- `is_billable` — Оплачиваемая (по умолчанию `true`)
- `is_active` — Активна (по умолчанию `true`)
- `created_at`, `updated_at` — Метки времени

**10 стандартных активностей:**
1. Разработка
2. Тестирование
3. Код-ревью
4. Документация
5. Встреча
6. Планирование
7. Анализ
8. Деплой
9. Обучение
10. Администрирование

**API:**
- `GET /api/activities` — Список с фильтрами
- `POST /api/activities` — Создание
- `GET /api/activities/[id]` — Получить по ID
- `PUT /api/activities/[id]` — Обновление
- `DELETE /api/activities/[id]` — Soft delete

**UI:**
- `/admin/dictionaries/activities`

**Связи:**
- `time_entries.activity_id` → `activities.id` (FK)

---

### 5. Справочник Tags (Теги)

**Миграция:** `prisma/migrations/012_tags.sql`

**Таблица `tags`:**
- `id` — UUID, primary key
- `name` — Название (обязательно, уникальное)
- `color` — Цвет (hex-код, по умолчанию `#3B82F6`)
- `description` — Описание
- `is_active` — Активен (по умолчанию `true`)
- `created_at`, `updated_at` — Метки времени

**8 стандартных тегов:**
1. Срочно (#EF4444 — красный)
2. Важно (#F59E0B — оранжевый)
3. Бэклог (#6B7280 — серый)
4. Исследование (#8B5CF6 — фиолетовый)
5. Разработка (#3B82F6 — синий)
6. Тестирование (#10B981 — зелёный)
7. Документация (#14B8A6 — бирюзовый)
8. Багфикс (#DC2626 — тёмно-красный)

**Таблица `project_tags` (many-to-many):**
- `project_id` → `projects.id` (FK, CASCADE)
- `tag_id` → `tags.id` (FK, CASCADE)

**Таблица `task_tags` (many-to-many):**
- `task_id` → `tasks.id` (FK, CASCADE)
- `tag_id` → `tags.id` (FK, CASCADE)

**API:**
- `GET /api/tags` — Список с фильтрами
- `POST /api/tags` — Создание (с валидацией hex-кода)
- `GET /api/tags/[id]` — Получить по ID
- `PUT /api/tags/[id]` — Обновление
- `DELETE /api/tags/[id]` — Soft delete

**UI:**
- `/admin/dictionaries/tags`
- Визуальное отображение цветов в таблице
- Валидация hex-кодов (#RRGGBB)

---

### 6. Главная страница справочников

**Файл:** `src/app/(dashboard)/admin/dictionaries/page.tsx`

**Функциональность:**
- Карточки всех справочников с иконками и описаниями
- Статусы:
  - `active` — готово к использованию (Customers, Activities, Tags)
  - `planned` — в разработке (Project Rates, Work Calendars)
- Информационный блок о том, что такое справочники

---

## 📊 Статистика

### Созданные файлы

**Backend (API):**
- `src/app/api/customers/route.ts` — GET, POST
- `src/app/api/customers/[id]/route.ts` — GET, PUT, DELETE
- `src/app/api/activities/route.ts` — GET, POST
- `src/app/api/activities/[id]/route.ts` — GET, PUT, DELETE
- `src/app/api/tags/route.ts` — GET, POST
- `src/app/api/tags/[id]/route.ts` — GET, PUT, DELETE

**Frontend (UI):**
- `src/components/admin/dictionary-management-panel.tsx` — generic компонент
- `src/app/(dashboard)/admin/dictionaries/page.tsx` — главная страница
- `src/app/(dashboard)/admin/dictionaries/customers/page.tsx`
- `src/app/(dashboard)/admin/dictionaries/activities/page.tsx`
- `src/app/(dashboard)/admin/dictionaries/tags/page.tsx`

**Domain Types:**
- `src/types/domain/customer.ts`
- `src/types/domain/activity.ts`
- `src/types/domain/tag.ts`

**Migrations:**
- `prisma/migrations/011_customers_activities.sql`
- `prisma/migrations/012_tags.sql`

**Всего:** 15 новых файлов

---

## 🎨 Архитектурные решения

### 1. Generic компонент

Вместо дублирования кода для каждого справочника, создан универсальный компонент `DictionaryManagementPanel`, который принимает конфигурацию и рендерит полный CRUD интерфейс.

**Преимущества:**
- Единообразный UX для всех справочников
- Меньше кода для поддержки
- Легко добавлять новые справочники

### 2. Soft delete

Все справочники используют soft delete (`is_active = false`) вместо физического удаления. Это обеспечивает:
- Сохранение истории
- Возможность восстановления
- Целостность данных (нет сиротских FK)

### 3. Many-to-Many для Tags

Теги связаны с проектами и задачами через промежуточные таблицы `project_tags` и `task_tags`, что позволяет:
- Назначать несколько тегов на один проект/задачу
- Один тег использовать для многих проектов/задач
- Легко добавлять/удалять теги без изменения основных таблиц

### 4. Цветовая кодировка

- **Activities** имеют поле `color` для визуального различия в интерфейсе
- **Tags** имеют поле `color` с валидацией hex-кодов (#RRGGBB)
- Это улучшает UX и помогает быстро идентифицировать элементы

---

## 🔧 Технический стек

- **Backend:** Next.js API Routes + PostgreSQL (pg)
- **Frontend:** React + TypeScript + Tailwind CSS
- **State Management:** TanStack React Query
- **Validation:** Zod
- **UI Components:** Radix UI + shadcn/ui
- **Icons:** Lucide React

---

## 📝 TODO (Следующие шаги)

### P1 (Средний приоритет)

1. **Project Rates** — почасовые ставки по проектам
   - Таблица `project_rates`
   - Связь с `projects` и `employees`
   - Переопределение базовой ставки сотрудника для конкретного проекта

2. **Work Calendars** — производственные календари
   - Таблица `work_calendars`
   - Таблица `calendar_exceptions` (выходные, праздники)
   - Интеграция с расчётом рабочих часов

### P2 (Низкий приоритет)

3. **Tag Usage Analytics**
   - Сколько проектов/задач используют каждый тег
   - Отчёт по самым популярным тегам

4. **Customer Analytics**
   - Общий доход от клиента
   - Количество проектов от клиента
   - История взаимодействий

5. **Activity Analytics**
   - Сколько часов на каждый вид деятельности
   - Средняя ставка по виду деятельности

---

## 🚀 Деплой

**Коммиты:**
1. `fix: защита от некорректного формата данных в React Query хуках + API Activities` (31cd6f10)
2. `feat: полная реализация справочников Customers и Activities` (19f4260e)
3. `feat: добавлен справочник Tags (Теги)` (b8b1096a)

**Railway:** Все изменения автоматически задеплоены на `https://credos1.up.railway.app`

---

## 📚 Документация

- **Product Requirements:** `docs/DICTIONARIES_PRODUCT_REQUIREMENTS.md`
- **Implementation Summary:** `docs/DICTIONARIES_IMPLEMENTATION_SUMMARY.md` (этот файл)
- **Admin Panel Guide:** `docs/ADMIN_PANEL_USER_GUIDE.md`

---

## 🎉 Итоги

### Что было сделано:

✅ Исправлен критический баг `c.map is not a function`  
✅ Создан generic компонент `DictionaryManagementPanel`  
✅ Реализован справочник **Customers** (миграция + API + UI)  
✅ Реализован справочник **Activities** (миграция + API + UI)  
✅ Реализован справочник **Tags** (миграция + API + UI)  
✅ Обновлена главная страница `/admin/dictionaries`  
✅ Все изменения задеплоены на Railway  
✅ Написана документация  

### Метрики:

- **15 новых файлов**
- **3 миграции** (2 SQL файла, 1 комбинированная)
- **6 API endpoints** (по 2 на каждый справочник)
- **3 UI страницы**
- **1 generic компонент**
- **3 Git коммита**

---

**Автор:** Credos PM Team  
**Дата:** 15 октября 2025  
**Версия:** 1.0

