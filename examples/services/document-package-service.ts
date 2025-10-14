/**
 * @intent: Business logic for document packages management
 * @llm-note: Pure business logic - uses ExecutionContext for all dependencies
 * @architecture: Service layer - manages document generation packages
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import type { DocumentPackage } from "@/types/domain/document-package"
import { Permission } from "@/lib/access-control/permissions"
import { NotFoundError } from "@/lib/utils/errors"

export class DocumentPackageService {
  /**
   * @intent: List all available document packages
   * @precondition: ctx.user is authenticated
   * @postcondition: returns only available packages
   */
  static async list(ctx: ExecutionContext): Promise<DocumentPackage[]> {
    ctx.logger.info("[v0] DocumentPackageService.list")

    // Check permission
    await ctx.access.require(Permission.DOCUMENT_READ)

    const { data, error } = await ctx.db.supabase
      .from("document_packages")
      .select("*")
      .eq("is_available", true)
      .eq("is_active", true)
      .order("complexity", { ascending: true })

    if (error) throw error

    ctx.logger.info("[v0] Document packages fetched", { count: data?.length || 0 })
    return (data || []) as DocumentPackage[]
  }

  /**
   * @intent: Get package by ID
   * @precondition: ctx.user has read permission
   * @postcondition: returns package or throws NotFoundError
   */
  static async getById(ctx: ExecutionContext, id: string): Promise<DocumentPackage> {
    ctx.logger.info("[v0] DocumentPackageService.getById", { id })

    // Check permission
    await ctx.access.require(Permission.DOCUMENT_READ)

    const { data, error } = await ctx.db.supabase
      .from("document_packages")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) {
      throw new NotFoundError("Document package")
    }

    return data as DocumentPackage
  }

  /**
   * @intent: Get package by code
   * @precondition: ctx.user has read permission
   * @postcondition: returns package or throws NotFoundError
   */
  static async getByCode(ctx: ExecutionContext, code: string): Promise<DocumentPackage> {
    ctx.logger.info("[v0] DocumentPackageService.getByCode", { code })

    // Check permission
    await ctx.access.require(Permission.DOCUMENT_READ)

    const { data, error } = await ctx.db.supabase
      .from("document_packages")
      .select("*")
      .eq("code", code)
      .single()

    if (error || !data) {
      throw new NotFoundError("Document package")
    }

    return data as DocumentPackage
  }
}

