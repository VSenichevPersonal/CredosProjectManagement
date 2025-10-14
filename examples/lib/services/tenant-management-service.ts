/**
 * Tenant Management Service
 *
 * Domain service for tenant management operations.
 * Implements business logic following DDD principles.
 *
 * Responsibilities:
 * - Tenant CRUD operations
 * - Tenant user management
 * - Tenant statistics calculation
 * - Audit logging
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  Tenant,
  TenantWithRelations,
  TenantStats,
  TenantUser,
  TenantAuditEntry,
  CreateTenantDto,
  UpdateTenantDto,
  AddTenantUserDto,
  UpdateTenantUserDto,
  TenantAuditAction,
} from "@/types/domain/tenant"

export class TenantManagementService {
  constructor(private supabase: SupabaseClient) {}

  // ============================================================================
  // TENANT CRUD
  // ============================================================================

  /**
   * Get all tenants (super_admin only)
   */
  async getAllTenants(): Promise<Tenant[]> {
    const { data, error } = await this.supabase
      .from("tenants")
      .select(
        `
        *,
        root_organization:organizations!tenants_root_organization_id_fkey(id, name)
      `,
      )
      .order("created_at", { ascending: false })

    if (error) throw error

    return (data || []).map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      status: t.is_active ? "active" : "inactive",
      settings: t.settings,
      isActive: t.is_active,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      rootOrganizationId: t.root_organization_id,
      rootOrganizationName: t.root_organization?.name,
    }))
  }

  /**
   * Get tenant by ID with optional relations
   */
  async getTenantById(
    tenantId: string,
    options?: {
      includeStats?: boolean
      includeUsers?: boolean
      includeAuditLog?: boolean
    },
  ): Promise<TenantWithRelations | null> {
    const { data, error } = await this.supabase
      .from("tenants")
      .select(
        `
        *,
        root_organization:organizations!tenants_root_organization_id_fkey(id, name, inn, ogrn)
      `,
      )
      .eq("id", tenantId)
      .single()

    if (error || !data) return null

    const tenant: TenantWithRelations = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      status: data.is_active ? "active" : "inactive",
      settings: data.settings,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      rootOrganizationId: data.root_organization_id,
      rootOrganizationName: data.root_organization?.name,
      rootOrganization: data.root_organization,
    }

    // Load relations if requested
    if (options?.includeStats) {
      tenant.stats = await this.getTenantStats(tenantId)
    }

    if (options?.includeUsers) {
      tenant.users = await this.getTenantUsers(tenantId)
    }

    if (options?.includeAuditLog) {
      tenant.auditLog = await this.getTenantAuditLog(tenantId, 50)
    }

    return tenant
  }

  /**
   * Create new tenant
   * Root organization is automatically created by database trigger
   */
  async createTenant(dto: CreateTenantDto, createdBy: string): Promise<Tenant> {
    const { data, error } = await this.supabase
      .from("tenants")
      .insert({
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        settings: dto.settings || {},
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    const tenant: Tenant = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      status: "active",
      settings: data.settings,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      rootOrganizationId: data.id,
    }

    // Log audit entry
    await this.logAudit(tenant.id, "created", createdBy, {
      name: dto.name,
      slug: dto.slug,
      rootOrganizationId: tenant.id,
    })

    return tenant
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, dto: UpdateTenantDto, updatedBy: string): Promise<Tenant> {
    const updates: any = {}

    if (dto.name !== undefined) updates.name = dto.name
    if (dto.slug !== undefined) updates.slug = dto.slug
    if (dto.description !== undefined) updates.description = dto.description
    if (dto.status !== undefined) updates.is_active = dto.status === "active"
    if (dto.settings !== undefined) updates.settings = dto.settings

    const { data, error } = await this.supabase.from("tenants").update(updates).eq("id", tenantId).select().single()

    if (error) throw error

    // Log audit entry
    await this.logAudit(tenantId, "updated", updatedBy, dto)

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      status: data.is_active ? "active" : "inactive",
      settings: data.settings,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      rootOrganizationId: data.id,
    }
  }

  // ============================================================================
  // TENANT USERS
  // ============================================================================

  /**
   * Get all users of a tenant
   */
  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return (data || []).map((u) => ({
      id: u.id,
      userId: u.id,
      tenantId: u.tenant_id,
      role: u.role || "user",
      isActive: u.is_active,
      joinedAt: u.created_at,
      lastAccessAt: u.updated_at,
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
      },
    }))
  }

  /**
   * Add user to tenant
   */
  async addUserToTenant(tenantId: string, dto: AddTenantUserDto, addedBy: string): Promise<TenantUser> {
    const { data, error } = await this.supabase
      .from("users")
      .update({
        tenant_id: tenantId,
        role: dto.role,
      })
      .eq("id", dto.userId)
      .select()
      .single()

    if (error) throw error

    // Log audit entry
    await this.logAudit(tenantId, "user_added", addedBy, {
      userId: dto.userId,
      role: dto.role,
    })

    return {
      id: data.id,
      userId: data.id,
      tenantId: data.tenant_id,
      role: data.role,
      isActive: data.is_active,
      joinedAt: data.created_at,
      lastAccessAt: data.updated_at,
    }
  }

  /**
   * Remove user from tenant
   */
  async removeUserFromTenant(tenantId: string, userId: string, removedBy: string): Promise<void> {
    const { error } = await this.supabase
      .from("users")
      .update({ tenant_id: null })
      .eq("id", userId)
      .eq("tenant_id", tenantId)

    if (error) throw error

    // Log audit entry
    await this.logAudit(tenantId, "user_removed", removedBy, { userId })
  }

  /**
   * Update tenant user
   */
  async updateTenantUser(
    tenantId: string,
    userId: string,
    dto: UpdateTenantUserDto,
    updatedBy: string,
  ): Promise<TenantUser> {
    const updates: any = {}

    if (dto.role !== undefined) updates.role = dto.role
    if (dto.isActive !== undefined) updates.is_active = dto.isActive

    const { data, error } = await this.supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .eq("tenant_id", tenantId)
      .select()
      .single()

    if (error) throw error

    // Log audit entry
    await this.logAudit(tenantId, "user_role_changed", updatedBy, dto)

    return {
      id: data.id,
      userId: data.id,
      tenantId: data.tenant_id,
      role: data.role,
      isActive: data.is_active,
      joinedAt: data.created_at,
      lastAccessAt: data.updated_at,
    }
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Calculate tenant statistics
   */
  async getTenantStats(tenantId: string): Promise<TenantStats> {
    // Run all queries in parallel
    const [users, orgs, reqs, controls, evidence, compliance] = await Promise.all([
      this.supabase.from("users").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      this.supabase.from("organizations").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      this.supabase.from("requirements").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      this.supabase.from("controls").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      this.supabase.from("evidence").select("file_size").eq("tenant_id", tenantId),
      this.supabase.from("compliance_records").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    ])

    const storageUsedMB = (evidence.data?.reduce((sum, e) => sum + (e.file_size || 0), 0) || 0) / 1024 / 1024

    const { data: lastActivity } = await this.supabase
      .from("users")
      .select("updated_at")
      .eq("tenant_id", tenantId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    return {
      userCount: users.count || 0,
      organizationCount: orgs.count || 0,
      requirementCount: reqs.count || 0,
      controlCount: controls.count || 0,
      evidenceCount: evidence.data?.length || 0,
      complianceRecordCount: compliance.count || 0,
      storageUsedMB,
      lastActivityAt: lastActivity?.updated_at,
    }
  }

  // ============================================================================
  // AUDIT LOG
  // ============================================================================

  /**
   * Get tenant audit log
   */
  async getTenantAuditLog(tenantId: string, limit = 100): Promise<TenantAuditEntry[]> {
    const { data, error } = await this.supabase
      .from("audit_log")
      .select(
        `
        *,
        user:users(id, email, name)
      `,
      )
      .eq("tenant_id", tenantId)
      .eq("entity_type", "tenant")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map((entry) => ({
      id: entry.id,
      tenantId: entry.tenant_id,
      action: entry.action as TenantAuditAction,
      performedBy: entry.user_id,
      performedAt: entry.created_at,
      changes: entry.changes,
      user: entry.user,
    }))
  }

  /**
   * Log audit entry
   */
  private async logAudit(
    tenantId: string,
    action: TenantAuditAction,
    userId: string,
    changes?: Record<string, unknown>,
  ): Promise<void> {
    await this.supabase.from("audit_log").insert({
      tenant_id: tenantId,
      entity_type: "tenant",
      entity_id: tenantId,
      action,
      user_id: userId,
      changes: changes || {},
    })
  }
}
