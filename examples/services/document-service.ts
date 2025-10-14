/**
 * @intent: Business logic for document management with versioning
 * @llm-note: Pure business logic - uses ExecutionContext for all dependencies
 * @architecture: Service layer - orchestrates providers and enforces business rules
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import type { Document } from "@/types/domain/document"
import type { CreateDocumentDTO, DocumentFiltersDTO } from "@/types/dto/document-dto"
import { Permission } from "@/lib/access-control/permissions"
import { NotFoundError } from "@/lib/utils/errors"

export class DocumentService {
  /**
   * @intent: List documents accessible to current user
   * @precondition: ctx.user is authenticated
   * @postcondition: returns only documents user has access to
   */
  static async list(ctx: ExecutionContext, filters?: DocumentFiltersDTO): Promise<Document[]> {
    ctx.logger.info("[v0] DocumentService.list", { filters })

    // Check permission
    await ctx.access.require(Permission.DOCUMENT_READ)

    const documents = await ctx.db.documents.findMany(filters)

    ctx.logger.info("[v0] Documents fetched", { count: documents.length })
    return documents
  }

  /**
   * @intent: Get document by ID
   * @precondition: ctx.user has read permission
   * @postcondition: returns document or throws NotFoundError
   */
  static async getById(ctx: ExecutionContext, id: string): Promise<Document> {
    ctx.logger.info("[v0] DocumentService.getById", { id })

    // Check permission
    await ctx.access.require(Permission.DOCUMENT_READ)

    const document = await ctx.db.documents.findById(id)

    if (!document) {
      throw new NotFoundError("Document")
    }

    return document
  }

  /**
   * @intent: Create new document with initial version
   * @precondition: user has 'document:create' permission
   * @postcondition: document and initial version created
   * @side-effects: audit log entry created
   */
  static async create(ctx: ExecutionContext, data: CreateDocumentDTO): Promise<Document> {
    ctx.logger.info("[v0] DocumentService.create", { data })

    // Check permission
    await ctx.access.require(Permission.DOCUMENT_CREATE)

    // Create document через провайдер
    const document = await ctx.db.documents.create({
      title: data.title,
      description: data.description,
      file_name: data.fileName,
      file_url: data.fileUrl,
      file_type: data.fileType,
      file_size: data.fileSize,
      storage_path: data.storagePath,
      uploaded_by: ctx.user!.id,
      status: "pending",
      organization_id: data.organizationId
    })

    // Create initial version
    await ctx.db.documentVersions.create({
      documentId: document.id,
      versionNumber: data.versionNumber || "v1.0",
      majorVersion: 1,
      minorVersion: 0,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      fileSize: data.fileSize,
      storagePath: data.storagePath,
      changeSummary: data.changeSummary || "Initial version",
      createdBy: ctx.user!.id,
      isCurrent: true,
    })

    // Calculate expiration if validity period is set
    if (data.validityPeriodDays) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + data.validityPeriodDays)

      await ctx.db.documents.update(document.id, {
        validityPeriodDays: data.validityPeriodDays,
        expiresAt,
      })
    }

    // Audit log
    await ctx.audit.log({
      eventType: "document_created",
      userId: ctx.user!.id,
      resourceType: "document",
      resourceId: document.id,
      changes: data,
    })

    ctx.logger.info("[v0] Document created", { documentId: document.id })
    return await DocumentService.getById(ctx, document.id)
  }

  /**
   * @intent: Update document metadata
   * @precondition: user has update permission
   * @postcondition: document updated
   * @side-effects: audit log entry created
   */
  static async update(ctx: ExecutionContext, id: string, data: Partial<CreateDocumentDTO>): Promise<Document> {
    ctx.logger.info("[v0] DocumentService.update", { id, data })

    // Check permission
    await ctx.access.require(Permission.DOCUMENT_UPDATE)

    const existing = await ctx.db.documents.findById(id)
    if (!existing) {
      throw new NotFoundError("Document")
    }

    const document = await ctx.db.documents.update(id, data)

    // Audit log
    await ctx.audit.log({
      eventType: "document_updated",
      userId: ctx.user!.id,
      resourceType: "document",
      resourceId: id,
      changes: data,
    })

    ctx.logger.info("[v0] Document updated", { documentId: id })
    return document
  }

  /**
   * @intent: Delete document
   * @precondition: user has delete permission
   * @postcondition: document deleted
   * @side-effects: audit log entry created, versions deleted
   */
  static async delete(ctx: ExecutionContext, id: string): Promise<void> {
    ctx.logger.info("[v0] DocumentService.delete", { id })

    // Check permission
    await ctx.access.require(Permission.DOCUMENT_DELETE)

    const existing = await ctx.db.documents.findById(id)
    if (!existing) {
      throw new NotFoundError("Document")
    }

    await ctx.db.documents.delete(id)

    // Audit log
    await ctx.audit.log({
      eventType: "document_deleted",
      userId: ctx.user!.id,
      resourceType: "document",
      resourceId: id,
    })

    ctx.logger.info("[v0] Document deleted", { documentId: id })
  }

  /**
   * @intent: Get documents expiring within specified days
   * @precondition: user has read permission
   * @postcondition: returns expiring documents
   */
  static async getExpiring(ctx: ExecutionContext, withinDays = 30): Promise<Document[]> {
    ctx.logger.info("[v0] DocumentService.getExpiring", { withinDays })

    // Check permission
    await ctx.access.require(Permission.DOCUMENT_READ)

    const documents = await ctx.db.documents.findExpiring(withinDays)

    ctx.logger.info("[v0] Expiring documents fetched", { count: documents.length })
    return documents
  }
}
