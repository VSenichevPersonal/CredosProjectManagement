import type { SupabaseClient } from "@supabase/supabase-js"
import type { Organization } from "@/types/domain"
import { OrganizationMapper } from "../mappers/organization-mapper"
import { logger } from "@/lib/logger"

export class OrganizationRepository {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string | undefined,
  ) {
    console.log("[v0] OrganizationRepository constructor", {
      hasSupabase: !!supabase,
      supabaseType: typeof supabase,
      hasFrom: typeof supabase?.from,
      tenantId,
    })

    if (!supabase) {
      throw new Error("[OrganizationRepository] Supabase client is required")
    }
    if (typeof supabase.from !== "function") {
      throw new Error("[OrganizationRepository] Invalid Supabase client - missing 'from' method")
    }
  }

  async findMany(): Promise<Organization[]> {
    console.log("[v0] OrganizationRepository.findMany called", {
      hasSupabase: !!this.supabase,
      supabaseType: typeof this.supabase,
      hasFrom: typeof this.supabase?.from,
      tenantId: this.tenantId,
    })

    logger.debug("[OrganizationRepository] findMany", { tenantId: this.tenantId })

    if (!this.tenantId) {
      throw new Error("[OrganizationRepository] tenantId is required")
    }

    const query = this.supabase
      .from("organizations")
      .select(`
        *,
        organization_types (id, code, name, icon),
        organization_attributes (
          kii_category,
          pdn_level,
          is_financial,
          is_healthcare,
          is_government,
          employee_count,
          has_foreign_data,
          updated_at,
          updated_by
        )
      `)
      .eq("tenant_id", this.tenantId)
      .order("level", { ascending: true })
      .order("name", { ascending: true })

    const { data, error } = await query

    if (error) {
      logger.error("[OrganizationRepository] findMany error", { error })
      throw new Error(error.message)
    }

    return (data || []).map(OrganizationMapper.fromDb)
  }

  async findById(id: string): Promise<Organization | null> {
    logger.debug("[OrganizationRepository] findById", { id, tenantId: this.tenantId })

    const { data, error } = await this.supabase
      .from("organizations")
      .select(`
        *,
        organization_types (id, code, name, icon),
        organization_attributes (
          kii_category,
          pdn_level,
          is_financial,
          is_healthcare,
          is_government,
          employee_count,
          has_foreign_data,
          updated_at,
          updated_by
        )
      `)
      .eq("id", id)
      .eq("tenant_id", this.tenantId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        logger.debug("[OrganizationRepository] findById not found", { id })
        return null
      }
      logger.error("[OrganizationRepository] findById error", { error })
      throw new Error(error.message)
    }

    return OrganizationMapper.fromDb(data)
  }

  async findHierarchy(rootId: string): Promise<Organization[]> {
    logger.debug("[OrganizationRepository] findHierarchy", { rootId, tenantId: this.tenantId })

    const { data, error } = await this.supabase.rpc("get_organization_hierarchy", {
      root_id: rootId,
    })

    if (error) {
      logger.error("[OrganizationRepository] findHierarchy error", { error })
      throw new Error(error.message)
    }

    return (data || []).map(OrganizationMapper.fromDb)
  }

  async list(filters?: { typeId?: string; parentId?: string | null; isActive?: boolean }) {
    logger.debug("[OrganizationRepository] list", { filters, tenantId: this.tenantId })

    let query = this.supabase
      .from("organizations")
      .select(`
        *,
        organization_types (*),
        organization_attributes (*)
      `)
      .eq("tenant_id", this.tenantId)
      .order("name")

    if (filters?.typeId) {
      query = query.eq("type_id", filters.typeId)
    }

    if (filters?.parentId !== undefined) {
      if (filters.parentId === null) {
        query = query.is("parent_id", null)
      } else {
        query = query.eq("parent_id", filters.parentId)
      }
    }

    if (filters?.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive)
    }

    const { data, error } = await query

    if (error) {
      logger.error("[OrganizationRepository] list error", { error })
      throw error
    }

    return data.map(OrganizationMapper.fromDb)
  }

  async get(id: string): Promise<Organization | null> {
    logger.debug("[OrganizationRepository] get", { id, tenantId: this.tenantId })

    const { data, error } = await this.supabase
      .from("organizations")
      .select(`
        *,
        organization_types (*),
        organization_attributes (*)
      `)
      .eq("id", id)
      .eq("tenant_id", this.tenantId)
      .single()

    if (error) {
      logger.error("[OrganizationRepository] get error", { error, id })
      throw error
    }

    return OrganizationMapper.fromDb(data)
  }

  async create(data: any): Promise<Organization> {
    logger.debug("[OrganizationRepository] create", { data, tenantId: this.tenantId })

    const { data: created, error } = await this.supabase
      .from("organizations")
      .insert({
        name: data.name,
        short_name: data.shortName,
        type_id: data.typeId,
        parent_id: data.parentId,
        level: data.level,
        inn: data.inn,
        ogrn: data.ogrn,
        address: data.address,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone,
        tenant_id: data.tenantId || this.tenantId,
      })
      .select(`
        *,
        organization_types (id, code, name, icon),
        organization_attributes (
          kii_category,
          pdn_level,
          is_financial,
          is_healthcare,
          is_government,
          employee_count,
          has_foreign_data,
          updated_at,
          updated_by
        )
      `)
      .single()

    if (error) {
      logger.error("[OrganizationRepository] create error", { error })
      throw new Error(error.message)
    }

    return OrganizationMapper.fromDb(created)
  }

  async update(id: string, data: any): Promise<Organization> {
    logger.debug("[OrganizationRepository] update", { id, data, tenantId: this.tenantId })

    const updateData: any = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.typeId !== undefined) updateData.type_id = data.typeId
    if (data.parentId !== undefined) updateData.parent_id = data.parentId
    if (data.level !== undefined) updateData.level = data.level
    if (data.inn !== undefined) updateData.inn = data.inn
    if (data.ogrn !== undefined) updateData.ogrn = data.ogrn
    if (data.address !== undefined) updateData.address = data.address
    if (data.isActive !== undefined) updateData.is_active = data.isActive

    const { data: updated, error } = await this.supabase
      .from("organizations")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", this.tenantId)
      .select(`
        *,
        organization_types (id, code, name, icon),
        organization_attributes (
          kii_category,
          pdn_level,
          is_financial,
          is_healthcare,
          is_government,
          employee_count,
          has_foreign_data,
          updated_at,
          updated_by
        )
      `)
      .single()

    if (error) {
      logger.error("[OrganizationRepository] update error", { error })
      throw new Error(error.message)
    }

    return OrganizationMapper.fromDb(updated)
  }

  async delete(id: string): Promise<void> {
    logger.debug("[OrganizationRepository] delete", { id, tenantId: this.tenantId })

    const { error } = await this.supabase.from("organizations").delete().eq("id", id).eq("tenant_id", this.tenantId)

    if (error) {
      logger.error("[OrganizationRepository] delete error", { error })
      throw new Error(error.message)
    }
  }
}
