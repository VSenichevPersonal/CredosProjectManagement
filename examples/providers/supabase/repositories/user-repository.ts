import type { SupabaseClient } from "@supabase/supabase-js"
import type { User } from "@/types/domain/user"
import { UserMapper } from "../mappers/user-mapper"
import { logger } from "@/lib/logger"

export class UserRepository {
  constructor(
    private supabase: SupabaseClient,
    private tenantId: string | undefined,
  ) {
    console.log("[v0] UserRepository constructor", {
      hasSupabase: !!supabase,
      supabaseType: typeof supabase,
      hasFrom: typeof supabase?.from,
      tenantId,
    })

    if (!supabase) {
      throw new Error("[UserRepository] Supabase client is required")
    }
    if (typeof supabase.from !== "function") {
      throw new Error("[UserRepository] Invalid Supabase client - missing 'from' method")
    }
  }

  private withTenantFilter(query: any) {
    if (!this.tenantId) {
      throw new Error("[UserRepository] tenantId is required")
    }
    return query.eq("tenant_id", this.tenantId)
  }

  async getAll(options?: any): Promise<User[]> {
    console.log("[v0] UserRepository.getAll called", {
      hasSupabase: !!this.supabase,
      supabaseType: typeof this.supabase,
      hasFrom: typeof this.supabase?.from,
      tenantId: this.tenantId,
    })

    logger.debug("[UserRepository] getAll", { options })

    let query = this.supabase.from("users").select("*")
    query = this.withTenantFilter(query)

    if (options?.filters?.role) {
      query = query.eq("role", options.filters.role)
    }
    if (options?.filters?.organization_id) {
      query = query.eq("organization_id", options.filters.organization_id)
    }

    const { data, error } = await query.order("email")

    if (error) {
      logger.error("[UserRepository] getAll error", { error })
      throw new Error(error.message)
    }

    logger.debug("[UserRepository] getAll success", { count: data?.length })
    return (data || []).map(UserMapper.fromDb)
  }

  async findById(id: string): Promise<User | null> {
    logger.debug("[UserRepository] findById", { id })

    let query = this.supabase.from("users").select("*").eq("id", id)
    query = this.withTenantFilter(query)

    const { data, error } = await query.single()

    if (error) {
      if (error.code === "PGRST116") {
        logger.debug("[UserRepository] findById not found", { id })
        return null
      }
      logger.error("[UserRepository] findById error", { error })
      throw new Error(error.message)
    }

    logger.debug("[UserRepository] findById success", { id })
    return UserMapper.fromDb(data)
  }

  async findByEmail(email: string): Promise<User | null> {
    logger.debug("[UserRepository] findByEmail", { email })

    let query = this.supabase.from("users").select("*").eq("email", email)
    query = this.withTenantFilter(query)

    const { data, error } = await query.single()

    if (error) {
      if (error.code === "PGRST116") {
        logger.debug("[UserRepository] findByEmail not found", { email })
        return null
      }
      logger.error("[UserRepository] findByEmail error", { error })
      throw new Error(error.message)
    }

    logger.debug("[UserRepository] findByEmail success", { email })
    return UserMapper.fromDb(data)
  }

  async create(data: any): Promise<User> {
    logger.debug("[UserRepository] create", { data })

    const { data: created, error } = await this.supabase
      .from("users")
      .insert({ ...data, tenant_id: data.tenantId || this.tenantId })
      .select()
      .single()

    if (error) {
      logger.error("[UserRepository] create error", { error })
      throw new Error(error.message)
    }

    logger.debug("[UserRepository] create success", { id: created.id })
    return UserMapper.fromDb(created)
  }

  async update(id: string, data: any): Promise<User> {
    logger.debug("[UserRepository] update", { id, data })

    const { data: updated, error } = await this.supabase.from("users").update(data).eq("id", id).select().single()

    if (error) {
      logger.error("[UserRepository] update error", { error })
      throw new Error(error.message)
    }

    logger.debug("[UserRepository] update success", { id })
    return UserMapper.fromDb(updated)
  }
}
