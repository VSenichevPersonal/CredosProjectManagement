import type { ExecutionContext } from "@/lib/context/types"
import type { LegalArticle, CreateLegalArticleDTO, UpdateLegalArticleDTO } from "@/types/domain/legal-article"
import { Permission } from "@/lib/access-control/permissions"

export class LegalArticleService {
  static async list(ctx: ExecutionContext, regulatoryFrameworkId?: string): Promise<LegalArticle[]> {
    if (!ctx.user) {
      throw new Error("User context is required")
    }

    await ctx.access.require(Permission.REQUIREMENT_READ)

    console.log("[v0] [LegalArticleService] Fetching legal articles", {
      regulatoryFrameworkId,
      tenantId: ctx.user.tenantId,
      userId: ctx.user.id,
    })

    let query = ctx.db.supabase
      .from("legal_articles")
      .select("*")
      .eq("tenant_id", ctx.user!.tenantId)
      .eq("is_active", true)
      .order("article_number", { ascending: true })

    if (regulatoryFrameworkId) {
      query = query.eq("regulatory_framework_id", regulatoryFrameworkId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] [LegalArticleService] Query error", {
        error,
        regulatoryFrameworkId,
        tenantId: ctx.user.tenantId,
      })
      ctx.logger.error("Failed to fetch legal articles", { error })
      throw new Error("Failed to fetch legal articles")
    }

    console.log("[v0] [LegalArticleService] Query result", {
      count: data?.length || 0,
      regulatoryFrameworkId,
      tenantId: ctx.user.tenantId,
    })

    return data.map((row: any) => ({
      id: row.id,
      regulatoryFrameworkId: row.regulatory_framework_id,
      tenantId: row.tenant_id,
      articleNumber: row.article_number,
      part: row.part,
      paragraph: row.paragraph,
      clause: row.clause,
      subclause: row.subclause,
      fullReference: row.full_reference,
      title: row.title,
      content: row.content,
      isActive: row.is_active,
      effectiveFrom: row.effective_from,
      effectiveTo: row.effective_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  }

  static async getById(ctx: ExecutionContext, id: string): Promise<LegalArticle | null> {
    if (!ctx.user) {
      throw new Error("User context is required")
    }

    await ctx.access.require(Permission.REQUIREMENT_READ)

    const { data, error } = await ctx.db.supabase
      .from("legal_articles")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", ctx.user!.tenantId)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      ctx.logger.error("Failed to fetch legal article", { error, id })
      throw new Error("Failed to fetch legal article")
    }

    return {
      id: data.id,
      regulatoryFrameworkId: data.regulatory_framework_id,
      tenantId: data.tenant_id,
      articleNumber: data.article_number,
      part: data.part,
      paragraph: data.paragraph,
      clause: data.clause,
      subclause: data.subclause,
      fullReference: data.full_reference,
      title: data.title,
      content: data.content,
      isActive: data.is_active,
      effectiveFrom: data.effective_from,
      effectiveTo: data.effective_to,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  static async create(ctx: ExecutionContext, dto: CreateLegalArticleDTO): Promise<LegalArticle> {
    if (!ctx.user) {
      throw new Error("User context is required")
    }

    await ctx.access.require(Permission.REQUIREMENT_CREATE)

    const { data, error } = await ctx.db.supabase
      .from("legal_articles")
      .insert({
        regulatory_framework_id: dto.regulatoryFrameworkId,
        tenant_id: ctx.user!.tenantId,
        article_number: dto.articleNumber,
        part: dto.part,
        paragraph: dto.paragraph,
        clause: dto.clause,
        subclause: dto.subclause,
        full_reference: dto.fullReference,
        title: dto.title,
        content: dto.content,
        is_active: dto.isActive ?? true,
        effective_from: dto.effectiveFrom,
        effective_to: dto.effectiveTo,
      })
      .select()
      .single()

    if (error) {
      ctx.logger.error("Failed to create legal article", { error, dto })
      throw new Error("Failed to create legal article")
    }

    await ctx.audit.log({
      eventType: "legal_article_created",
      userId: ctx.user!.id,
      resourceId: data.id,
      resourceType: "legal_article",
      changes: dto,
    })

    return {
      id: data.id,
      regulatoryFrameworkId: data.regulatory_framework_id,
      tenantId: data.tenant_id,
      articleNumber: data.article_number,
      part: data.part,
      paragraph: data.paragraph,
      clause: data.clause,
      subclause: data.subclause,
      fullReference: data.full_reference,
      title: data.title,
      content: data.content,
      isActive: data.is_active,
      effectiveFrom: data.effective_from,
      effectiveTo: data.effective_to,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  static async update(ctx: ExecutionContext, id: string, dto: UpdateLegalArticleDTO): Promise<LegalArticle> {
    if (!ctx.user) {
      throw new Error("User context is required")
    }

    await ctx.access.require(Permission.REQUIREMENT_UPDATE)

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (dto.regulatoryFrameworkId !== undefined) updateData.regulatory_framework_id = dto.regulatoryFrameworkId
    if (dto.articleNumber !== undefined) updateData.article_number = dto.articleNumber
    if (dto.part !== undefined) updateData.part = dto.part
    if (dto.paragraph !== undefined) updateData.paragraph = dto.paragraph
    if (dto.clause !== undefined) updateData.clause = dto.clause
    if (dto.subclause !== undefined) updateData.subclause = dto.subclause
    if (dto.fullReference !== undefined) updateData.full_reference = dto.fullReference
    if (dto.title !== undefined) updateData.title = dto.title
    if (dto.content !== undefined) updateData.content = dto.content
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive
    if (dto.effectiveFrom !== undefined) updateData.effective_from = dto.effectiveFrom
    if (dto.effectiveTo !== undefined) updateData.effective_to = dto.effectiveTo

    const { data, error } = await ctx.db.supabase
      .from("legal_articles")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", ctx.user!.tenantId)
      .select()
      .single()

    if (error) {
      ctx.logger.error("Failed to update legal article", { error, id, dto })
      throw new Error("Failed to update legal article")
    }

    await ctx.audit.log({
      eventType: "legal_article_updated",
      userId: ctx.user!.id,
      resourceId: id,
      resourceType: "legal_article",
      changes: dto,
    })

    return {
      id: data.id,
      regulatoryFrameworkId: data.regulatory_framework_id,
      tenantId: data.tenant_id,
      articleNumber: data.article_number,
      part: data.part,
      paragraph: data.paragraph,
      clause: data.clause,
      subclause: data.subclause,
      fullReference: data.full_reference,
      title: data.title,
      content: data.content,
      isActive: data.is_active,
      effectiveFrom: data.effective_from,
      effectiveTo: data.effective_to,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  static async delete(ctx: ExecutionContext, id: string): Promise<void> {
    if (!ctx.user) {
      throw new Error("User context is required")
    }

    await ctx.access.require(Permission.REQUIREMENT_DELETE)

    const { error } = await ctx.db.supabase
      .from("legal_articles")
      .delete()
      .eq("id", id)
      .eq("tenant_id", ctx.user!.tenantId)

    if (error) {
      ctx.logger.error("Failed to delete legal article", { error, id })
      throw new Error("Failed to delete legal article")
    }

    await ctx.audit.log({
      eventType: "legal_article_deleted",
      userId: ctx.user!.id,
      resourceId: id,
      resourceType: "legal_article",
    })
  }
}
