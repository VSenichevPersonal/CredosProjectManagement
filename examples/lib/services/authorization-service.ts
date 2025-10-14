/**
 * @intent: Authorization Service - проверка прав доступа
 * @architecture: Провайдерный паттерн для гибкой RBAC системы
 */

import type { DatabaseProvider } from "@/providers/database-provider"

export interface Permission {
  id: string
  code: string // requirements:read, controls:write
  name: string
  resourceCode: string
  actionCode: string
}

export interface Role {
  id: string
  code: string
  name: string
  description: string
  isSystem: boolean
  permissions: Permission[]
}

export interface AuthorizationService {
  /**
   * Проверить, есть ли у пользователя право
   * @example can(userId, 'requirements', 'read')
   */
  can(userId: string, resource: string, action: string): Promise<boolean>

  /**
   * Проверить, есть ли у пользователя любое из прав
   * @example canAny(userId, [['requirements', 'read'], ['requirements', 'write']])
   */
  canAny(userId: string, permissions: Array<[string, string]>): Promise<boolean>

  /**
   * Проверить, есть ли у пользователя все права
   * @example canAll(userId, [['requirements', 'read'], ['requirements', 'write']])
   */
  canAll(userId: string, permissions: Array<[string, string]>): Promise<boolean>

  /**
   * Получить все права пользователя
   */
  getUserPermissions(userId: string): Promise<Permission[]>

  /**
   * Получить роль пользователя с правами
   */
  getUserRole(userId: string): Promise<Role | null>

  /**
   * Получить все доступные роли
   */
  getAllRoles(): Promise<Role[]>

  /**
   * Назначить роль пользователю
   */
  assignRole(userId: string, roleId: string): Promise<void>

  /**
   * Создать новую роль (только для super_admin)
   */
  createRole(data: {
    code: string
    name: string
    description: string
    permissionIds: string[]
  }): Promise<Role>

  /**
   * Обновить права роли (только для super_admin)
   */
  updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void>
}

export class AuthorizationServiceImpl implements AuthorizationService {
  // Кеш прав пользователей (в памяти, можно заменить на Redis)
  private permissionsCache = new Map<string, { permissions: Permission[]; expiresAt: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 минут

  constructor(private db: DatabaseProvider) {}

  async can(userId: string, resource: string, action: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId)
    const permissionCode = `${resource}:${action}`
    return permissions.some((p) => p.code === permissionCode)
  }

  async canAny(userId: string, permissions: Array<[string, string]>): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    const permissionCodes = permissions.map(([resource, action]) => `${resource}:${action}`)
    return userPermissions.some((p) => permissionCodes.includes(p.code))
  }

  async canAll(userId: string, permissions: Array<[string, string]>): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    const permissionCodes = permissions.map(([resource, action]) => `${resource}:${action}`)
    return permissionCodes.every((code) => userPermissions.some((p) => p.code === code))
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    // Проверяем кеш
    const cached = this.permissionsCache.get(userId)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions
    }

    // Загружаем из БД
    const permissions = await this.db.getUserPermissions(userId)

    // Сохраняем в кеш
    this.permissionsCache.set(userId, {
      permissions,
      expiresAt: Date.now() + this.CACHE_TTL,
    })

    return permissions
  }

  async getUserRole(userId: string): Promise<Role | null> {
    return this.db.getUserRole(userId)
  }

  async getAllRoles(): Promise<Role[]> {
    return this.db.getAllRoles()
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.db.assignUserRole(userId, roleId)
    // Очищаем кеш прав пользователя
    this.permissionsCache.delete(userId)
  }

  async createRole(data: {
    code: string
    name: string
    description: string
    permissionIds: string[]
  }): Promise<Role> {
    return this.db.createRole(data)
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await this.db.updateRolePermissions(roleId, permissionIds)
    // Очищаем весь кеш (так как роль могла измениться у многих пользователей)
    this.permissionsCache.clear()
  }

  /**
   * Очистить кеш прав пользователя
   */
  clearUserCache(userId: string): void {
    this.permissionsCache.delete(userId)
  }

  /**
   * Очистить весь кеш
   */
  clearCache(): void {
    this.permissionsCache.clear()
  }
}
