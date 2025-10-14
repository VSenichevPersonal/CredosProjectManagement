/**
 * Tenant Domain Models
 *
 * Domain-Driven Design models for tenant management.
 * Follows DDD principles with aggregate roots, value objects, and domain services.
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum TenantStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  ARCHIVED = "archived",
}

export enum TenantUserRole {
  OWNER = "owner",
  ADMIN = "admin",
  USER = "user",
  VIEWER = "viewer",
}

// ============================================================================
// VALUE OBJECTS
// ============================================================================

/**
 * Tenant Settings - configuration and feature flags
 */
export interface TenantSettings {
  features?: {
    aiAnalysis?: boolean
    documentVersioning?: boolean
    riskManagement?: boolean
    complianceReporting?: boolean
  }
  providers?: {
    diffProvider?: "libre" | "word" | "aspose"
    llmProvider?: "openai" | "anthropic" | "grok" | "local"
  }
  limits?: {
    maxUsers?: number
    maxOrganizations?: number
    maxDocuments?: number
    storageQuotaMB?: number
  }
  branding?: {
    logoUrl?: string
    primaryColor?: string
    companyName?: string
  }
  notifications?: {
    emailEnabled?: boolean
    slackWebhook?: string
  }
}

/**
 * Tenant Statistics - read-only aggregated data
 */
export interface TenantStats {
  userCount: number
  organizationCount: number
  requirementCount: number
  controlCount: number
  evidenceCount: number
  complianceRecordCount: number
  storageUsedMB: number
  lastActivityAt?: string
}

/**
 * Tenant User - user membership in a tenant
 */
export interface TenantUser {
  id: string
  userId: string
  tenantId: string
  role: TenantUserRole
  isActive: boolean
  joinedAt: string
  lastAccessAt?: string

  // Populated fields
  user?: {
    id: string
    email: string
    name: string
  }
}

// ============================================================================
// AGGREGATE ROOT
// ============================================================================

/**
 * Tenant - Aggregate Root
 *
 * Represents a tenant (vertical) in the multi-tenant system.
 * Contains all business logic for tenant management.
 *
 * Added rootOrganizationId - every tenant has a root organization with same ID
 */
export interface Tenant {
  id: string
  name: string
  slug: string
  description?: string
  status: TenantStatus
  settings: TenantSettings
  createdAt: string
  updatedAt: string

  // Computed fields
  isActive: boolean

  rootOrganizationId?: string
  rootOrganizationName?: string
}

/**
 * Tenant with populated relations
 */
export interface TenantWithRelations extends Tenant {
  stats?: TenantStats
  users?: TenantUser[]
  auditLog?: TenantAuditEntry[]
  rootOrganization?: {
    id: string
    name: string
    inn?: string
    ogrn?: string
  }
}

// ============================================================================
// AUDIT LOG
// ============================================================================

export enum TenantAuditAction {
  CREATED = "created",
  UPDATED = "updated",
  RENAMED = "renamed",
  SETTINGS_CHANGED = "settings_changed",
  ACTIVATED = "activated",
  DEACTIVATED = "deactivated",
  SUSPENDED = "suspended",
  USER_ADDED = "user_added",
  USER_REMOVED = "user_removed",
  USER_ROLE_CHANGED = "user_role_changed",
}

export interface TenantAuditEntry {
  id: string
  tenantId: string
  action: TenantAuditAction
  performedBy: string
  performedAt: string
  changes?: Record<string, unknown>
  metadata?: Record<string, unknown>

  // Populated fields
  user?: {
    id: string
    email: string
    name: string
  }
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

/**
 * Create Tenant DTO
 */
export interface CreateTenantDto {
  name: string
  slug: string
  description?: string
  settings?: TenantSettings
}

/**
 * Update Tenant DTO
 */
export interface UpdateTenantDto {
  name?: string
  slug?: string
  description?: string
  status?: TenantStatus
  settings?: TenantSettings
}

/**
 * Add User to Tenant DTO
 */
export interface AddTenantUserDto {
  userId: string
  role: TenantUserRole
}

/**
 * Update Tenant User DTO
 */
export interface UpdateTenantUserDto {
  role?: TenantUserRole
  isActive?: boolean
}

// ============================================================================
// DOMAIN EVENTS
// ============================================================================

export interface TenantDomainEvent {
  type: string
  tenantId: string
  timestamp: string
  data: Record<string, unknown>
}

export interface TenantCreatedEvent extends TenantDomainEvent {
  type: "tenant.created"
  data: {
    name: string
    slug: string
  }
}

export interface TenantUpdatedEvent extends TenantDomainEvent {
  type: "tenant.updated"
  data: {
    changes: Partial<Tenant>
  }
}

export interface TenantUserAddedEvent extends TenantDomainEvent {
  type: "tenant.user.added"
  data: {
    userId: string
    role: TenantUserRole
  }
}
