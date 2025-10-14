# Индекс компонентов

Полный список всех React компонентов с описанием и использованием.

## 📋 Административные компоненты

### `components/admin/`

#### `admin-data-table.tsx`
**Назначение**: Универсальная таблица данных с пагинацией, сортировкой, фильтрацией  
**Props**: `columns`, `data`, `pagination`, `onPageChange`, `filters`  
**Используется в**: Все админ страницы (users, organizations, requirements)

#### `create-role-dialog.tsx`
**Назначение**: Диалог создания новой роли  
**Props**: `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `/admin/roles`

#### `permissions-matrix.tsx`
**Назначение**: Матрица прав доступа (роли × ресурсы)  
**Props**: `roleId`, `permissions`, `onUpdate`  
**Используется в**: `/admin/roles/[id]`

#### `role-card.tsx`
**Назначение**: Карточка роли с описанием и количеством пользователей  
**Props**: `role`, `onEdit`, `onDelete`  
**Используется в**: `/admin/roles`

#### `roles-management.tsx`
**Назначение**: Управление ролями и правами  
**Props**: `tenantId`  
**Используется в**: `/admin/roles`

#### `legal-article-form-dialog.tsx`
**Назначение**: Форма создания/редактирования статьи закона  
**Props**: `article?`, `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `/admin/dictionaries/legal-articles`

#### `legal-articles-table.tsx`
**Назначение**: Таблица статей законов с фильтрацией  
**Props**: `articles`, `onEdit`, `onDelete`  
**Используется в**: `/admin/dictionaries/legal-articles`

#### `organization-type-form-dialog.tsx`
**Назначение**: Форма создания/редактирования типа организации  
**Props**: `type?`, `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `/admin/dictionaries/organization-types`

#### `regulatory-framework-form-dialog.tsx`
**Назначение**: Форма создания/редактирования нормативной базы  
**Props**: `framework?`, `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `/admin/dictionaries/regulatory-frameworks`

### `components/admin/tenants/`

#### `create-tenant-dialog.tsx`
**Назначение**: Диалог создания нового тенанта  
**Props**: `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `/admin/system` (только super_admin)

#### `edit-tenant-dialog.tsx`
**Назначение**: Диалог редактирования тенанта  
**Props**: `tenant`, `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `/admin/tenants/[id]`

#### `tenant-detail-dialog.tsx`
**Назначение**: Детальная информация о тенанте с табами  
**Props**: `tenantId`, `open`, `onOpenChange`  
**Используется в**: `/admin/tenants`

#### `tenant-info-tab.tsx`
**Назначение**: Вкладка с основной информацией о тенанте  
**Props**: `tenant`  
**Используется в**: `tenant-detail-dialog.tsx`

#### `tenant-stats-tab.tsx`
**Назначение**: Вкладка со статистикой тенанта  
**Props**: `tenantId`  
**Используется в**: `tenant-detail-dialog.tsx`

#### `tenant-users-tab.tsx`
**Назначение**: Вкладка с пользователями тенанта  
**Props**: `tenantId`  
**Используется в**: `tenant-detail-dialog.tsx`

#### `tenant-audit-tab.tsx`
**Назначение**: Вкладка с аудит логом тенанта  
**Props**: `tenantId`  
**Используется в**: `tenant-detail-dialog.tsx`

## 📊 Аналитика

### `components/analytics/`

#### `compliance-by-regulator-chart.tsx`
**Назначение**: График комплаенса по регуляторам  
**Props**: `data`, `height?`  
**Используется в**: `/analytics`

#### `compliance-trend-chart.tsx`
**Назначение**: График тренда комплаенса по времени  
**Props**: `data`, `height?`  
**Используется в**: `/analytics`, `/dashboard`

#### `organization-comparison-chart.tsx`
**Назначение**: Сравнение организаций по комплаенсу  
**Props**: `organizations`, `height?`  
**Используется в**: `/analytics`

#### `requirement-category-chart.tsx`
**Назначение**: Распределение требований по категориям  
**Props**: `data`, `height?`  
**Используется в**: `/analytics`, `/requirements`

#### `risk-heatmap.tsx`
**Назначение**: Тепловая карта рисков  
**Props**: `data`, `width?`, `height?`  
**Используется в**: `/risks`, `/heatmap`

## ✅ Комплаенс

### `components/compliance/`

#### `approval-dialog.tsx`
**Назначение**: Диалог согласования комплаенса (approve/reject)  
**Props**: `complianceId`, `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `pending-review-table.tsx`

#### `assign-user-dialog.tsx`
**Назначение**: Диалог назначения ответственного  
**Props**: `complianceId`, `currentUserId?`, `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `compliance-table.tsx`

#### `assignment-card.tsx`
**Назначение**: Карточка назначения с информацией об ответственном  
**Props**: `compliance`, `onReassign`  
**Используется в**: `/compliance/[id]`

#### `bulk-compliance-actions.tsx`
**Назначение**: Массовые операции над комплаенсом  
**Props**: `selectedIds`, `onSuccess`  
**Используется в**: `compliance-table.tsx`

#### `compliance-table.tsx`
**Назначение**: Таблица комплаенса с фильтрацией и bulk actions  
**Props**: `organizationId?`, `requirementId?`, `filters?`  
**Используется в**: `/compliance`, `/organizations/[id]`, `/requirements/[id]`

#### `pending-review-table.tsx`
**Назначение**: Таблица комплаенса на согласовании  
**Props**: `userId?`  
**Используется в**: `/compliance/pending-review`

#### `set-deadline-dialog.tsx`
**Назначение**: Диалог установки дедлайна  
**Props**: `complianceId`, `currentDeadline?`, `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `compliance-table.tsx`

#### `update-status-dialog.tsx`
**Назначение**: Диалог обновления статуса комплаенса  
**Props**: `complianceId`, `currentStatus`, `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `compliance-table.tsx`

#### `workflow-status-card.tsx`
**Назначение**: Карточка статуса workflow  
**Props**: `status`, `assignedTo?`, `deadline?`  
**Используется в**: `/compliance/[id]`

#### `workflow-timeline.tsx`
**Назначение**: Timeline истории изменений комплаенса  
**Props**: `complianceId`  
**Используется в**: `/compliance/[id]`

## 🛡️ Меры защиты (Controls)

### `components/controls/`

#### `control-card.tsx`
**Назначение**: Карточка меры защиты  
**Props**: `control`, `onEdit`, `onDelete`, `onViewDetails`  
**Используется в**: `controls-library.tsx`

#### `control-detail-dialog.tsx`
**Назначение**: Детальная информация о мере защиты  
**Props**: `controlId`, `open`, `onOpenChange`  
**Используется в**: `control-card.tsx`

#### `control-frequency-badge.tsx`
**Назначение**: Badge частоты выполнения меры  
**Props**: `frequency`  
**Используется в**: `control-card.tsx`, `control-detail-dialog.tsx`

#### `control-frequency-filter.tsx`
**Назначение**: Фильтр по частоте выполнения  
**Props**: `value`, `onChange`  
**Используется в**: `controls-library.tsx`

#### `control-type-badge.tsx`
**Назначение**: Badge типа меры (preventive, detective, corrective)  
**Props**: `type`  
**Используется в**: `control-card.tsx`, `control-detail-dialog.tsx`

#### `control-type-filter.tsx`
**Назначение**: Фильтр по типу меры  
**Props**: `value`, `onChange`  
**Используется в**: `controls-library.tsx`

#### `controls-library.tsx`
**Назначение**: Библиотека мер защиты с фильтрацией  
**Props**: `requirementId?`, `organizationId?`  
**Используется в**: `/controls`, `/requirements/[id]`

#### `create-control-dialog.tsx`
**Назначение**: Диалог создания новой меры защиты  
**Props**: `requirementId?`, `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `controls-library.tsx`

### `components/control-templates/`

#### `control-template-card.tsx`
**Назначение**: Карточка типового шаблона меры  
**Props**: `template`, `onApply`, `onEdit`, `onDelete`  
**Используется в**: `control-templates-library.tsx`

#### `control-templates-library.tsx`
**Назначение**: Библиотека типовых шаблонов мер  
**Props**: `frameworkId?`  
**Используется в**: `/control-templates`

#### `create-control-template-dialog.tsx`
**Назначение**: Диалог создания типового шаблона  
**Props**: `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `control-templates-library.tsx`

#### `edit-control-template-dialog.tsx`
**Назначение**: Диалог редактирования типового шаблона  
**Props**: `template`, `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `control-template-card.tsx`

#### `view-control-template-dialog.tsx`
**Назначение**: Просмотр деталей типового шаблона  
**Props**: `templateId`, `open`, `onOpenChange`  
**Используется в**: `control-template-card.tsx`

## 📄 Документы

### `components/documents/`

#### `document-card.tsx`
**Назначение**: Карточка документа с статусом актуальности  
**Props**: `document`, `onView`, `onEdit`, `onDelete`  
**Используется в**: `/documents`

#### `document-detail-dialog.tsx`
**Назначение**: Детальная информация о документе  
**Props**: `documentId`, `open`, `onOpenChange`  
**Используется в**: `document-card.tsx`

#### `document-upload-dialog.tsx`
**Назначение**: Диалог загрузки нового документа  
**Props**: `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `/documents`

#### `document-version-history.tsx`
**Назначение**: История версий документа  
**Props**: `documentId`  
**Используется в**: `document-detail-dialog.tsx`

#### `document-actuality-badge.tsx`
**Назначение**: Badge актуальности документа  
**Props**: `status`, `lastChecked?`  
**Используется в**: `document-card.tsx`

## 📋 Dashboard

### `components/dashboard/`

#### `compliance-chart.tsx`
**Назначение**: График комплаенса на главной странице  
**Props**: `organizationId?`, `height?`  
**Используется в**: `/dashboard`

#### `compliance-overview-card.tsx`
**Назначение**: Карточка обзора комплаенса  
**Props**: `organizationId?`  
**Используется в**: `/dashboard`

#### `controls-stats-card.tsx`
**Назначение**: Карточка статистики мер защиты  
**Props**: `organizationId?`  
**Используется в**: `/dashboard`

#### `document-actuality-card.tsx`
**Назначение**: Карточка актуальности документов  
**Props**: None  
**Используется в**: `/dashboard`

#### `evidence-stats-card.tsx`
**Назначение**: Карточка статистики доказательств  
**Props**: `organizationId?`  
**Используется в**: `/dashboard`

#### `pending-tasks-card.tsx`
**Назначение**: Карточка ожидающих задач  
**Props**: `userId`  
**Используется в**: `/dashboard`

#### `recent-activity-card.tsx`
**Назначение**: Карточка последней активности  
**Props**: `limit?`  
**Используется в**: `/dashboard`

#### `requirements-stats-card.tsx`
**Назначение**: Карточка статистики требований  
**Props**: `organizationId?`  
**Используется в**: `/dashboard`

## 📁 Доказательства (Evidence)

### `components/evidence/`

#### `evidence-card.tsx`
**Назначение**: Карточка доказательства с превью  
**Props**: `evidence`, `onView`, `onEdit`, `onDelete`, `onApprove`, `onReject`  
**Используется в**: `/evidence`, `/compliance/[id]`

#### `evidence-upload-dialog.tsx`
**Назначение**: Диалог загрузки доказательства  
**Props**: `complianceId?`, `requirementId?`, `controlId?`, `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `/evidence`, `/compliance/[id]`

#### `evidence-detail-dialog.tsx`
**Назначение**: Детальная информация о доказательстве  
**Props**: `evidenceId`, `open`, `onOpenChange`  
**Используется в**: `evidence-card.tsx`

#### `evidence-status-badge.tsx`
**Назначение**: Badge статуса доказательства  
**Props**: `status`  
**Используется в**: `evidence-card.tsx`

#### `evidence-type-badge.tsx`
**Назначение**: Badge типа доказательства  
**Props**: `type`  
**Используется в**: `evidence-card.tsx`

#### `bulk-evidence-actions.tsx`
**Назначение**: Массовые операции над доказательствами  
**Props**: `selectedIds`, `onSuccess`  
**Используется в**: `/evidence`

## 🏢 Организации

### `components/organizations/`

#### `organization-card.tsx`
**Назначение**: Карточка организации  
**Props**: `organization`, `onView`, `onEdit`, `onDelete`  
**Используется в**: `/organizations`

#### `organization-tree.tsx`
**Назначение**: Дерево иерархии организаций  
**Props**: `rootOrganizationId?`, `onSelect`  
**Используется в**: `/organizations`, `/admin/organizations`

#### `organization-detail-dialog.tsx`
**Назначение**: Детальная информация об организации  
**Props**: `organizationId`, `open`, `onOpenChange`  
**Используется в**: `organization-card.tsx`

#### `create-organization-dialog.tsx`
**Назначение**: Диалог создания новой организации  
**Props**: `parentId?`, `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `/organizations`, `organization-tree.tsx`

#### `edit-organization-dialog.tsx`
**Назначение**: Диалог редактирования организации  
**Props**: `organization`, `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `organization-card.tsx`

#### `organization-type-badge.tsx`
**Назначение**: Badge типа организации  
**Props**: `type`  
**Используется в**: `organization-card.tsx`

## 📝 Требования (Requirements)

### `components/requirements/`

#### `requirement-card.tsx`
**Назначение**: Карточка требования  
**Props**: `requirement`, `onView`, `onEdit`, `onDelete`  
**Используется в**: `/requirements`, `/requirements/library`

#### `requirement-detail-dialog.tsx`
**Назначение**: Детальная информация о требовании  
**Props**: `requirementId`, `open`, `onOpenChange`  
**Используется в**: `requirement-card.tsx`

#### `create-requirement-dialog.tsx`
**Назначение**: Диалог создания нового требования  
**Props**: `documentId?`, `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `/requirements`, `/documents/[id]`

#### `edit-requirement-dialog.tsx`
**Назначение**: Диалог редактирования требования  
**Props**: `requirement`, `open`, `onOpenChange`, `onSuccess`  
**Используется в**: `requirement-card.tsx`

#### `requirement-criticality-badge.tsx`
**Назначение**: Badge критичности требования  
**Props**: `criticality`  
**Используется в**: `requirement-card.tsx`

#### `requirement-status-badge.tsx`
**Назначение**: Badge статуса требования  
**Props**: `status`  
**Используется в**: `requirement-card.tsx`

#### `applicability-manager.tsx`
**Назначение**: Управление применимостью требования к организациям  
**Props**: `requirementId`  
**Используется в**: `/requirements/[id]`

## 🎨 Layout компоненты

### `components/layout/`

#### `app-layout.tsx`
**Назначение**: Основной layout приложения с sidebar и header  
**Props**: `children`  
**Используется в**: `app/(dashboard)/layout.tsx`

#### `app-sidebar.tsx`
**Назначение**: Боковое меню навигации  
**Props**: None  
**Используется в**: `app-layout.tsx`

#### `app-header.tsx`
**Назначение**: Шапка приложения с уведомлениями и профилем  
**Props**: None  
**Используется в**: `app-layout.tsx`

#### `notification-bell.tsx`
**Назначение**: Колокольчик уведомлений в header  
**Props**: None  
**Используется в**: `app-header.tsx`

#### `page-breadcrumbs.tsx`
**Назначение**: Автоматические breadcrumbs на основе URL  
**Props**: None  
**Используется в**: `app-layout.tsx`

#### `user-menu.tsx`
**Назначение**: Меню пользователя (профиль, настройки, выход)  
**Props**: None  
**Используется в**: `app-header.tsx`

#### `tenant-switcher.tsx`
**Назначение**: Переключатель тенантов (для super_admin)  
**Props**: None  
**Используется в**: `app-header.tsx`

## 🔔 Уведомления

### `components/notifications/`

#### `notification-list.tsx`
**Назначение**: Список всех уведомлений с фильтрацией  
**Props**: `userId?`, `filters?`  
**Используется в**: `/notifications`

#### `notification-item.tsx`
**Назначение**: Элемент уведомления  
**Props**: `notification`, `onRead`, `onDelete`  
**Используется в**: `notification-list.tsx`, `notification-bell.tsx`

## 🔐 Аутентификация

### `components/auth/`

#### `can.tsx`
**Назначение**: HOC для проверки прав доступа  
**Props**: `action`, `resource`, `children`, `fallback?`  
**Используется в**: Везде где нужна проверка прав

#### `protected-route.tsx`
**Назначение**: HOC для защиты роутов  
**Props**: `allowedRoles`, `children`  
**Используется в**: Страницы с ограниченным доступом

## 🎛️ Настройки

### `components/settings/`

#### `notification-settings.tsx`
**Назначение**: Настройки уведомлений пользователя  
**Props**: `userId`  
**Используется в**: `/settings`

#### `profile-settings.tsx`
**Назначение**: Настройки профиля пользователя  
**Props**: `userId`  
**Используется в**: `/settings`

#### `password-change-form.tsx`
**Назначение**: Форма смены пароля  
**Props**: None  
**Используется в**: `/settings`

## 🔍 Поиск

### `components/search/`

#### `global-search.tsx`
**Назначение**: Глобальный поиск по всей системе  
**Props**: None  
**Используется в**: `app-header.tsx`

#### `search-results.tsx`
**Назначение**: Результаты поиска с группировкой по типам  
**Props**: `query`, `results`  
**Используется в**: `global-search.tsx`

## 🛠️ Общие компоненты

### `components/common/`

#### `bulk-action-dialog.tsx`
**Назначение**: Универсальный диалог для массовых операций  
**Props**: `title`, `description`, `action`, `selectedCount`, `onConfirm`, `open`, `onOpenChange`  
**Используется в**: Все таблицы с bulk actions

#### `empty-state.tsx`
**Назначение**: Пустое состояние с иконкой и текстом  
**Props**: `icon`, `title`, `description`, `action?`  
**Используется в**: Везде где нет данных

#### `loading-spinner.tsx`
**Назначение**: Спиннер загрузки  
**Props**: `size?`, `text?`  
**Используется в**: Везде где идет загрузка

#### `error-boundary.tsx`
**Назначение**: Обработчик ошибок React  
**Props**: `children`, `fallback?`  
**Используется в**: Корневой layout

## 📊 UI компоненты (shadcn/ui)

### `components/ui/`

Все компоненты из shadcn/ui библиотеки:
- `button.tsx` - Кнопки
- `card.tsx` - Карточки
- `dialog.tsx` - Модальные окна
- `input.tsx` - Поля ввода
- `select.tsx` - Выпадающие списки
- `table.tsx` - Таблицы
- `badge.tsx` - Badges
- `breadcrumb.tsx` - Breadcrumbs
- `dropdown-menu.tsx` - Dropdown меню
- `tabs.tsx` - Табы
- `toast.tsx` - Уведомления
- И другие...

## 🔍 Как найти нужный компонент?

### По функционалу
- **Создание** → `create-*-dialog.tsx`
- **Редактирование** → `edit-*-dialog.tsx`
- **Просмотр** → `*-detail-dialog.tsx` или `view-*-dialog.tsx`
- **Список** → `*-table.tsx` или `*-list.tsx`
- **Карточка** → `*-card.tsx`
- **Фильтр** → `*-filter.tsx`
- **Badge** → `*-badge.tsx`

### По сущности
- **Комплаенс** → `components/compliance/`
- **Требования** → `components/requirements/`
- **Организации** → `components/organizations/`
- **Документы** → `components/documents/`
- **Доказательства** → `components/evidence/`
- **Меры защиты** → `components/controls/`
- **Админ** → `components/admin/`
