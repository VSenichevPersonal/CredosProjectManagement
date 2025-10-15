/**
 * Permissions and Roles Configuration
 * Централизованное определение всех разрешений и ролей в системе
 */

// ============================================================================
// ROLES
// ============================================================================

export type UserRole = 'admin' | 'manager' | 'employee' | 'viewer';

export const ROLES: Record<UserRole, { name: string; description: string }> = {
  admin: {
    name: 'Администратор',
    description: 'Полный доступ ко всем функциям системы',
  },
  manager: {
    name: 'Менеджер',
    description: 'Управление проектами и командой',
  },
  employee: {
    name: 'Сотрудник',
    description: 'Работа с задачами и учёт времени',
  },
  viewer: {
    name: 'Наблюдатель',
    description: 'Только просмотр, без редактирования',
  },
};

// ============================================================================
// PERMISSIONS
// ============================================================================

export type Permission =
  // Directions
  | 'directions:read'
  | 'directions:create'
  | 'directions:update'
  | 'directions:delete'
  // Employees
  | 'employees:read'
  | 'employees:read_all'  // Видеть всех сотрудников
  | 'employees:read_own'  // Только себя
  | 'employees:create'
  | 'employees:update'
  | 'employees:update_own' // Только себя
  | 'employees:delete'
  // Projects
  | 'projects:read'
  | 'projects:read_all'   // Все проекты
  | 'projects:read_own'   // Только свои проекты
  | 'projects:create'
  | 'projects:update'
  | 'projects:update_own' // Только свои проекты
  | 'projects:delete'
  // Tasks
  | 'tasks:read'
  | 'tasks:read_all'      // Все задачи
  | 'tasks:read_own'      // Только свои задачи
  | 'tasks:create'
  | 'tasks:update'
  | 'tasks:update_own'    // Только свои задачи
  | 'tasks:delete'
  // Time Entries
  | 'time_entries:read'
  | 'time_entries:read_all'
  | 'time_entries:read_own'
  | 'time_entries:create'
  | 'time_entries:create_own'
  | 'time_entries:update'
  | 'time_entries:update_own'
  | 'time_entries:delete'
  | 'time_entries:delete_own'
  // Reports
  | 'reports:view'
  | 'reports:view_all'
  | 'reports:view_own'
  | 'reports:export'
  // User Roles
  | 'user_roles:read'
  | 'user_roles:manage';

// ============================================================================
// ROLE PERMISSIONS MAPPING
// ============================================================================

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Администратор: все права
  admin: [
    // Directions
    'directions:read',
    'directions:create',
    'directions:update',
    'directions:delete',
    // Employees
    'employees:read',
    'employees:read_all',
    'employees:create',
    'employees:update',
    'employees:delete',
    // Projects
    'projects:read',
    'projects:read_all',
    'projects:create',
    'projects:update',
    'projects:delete',
    // Tasks
    'tasks:read',
    'tasks:read_all',
    'tasks:create',
    'tasks:update',
    'tasks:delete',
    // Time Entries
    'time_entries:read',
    'time_entries:read_all',
    'time_entries:create',
    'time_entries:update',
    'time_entries:delete',
    // Reports
    'reports:view',
    'reports:view_all',
    'reports:export',
    // User Roles
    'user_roles:read',
    'user_roles:manage',
  ],

  // Менеджер: управление проектами и командой
  manager: [
    // Directions (только чтение)
    'directions:read',
    // Employees (чтение всех)
    'employees:read',
    'employees:read_all',
    // Projects (все права на свои проекты)
    'projects:read',
    'projects:read_all',
    'projects:create',
    'projects:update',
    'projects:update_own',
    // Tasks (все права)
    'tasks:read',
    'tasks:read_all',
    'tasks:create',
    'tasks:update',
    'tasks:delete',
    // Time Entries (чтение всех, редактирование своих)
    'time_entries:read',
    'time_entries:read_all',
    'time_entries:create',
    'time_entries:create_own',
    'time_entries:update_own',
    'time_entries:delete_own',
    // Reports (все отчёты)
    'reports:view',
    'reports:view_all',
    'reports:export',
  ],

  // Сотрудник: работа с задачами и временем
  employee: [
    // Directions (только чтение)
    'directions:read',
    // Employees (только себя)
    'employees:read',
    'employees:read_own',
    'employees:update_own',
    // Projects (только чтение)
    'projects:read',
    'projects:read_own',
    // Tasks (свои задачи)
    'tasks:read',
    'tasks:read_own',
    'tasks:update_own',
    // Time Entries (только свои)
    'time_entries:read',
    'time_entries:read_own',
    'time_entries:create',
    'time_entries:create_own',
    'time_entries:update_own',
    'time_entries:delete_own',
    // Reports (только свои)
    'reports:view',
    'reports:view_own',
  ],

  // Наблюдатель: только чтение
  viewer: [
    // Directions
    'directions:read',
    // Employees (только себя)
    'employees:read',
    'employees:read_own',
    // Projects (чтение)
    'projects:read',
    'projects:read_own',
    // Tasks (чтение)
    'tasks:read',
    'tasks:read_own',
    // Time Entries (только свои)
    'time_entries:read',
    'time_entries:read_own',
    // Reports (только свои)
    'reports:view',
    'reports:view_own',
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Получить все разрешения для ролей
 */
export function getPermissionsForRoles(roles: UserRole[]): Permission[] {
  const permissionsSet = new Set<Permission>();

  for (const role of roles) {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    rolePermissions.forEach((perm) => permissionsSet.add(perm));
  }

  return Array.from(permissionsSet);
}

/**
 * Проверить есть ли разрешение
 */
export function hasPermission(permissions: Permission[], permission: Permission): boolean {
  return permissions.includes(permission);
}

/**
 * Проверить есть ли роль
 */
export function hasRole(roles: UserRole[], role: UserRole): boolean {
  return roles.includes(role);
}

/**
 * Проверить является ли пользователь админом
 */
export function isAdmin(roles: UserRole[]): boolean {
  return hasRole(roles, 'admin');
}

/**
 * Проверить является ли пользователь менеджером
 */
export function isManager(roles: UserRole[]): boolean {
  return hasRole(roles, 'manager') || isAdmin(roles);
}

/**
 * Может ли пользователь видеть данные другого сотрудника
 */
export function canAccessEmployee(
  roles: UserRole[],
  permissions: Permission[],
  currentEmployeeId: string,
  targetEmployeeId: string
): boolean {
  // Админ видит всех
  if (isAdmin(roles)) return true;

  // Менеджер видит всех
  if (hasPermission(permissions, 'employees:read_all')) return true;

  // Себя видит каждый
  if (currentEmployeeId === targetEmployeeId) return true;

  return false;
}

/**
 * Может ли пользователь видеть проект
 */
export function canAccessProject(
  roles: UserRole[],
  permissions: Permission[],
  currentEmployeeId: string,
  project: { managerId?: string; teamMemberIds?: string[] }
): boolean {
  // Админ видит все
  if (isAdmin(roles)) return true;

  // Может видеть все проекты
  if (hasPermission(permissions, 'projects:read_all')) return true;

  // Менеджер проекта
  if (project.managerId === currentEmployeeId) return true;

  // Член команды проекта
  if (project.teamMemberIds?.includes(currentEmployeeId)) return true;

  return false;
}

/**
 * Может ли пользователь редактировать проект
 */
export function canEditProject(
  roles: UserRole[],
  permissions: Permission[],
  currentEmployeeId: string,
  project: { managerId?: string }
): boolean {
  // Админ может всё
  if (isAdmin(roles)) return true;

  // Менеджер проекта может редактировать свой проект
  if (
    hasPermission(permissions, 'projects:update_own') &&
    project.managerId === currentEmployeeId
  ) {
    return true;
  }

  // Может редактировать любые проекты
  if (hasPermission(permissions, 'projects:update')) return true;

  return false;
}

/**
 * Может ли пользователь видеть задачу
 */
export function canAccessTask(
  roles: UserRole[],
  permissions: Permission[],
  currentEmployeeId: string,
  task: { assigneeId?: string; projectManagerId?: string }
): boolean {
  // Админ видит все
  if (isAdmin(roles)) return true;

  // Может видеть все задачи
  if (hasPermission(permissions, 'tasks:read_all')) return true;

  // Исполнитель задачи
  if (task.assigneeId === currentEmployeeId) return true;

  // Менеджер проекта
  if (task.projectManagerId === currentEmployeeId) return true;

  return false;
}

/**
 * Может ли пользователь видеть time entry
 */
export function canAccessTimeEntry(
  roles: UserRole[],
  permissions: Permission[],
  currentEmployeeId: string,
  timeEntry: { employeeId: string }
): boolean {
  // Админ видит все
  if (isAdmin(roles)) return true;

  // Может видеть все записи
  if (hasPermission(permissions, 'time_entries:read_all')) return true;

  // Свои записи
  if (timeEntry.employeeId === currentEmployeeId) return true;

  return false;
}

