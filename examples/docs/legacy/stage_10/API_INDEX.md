# Индекс API Endpoints

Полный список всех API endpoints с описанием и примерами использования.

## 🔐 Аутентификация

### `GET /api/auth/me`
**Назначение**: Получить текущего пользователя  
**Auth**: Required  
**Response**: `User`

### `GET /api/auth/permissions`
**Назначение**: Получить права текущего пользователя  
**Auth**: Required  
**Response**: `Permission[]`

## ✅ Комплаенс

### `GET /api/compliance`
**Назначение**: Получить список комплаенса с фильтрацией  
**Auth**: Required  
**Query Params**:
- `organizationId?: string`
- `requirementId?: string`
- `status?: string`
- `assignedTo?: string`
- `page?: number`
- `limit?: number`

**Response**: `{ data: Compliance[], total: number, page: number, limit: number }`

### `POST /api/compliance`
**Назначение**: Создать новый комплаенс  
**Auth**: Required  
**Body**: `CreateComplianceDTO`  
**Response**: `Compliance`

### `GET /api/compliance/[id]`
**Назначение**: Получить комплаенс по ID  
**Auth**: Required  
**Response**: `Compliance`

### `PATCH /api/compliance/[id]`
**Назначение**: Обновить комплаенс  
**Auth**: Required  
**Body**: `UpdateComplianceDTO`  
**Response**: `Compliance`

### `DELETE /api/compliance/[id]`
**Назначение**: Удалить комплаенс  
**Auth**: Required  
**Response**: `{ success: boolean }`

### `POST /api/compliance/[id]/review`
**Назначение**: Согласовать/отклонить комплаенс  
**Auth**: Required (reviewer)  
**Body**: `{ decision: "approved" | "rejected", comments?: string }`  
**Response**: `Compliance`

### `POST /api/compliance/bulk-update`
**Назначение**: Массовое обновление комплаенса  
**Auth**: Required  
**Body**: `{ ids: string[], updates: UpdateComplianceDTO }`  
**Response**: `{ updated: number }`

### `POST /api/compliance/bulk-delete`
**Назначение**: Массовое удаление комплаенса  
**Auth**: Required  
**Body**: `{ ids: string[] }`  
**Response**: `{ deleted: number }`

### `GET /api/compliance/heatmap`
**Назначение**: Получить данные для тепловой карты комплаенса  
**Auth**: Required  
**Query Params**: `organizationId?: string`  
**Response**: `HeatmapData[]`

## 📝 Требования (Requirements)

### `GET /api/requirements`
**Назначение**: Получить список требований с фильтрацией  
**Auth**: Required  
**Query Params**:
- `category?: string`
- `criticality?: string`
- `status?: string`
- `search?: string`
- `page?: number`
- `limit?: number`

**Response**: `{ data: Requirement[], total: number, page: number, limit: number }`

### `POST /api/requirements`
**Назначение**: Создать новое требование  
**Auth**: Required (admin)  
**Body**: `CreateRequirementDTO`  
**Response**: `Requirement`

### `GET /api/requirements/[id]`
**Назначение**: Получить требование по ID  
**Auth**: Required  
**Response**: `Requirement`

### `PATCH /api/requirements/[id]`
**Назначение**: Обновить требование  
**Auth**: Required (admin)  
**Body**: `UpdateRequirementDTO`  
**Response**: `Requirement`

### `DELETE /api/requirements/[id]`
**Назначение**: Удалить требование  
**Auth**: Required (admin)  
**Response**: `{ success: boolean }`

### `GET /api/requirements/[id]/applicability`
**Назначение**: Получить применимость требования к организациям  
**Auth**: Required  
**Response**: `{ organizations: Organization[], isApplicable: boolean }[]`

### `POST /api/requirements/[id]/applicability`
**Назначение**: Обновить применимость требования  
**Auth**: Required (admin)  
**Body**: `{ organizationIds: string[], isApplicable: boolean }`  
**Response**: `{ updated: number }`

### `GET /api/requirements/[id]/applicability/organizations`
**Назначение**: Получить организации, к которым применимо требование  
**Auth**: Required  
**Response**: `Organization[]`

### `POST /api/requirements/[id]/applicability/manual`
**Назначение**: Вручную установить применимость  
**Auth**: Required (admin)  
**Body**: `{ organizationId: string, isApplicable: boolean, reason?: string }`  
**Response**: `{ success: boolean }`

### `POST /api/requirements/[id]/compliance/bulk-create`
**Назначение**: Массовое создание комплаенса для требования  
**Auth**: Required (admin)  
**Body**: `{ organizationIds: string[] }`  
**Response**: `{ created: number }`

### `GET /api/requirements/[id]/controls`
**Назначение**: Получить меры защиты для требования  
**Auth**: Required  
**Response**: `Control[]`

### `GET /api/requirements/[id]/templates`
**Назначение**: Получить типовые шаблоны для требования  
**Auth**: Required  
**Response**: `ControlTemplate[]`

### `POST /api/requirements/[id]/templates`
**Назначение**: Связать типовой шаблон с требованием  
**Auth**: Required (admin)  
**Body**: `{ templateId: string }`  
**Response**: `{ success: boolean }`

### `DELETE /api/requirements/[id]/templates/[linkId]`
**Назначение**: Удалить связь с типовым шаблоном  
**Auth**: Required (admin)  
**Response**: `{ success: boolean }`

### `GET /api/requirements/templates`
**Назначение**: Получить все типовые шаблоны  
**Auth**: Required  
**Response**: `ControlTemplate[]`

## 🏢 Организации

### `GET /api/organizations`
**Назначение**: Получить список организаций  
**Auth**: Required  
**Query Params**:
- `type?: string`
- `parentId?: string`
- `search?: string`
- `page?: number`
- `limit?: number`

**Response**: `{ data: Organization[], total: number, page: number, limit: number }`

### `POST /api/organizations`
**Назначение**: Создать новую организацию  
**Auth**: Required (admin)  
**Body**: `CreateOrganizationDTO`  
**Response**: `Organization`

### `GET /api/organizations/[id]`
**Назначение**: Получить организацию по ID  
**Auth**: Required  
**Response**: `Organization`

### `PATCH /api/organizations/[id]`
**Назначение**: Обновить организацию  
**Auth**: Required (admin)  
**Body**: `UpdateOrganizationDTO`  
**Response**: `Organization`

### `DELETE /api/organizations/[id]`
**Назначение**: Удалить организацию  
**Auth**: Required (admin)  
**Response**: `{ success: boolean }`

### `GET /api/organizations/[id]/requirements`
**Назначение**: Получить требования для организации  
**Auth**: Required  
**Query Params**: `status?: string`, `category?: string`  
**Response**: `Requirement[]`

### `POST /api/organizations/[id]/requirements`
**Назначение**: Добавить требование к организации  
**Auth**: Required (admin)  
**Body**: `{ requirementId: string }`  
**Response**: `{ success: boolean }`

### `DELETE /api/organizations/[id]/requirements/[requirementId]`
**Назначение**: Удалить требование из организации  
**Auth**: Required (admin)  
**Response**: `{ success: boolean }`

### `POST /api/organizations/[id]/requirements/manual`
**Назначение**: Вручную установить применимость требования  
**Auth**: Required (admin)  
**Body**: `{ requirementId: string, isApplicable: boolean }`  
**Response**: `{ success: boolean }`

### `GET /api/organizations/[id]/controls`
**Назначение**: Получить меры защиты организации  
**Auth**: Required  
**Response**: `Control[]`

### `GET /api/organizations/[id]/attributes`
**Назначение**: Получить атрибуты организации  
**Auth**: Required  
**Response**: `OrganizationAttribute[]`

### `GET /api/organizations/hierarchy`
**Назначение**: Получить иерархию организаций  
**Auth**: Required  
**Query Params**: `rootId?: string`  
**Response**: `OrganizationTree`

## 📄 Документы

### `GET /api/documents`
**Назначение**: Получить список документов  
**Auth**: Required  
**Query Params**:
- `type?: string`
- `status?: string`
- `search?: string`
- `page?: number`
- `limit?: number`

**Response**: `{ data: Document[], total: number, page: number, limit: number }`

### `POST /api/documents`
**Назначение**: Создать новый документ  
**Auth**: Required (admin)  
**Body**: `CreateDocumentDTO`  
**Response**: `Document`

### `POST /api/documents/upload`
**Назначение**: Загрузить файл документа  
**Auth**: Required (admin)  
**Body**: `FormData` (multipart/form-data)  
**Response**: `{ fileUrl: string, fileName: string, fileSize: number }`

### `GET /api/documents/[id]`
**Назначение**: Получить документ по ID  
**Auth**: Required  
**Response**: `Document`

### `PATCH /api/documents/[id]`
**Назначение**: Обновить документ  
**Auth**: Required (admin)  
**Body**: `UpdateDocumentDTO`  
**Response**: `Document`

### `DELETE /api/documents/[id]`
**Назначение**: Удалить документ  
**Auth**: Required (admin)  
**Response**: `{ success: boolean }`

### `POST /api/documents/[id]/analyze`
**Назначение**: Запустить анализ документа (извлечение требований)  
**Auth**: Required (admin)  
**Response**: `{ analysisId: string }`

### `GET /api/documents/[id]/analyses`
**Назначение**: Получить результаты анализа документа  
**Auth**: Required  
**Response**: `DocumentAnalysis[]`

### `GET /api/documents/[id]/versions`
**Назначение**: Получить версии документа  
**Auth**: Required  
**Response**: `DocumentVersion[]`

### `POST /api/documents/[id]/review`
**Назначение**: Проверить актуальность документа  
**Auth**: Required (admin)  
**Response**: `{ isActual: boolean, lastChecked: Date }`

### `GET /api/documents/[id]/diff`
**Назначение**: Получить diff между версиями документа  
**Auth**: Required  
**Query Params**: `fromVersion: string`, `toVersion: string`  
**Response**: `{ diff: string, changes: Change[] }`

### `GET /api/documents/actuality/stats`
**Назначение**: Получить статистику актуальности документов  
**Auth**: Required  
**Response**: `{ total: number, actual: number, outdated: number, needsReview: number }`

### `GET /api/documents/actuality/attention`
**Назначение**: Получить документы, требующие внимания  
**Auth**: Required  
**Response**: `Document[]`

## 📁 Доказательства (Evidence)

### `GET /api/evidence`
**Назначение**: Получить список доказательств  
**Auth**: Required  
**Query Params**:
- `complianceId?: string`
- `requirementId?: string`
- `controlId?: string`
- `status?: string`
- `type?: string`
- `page?: number`
- `limit?: number`

**Response**: `{ data: Evidence[], total: number, page: number, limit: number }`

### `POST /api/evidence`
**Назначение**: Создать новое доказательство (загрузить файл)  
**Auth**: Required  
**Body**: `FormData` (multipart/form-data)  
**Response**: `Evidence`

### `GET /api/evidence/[id]`
**Назначение**: Получить доказательство по ID  
**Auth**: Required  
**Response**: `Evidence`

### `PATCH /api/evidence/[id]`
**Назначение**: Обновить доказательство  
**Auth**: Required  
**Body**: `UpdateEvidenceDTO`  
**Response**: `Evidence`

### `DELETE /api/evidence/[id]`
**Назначение**: Удалить доказательство  
**Auth**: Required  
**Response**: `{ success: boolean }`

### `POST /api/evidence/bulk-approve`
**Назначение**: Массовое одобрение доказательств  
**Auth**: Required (reviewer)  
**Body**: `{ ids: string[] }`  
**Response**: `{ approved: number }`

### `POST /api/evidence/bulk-delete`
**Назначение**: Массовое удаление доказательств  
**Auth**: Required  
**Body**: `{ ids: string[] }`  
**Response**: `{ deleted: number }`

## 🛡️ Меры защиты (Controls)

### `GET /api/controls`
**Назначение**: Получить список мер защиты  
**Auth**: Required  
**Query Params**:
- `type?: string`
- `frequency?: string`
- `requirementId?: string`
- `organizationId?: string`
- `search?: string`
- `page?: number`
- `limit?: number`

**Response**: `{ data: Control[], total: number, page: number, limit: number }`

### `POST /api/controls`
**Назначение**: Создать новую меру защиты  
**Auth**: Required  
**Body**: `CreateControlDTO`  
**Response**: `Control`

### `GET /api/controls/[id]`
**Назначение**: Получить меру защиты по ID  
**Auth**: Required  
**Response**: `Control`

### `PATCH /api/controls/[id]`
**Назначение**: Обновить меру защиты  
**Auth**: Required  
**Body**: `UpdateControlDTO`  
**Response**: `Control`

### `DELETE /api/controls/[id]`
**Назначение**: Удалить меру защиты  
**Auth**: Required  
**Response**: `{ success: boolean }`

### `GET /api/controls/[id]/requirements`
**Назначение**: Получить требования, связанные с мерой  
**Auth**: Required  
**Response**: `Requirement[]`

### `GET /api/controls/[id]/evidence`
**Назначение**: Получить доказательства для меры  
**Auth**: Required  
**Response**: `Evidence[]`

### `GET /api/control-evidence`
**Назначение**: Получить связи мер с доказательствами  
**Auth**: Required  
**Query Params**: `controlId?: string`, `evidenceId?: string`  
**Response**: `ControlEvidence[]`

## 📋 Типовые шаблоны мер

### `GET /api/control-templates`
**Назначение**: Получить список типовых шаблонов  
**Auth**: Required  
**Query Params**:
- `frameworkId?: string`
- `type?: string`
- `search?: string`
- `page?: number`
- `limit?: number`

**Response**: `{ data: ControlTemplate[], total: number, page: number, limit: number }`

### `POST /api/control-templates`
**Назначение**: Создать новый типовой шаблон  
**Auth**: Required (admin)  
**Body**: `CreateControlTemplateDTO`  
**Response**: `ControlTemplate`

### `GET /api/control-templates/[id]`
**Назначение**: Получить типовой шаблон по ID  
**Auth**: Required  
**Response**: `ControlTemplate`

### `PATCH /api/control-templates/[id]`
**Назначение**: Обновить типовой шаблон  
**Auth**: Required (admin)  
**Body**: `UpdateControlTemplateDTO`  
**Response**: `ControlTemplate`

### `DELETE /api/control-templates/[id]`
**Назначение**: Удалить типовой шаблон  
**Auth**: Required (admin)  
**Response**: `{ success: boolean }`

### `POST /api/control-templates/[id]/apply`
**Назначение**: Применить типовой шаблон к требованию  
**Auth**: Required  
**Body**: `{ requirementId: string, organizationId?: string }`  
**Response**: `Control`

### `POST /api/control-templates/bulk-apply`
**Назначение**: Массовое применение типовых шаблонов  
**Auth**: Required  
**Body**: `{ templateIds: string[], requirementIds: string[], organizationId?: string }`  
**Response**: `{ created: number }`

## 👥 Пользователи

### `GET /api/users`
**Назначение**: Получить список пользователей  
**Auth**: Required (admin)  
**Query Params**:
- `role?: string`
- `organizationId?: string`
- `isActive?: boolean`
- `search?: string`
- `page?: number`
- `limit?: number`

**Response**: `{ data: User[], total: number, page: number, limit: number }`

### `POST /api/users`
**Назначение**: Создать нового пользователя  
**Auth**: Required (admin)  
**Body**: `CreateUserDTO`  
**Response**: `User`

### `GET /api/users/[id]`
**Назначение**: Получить пользователя по ID  
**Auth**: Required  
**Response**: `User`

### `PATCH /api/users/[id]`
**Назначение**: Обновить пользователя  
**Auth**: Required (admin or self)  
**Body**: `UpdateUserDTO`  
**Response**: `User`

### `DELETE /api/users/[id]`
**Назначение**: Удалить пользователя  
**Auth**: Required (admin)  
**Response**: `{ success: boolean }`

### `GET /api/users/profile`
**Назначение**: Получить профиль текущего пользователя  
**Auth**: Required  
**Response**: `User`

### `PATCH /api/users/profile`
**Назначение**: Обновить профиль текущего пользователя  
**Auth**: Required  
**Body**: `UpdateProfileDTO`  
**Response**: `User`

### `POST /api/users/change-password`
**Назначение**: Сменить пароль  
**Auth**: Required  
**Body**: `{ currentPassword: string, newPassword: string }`  
**Response**: `{ success: boolean }`

### `GET /api/users/notification-settings`
**Назначение**: Получить настройки уведомлений  
**Auth**: Required  
**Response**: `NotificationSettings`

### `PATCH /api/users/notification-settings`
**Назначение**: Обновить настройки уведомлений  
**Auth**: Required  
**Body**: `UpdateNotificationSettingsDTO`  
**Response**: `NotificationSettings`

## 🔔 Уведомления

### `GET /api/notifications`
**Назначение**: Получить список уведомлений  
**Auth**: Required  
**Query Params**:
- `isRead?: boolean`
- `type?: string`
- `page?: number`
- `limit?: number`

**Response**: `{ data: Notification[], total: number, unreadCount: number }`

### `GET /api/notifications/[id]`
**Назначение**: Получить уведомление по ID  
**Auth**: Required  
**Response**: `Notification`

### `POST /api/notifications/[id]/read`
**Назначение**: Отметить уведомление как прочитанное  
**Auth**: Required  
**Response**: `{ success: boolean }`

### `DELETE /api/notifications/[id]`
**Назначение**: Удалить уведомление  
**Auth**: Required  
**Response**: `{ success: boolean }`

### `POST /api/notifications/mark-all-read`
**Назначение**: Отметить все уведомления как прочитанные  
**Auth**: Required  
**Response**: `{ updated: number }`

### `POST /api/notifications/check-actuality`
**Назначение**: Проверить актуальность документов и отправить уведомления  
**Auth**: Required (cron)  
**Headers**: `x-cron-secret: CRON_SECRET`  
**Response**: `{ checked: number, notifications: number }`

## 🏛️ Администрирование

### Тенанты

#### `GET /api/admin/tenants`
**Назначение**: Получить список тенантов  
**Auth**: Required (super_admin)  
**Response**: `Tenant[]`

#### `POST /api/admin/tenants`
**Назначение**: Создать новый тенант  
**Auth**: Required (super_admin)  
**Body**: `CreateTenantDTO`  
**Response**: `Tenant`

#### `GET /api/admin/tenants/[id]`
**Назначение**: Получить тенант по ID  
**Auth**: Required (super_admin)  
**Response**: `Tenant`

#### `PATCH /api/admin/tenants/[id]`
**Назначение**: Обновить тенант  
**Auth**: Required (super_admin)  
**Body**: `UpdateTenantDTO`  
**Response**: `Tenant`

#### `DELETE /api/admin/tenants/[id]`
**Назначение**: Удалить тенант  
**Auth**: Required (super_admin)  
**Response**: `{ success: boolean }`

#### `GET /api/admin/tenants/[id]/stats`
**Назначение**: Получить статистику тенанта  
**Auth**: Required (super_admin)  
**Response**: `TenantStats`

#### `POST /api/admin/tenants/[id]/switch`
**Назначение**: Переключиться на тенант  
**Auth**: Required (super_admin)  
**Response**: `{ success: boolean }`

#### `GET /api/admin/tenants/[id]/users`
**Назначение**: Получить пользователей тенанта  
**Auth**: Required (super_admin)  
**Response**: `User[]`

#### `POST /api/admin/tenants/[id]/users`
**Назначение**: Добавить пользователя в тенант  
**Auth**: Required (super_admin)  
**Body**: `{ userId: string }`  
**Response**: `{ success: boolean }`

#### `DELETE /api/admin/tenants/[id]/users/[userId]`
**Назначение**: Удалить пользователя из тенанта  
**Auth**: Required (super_admin)  
**Response**: `{ success: boolean }`

### Тенант (текущий)

#### `GET /api/tenant/current`
**Назначение**: Получить текущий тенант  
**Auth**: Required  
**Response**: `Tenant`

#### `GET /api/tenant/list`
**Назначение**: Получить список доступных тенантов  
**Auth**: Required  
**Response**: `Tenant[]`

#### `POST /api/tenant/switch`
**Назначение**: Переключиться на другой тенант  
**Auth**: Required  
**Body**: `{ tenantId: string }`  
**Response**: `{ success: boolean }`

## 📚 Справочники

### `GET /api/dictionaries/categories`
**Назначение**: Получить категории требований  
**Auth**: Required  
**Response**: `Category[]`

### `GET /api/dictionaries/periodicities`
**Назначение**: Получить периодичности  
**Auth**: Required  
**Response**: `Periodicity[]`

### `GET /api/dictionaries/regulators`
**Назначение**: Получить регуляторов  
**Auth**: Required  
**Response**: `Regulator[]`

### `GET /api/dictionaries/responsible-roles`
**Назначение**: Получить ответственные роли  
**Auth**: Required  
**Response**: `ResponsibleRole[]`

### `GET /api/dictionaries/verification-methods`
**Назначение**: Получить методы верификации  
**Auth**: Required  
**Response**: `VerificationMethod[]`

### `GET /api/dictionaries/regulatory-frameworks`
**Назначение**: Получить нормативные базы  
**Auth**: Required  
**Response**: `RegulatoryFramework[]`

### `POST /api/dictionaries/regulatory-frameworks`
**Назначение**: Создать нормативную базу  
**Auth**: Required (admin)  
**Body**: `CreateRegulatoryFrameworkDTO`  
**Response**: `RegulatoryFramework`

### `GET /api/dictionaries/regulatory-frameworks/[id]`
**Назначение**: Получить нормативную базу по ID  
**Auth**: Required  
**Response**: `RegulatoryFramework`

### `PATCH /api/dictionaries/regulatory-frameworks/[id]`
**Назначение**: Обновить нормативную базу  
**Auth**: Required (admin)  
**Body**: `UpdateRegulatoryFrameworkDTO`  
**Response**: `RegulatoryFramework`

### `DELETE /api/dictionaries/regulatory-frameworks/[id]`
**Назначение**: Удалить нормативную базу  
**Auth**: Required (admin)  
**Response**: `{ success: boolean }`

### `GET /api/dictionaries/organization-types`
**Назначение**: Получить типы организаций  
**Auth**: Required  
**Response**: `OrganizationType[]`

### `POST /api/dictionaries/organization-types`
**Назначение**: Создать тип организации  
**Auth**: Required (admin)  
**Body**: `CreateOrganizationTypeDTO`  
**Response**: `OrganizationType`

### `GET /api/dictionaries/organization-types/[id]`
**Назначение**: Получить тип организации по ID  
**Auth**: Required  
**Response**: `OrganizationType`

### `PATCH /api/dictionaries/organization-types/[id]`
**Назначение**: Обновить тип организации  
**Auth**: Required (admin)  
**Body**: `UpdateOrganizationTypeDTO`  
**Response**: `OrganizationType`

### `DELETE /api/dictionaries/organization-types/[id]`
**Назначение**: Удалить тип организации  
**Auth**: Required (admin)  
**Response**: `{ success: boolean }`

## 📊 Отчеты

### `GET /api/reports/compliance-summary`
**Назначение**: Получить сводный отчет по комплаенсу  
**Auth**: Required  
**Query Params**: `organizationId?: string`, `startDate?: string`, `endDate?: string`  
**Response**: `ComplianceSummaryReport`

### `GET /api/reports/executive-summary`
**Назначение**: Получить executive summary  
**Auth**: Required (admin)  
**Query Params**: `tenantId?: string`  
**Response**: `ExecutiveSummaryReport`

### `GET /api/reports/organization-compliance`
**Назначение**: Получить отчет по комплаенсу организации  
**Auth**: Required  
**Query Params**: `organizationId: string`  
**Response**: `OrganizationComplianceReport`

### `GET /api/reports/readiness`
**Назначение**: Получить отчет о готовности  
**Auth**: Required  
**Query Params**: `organizationId?: string`, `frameworkId?: string`  
**Response**: `ReadinessReport`

## 🔍 Поиск

### `GET /api/search`
**Назначение**: Глобальный поиск по всей системе  
**Auth**: Required  
**Query Params**: `q: string`, `types?: string[]`, `limit?: number`  
**Response**: `{ results: SearchResult[], total: number }`

## 🔐 RBAC

### `GET /api/rbac/roles`
**Назначение**: Получить список ролей  
**Auth**: Required (admin)  
**Response**: `Role[]`

### `POST /api/rbac/roles`
**Назначение**: Создать новую роль  
**Auth**: Required (admin)  
**Body**: `CreateRoleDTO`  
**Response**: `Role`

### `GET /api/rbac/roles/[id]/permissions`
**Назначение**: Получить права роли  
**Auth**: Required (admin)  
**Response**: `Permission[]`

### `POST /api/rbac/roles/[id]/permissions`
**Назначение**: Обновить права роли  
**Auth**: Required (admin)  
**Body**: `{ permissions: Permission[] }`  
**Response**: `{ success: boolean }`

### `GET /api/rbac/resources`
**Назначение**: Получить список ресурсов  
**Auth**: Required (admin)  
**Response**: `Resource[]`

### `GET /api/rbac/actions`
**Назначение**: Получить список действий  
**Auth**: Required (admin)  
**Response**: `Action[]`

## 📖 База знаний

### `GET /api/knowledge-base/articles`
**Назначение**: Получить статьи базы знаний  
**Auth**: Required  
**Query Params**: `category?: string`, `search?: string`  
**Response**: `Article[]`

### `GET /api/knowledge-base/articles/[slug]`
**Назначение**: Получить статью по slug  
**Auth**: Required  
**Response**: `Article`

### `GET /api/knowledge-base/templates`
**Назначение**: Получить шаблоны документов  
**Auth**: Required  
**Response**: `Template[]`

## 📜 Статьи законов

### `GET /api/legal-articles`
**Назначение**: Получить статьи законов  
**Auth**: Required  
**Query Params**: `lawId?: string`, `search?: string`  
**Response**: `LegalArticle[]`

### `POST /api/legal-articles`
**Назначение**: Создать статью закона  
**Auth**: Required (admin)  
**Body**: `CreateLegalArticleDTO`  
**Response**: `LegalArticle`

### `GET /api/legal-articles/[id]`
**Назначение**: Получить статью закона по ID  
**Auth**: Required  
**Response**: `LegalArticle`

### `PATCH /api/legal-articles/[id]`
**Назначение**: Обновить статью закона  
**Auth**: Required (admin)  
**Body**: `UpdateLegalArticleDTO`  
**Response**: `LegalArticle`

### `DELETE /api/legal-articles/[id]`
**Назначение**: Удалить статью закона  
**Auth**: Required (admin)  
**Response**: `{ success: boolean }`

## 🎯 Риски

### `GET /api/risks`
**Назначение**: Получить список рисков  
**Auth**: Required  
**Query Params**: `organizationId?: string`, `severity?: string`  
**Response**: `Risk[]`

### `POST /api/risks`
**Назначение**: Создать новый риск  
**Auth**: Required  
**Body**: `CreateRiskDTO`  
**Response**: `Risk`

## 🔧 Утилиты

### `GET /api/llm/providers`
**Назначение**: Получить список LLM провайдеров  
**Auth**: Required (admin)  
**Response**: `LLMProvider[]`

### `GET /api/diff/providers`
**Назначение**: Получить список diff провайдеров  
**Auth**: Required (admin)  
**Response**: `DiffProvider[]`

### `GET /api/regulatory-documents`
**Назначение**: Получить нормативные документы  
**Auth**: Required  
**Response**: `RegulatoryDocument[]`

## 🔍 Как найти нужный API?

### По сущности
- **Комплаенс** → `/api/compliance/*`
- **Требования** → `/api/requirements/*`
- **Организации** → `/api/organizations/*`
- **Документы** → `/api/documents/*`
- **Доказательства** → `/api/evidence/*`
- **Меры защиты** → `/api/controls/*`
- **Пользователи** → `/api/users/*`
- **Админ** → `/api/admin/*`

### По операции
- **Список** → `GET /api/*/`
- **Создание** → `POST /api/*/`
- **Получение** → `GET /api/*/[id]`
- **Обновление** → `PATCH /api/*/[id]`
- **Удаление** → `DELETE /api/*/[id]`
- **Массовые операции** → `POST /api/*/bulk-*`

### По функционалу
- **Фильтрация** → Query params в GET запросах
- **Пагинация** → `page` и `limit` query params
- **Поиск** → `search` query param
- **Связи** → `/api/*/[id]/related-entity`
