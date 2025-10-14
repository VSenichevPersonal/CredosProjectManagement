/**
 * @intent: Service for managing document types
 * @architecture: DDD service layer with ExecutionContext
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import type { DocumentType } from "@/types/domain/document-type"
import type { CreateDocumentTypeDTO, UpdateDocumentTypeDTO } from "@/types/domain/document-type"
import { Permission } from "@/lib/access-control/permissions"
import { NotFoundError } from "@/lib/utils/errors"

export class DocumentTypeService {
  /**
   * List all document types (global + tenant-specific)
   */
  static async list(ctx: ExecutionContext): Promise<DocumentType[]> {
    ctx.logger.info("[DocumentTypeService] list")
    
    const types = await ctx.db.documentTypes.findMany({
      isActive: true
    })
    
    return types
  }
  
  /**
   * Get document type by ID
   */
  static async getById(ctx: ExecutionContext, id: string): Promise<DocumentType> {
    const type = await ctx.db.documentTypes.findById(id)
    
    if (!type) {
      throw new NotFoundError("Document type not found")
    }
    
    return type
  }
  
  /**
   * Get document type by code
   */
  static async getByCode(ctx: ExecutionContext, code: string): Promise<DocumentType | null> {
    const types = await ctx.db.documentTypes.findMany({ code })
    return types[0] || null
  }
  
  /**
   * Create document type (admin only)
   */
  static async create(ctx: ExecutionContext, data: CreateDocumentTypeDTO): Promise<DocumentType> {
    await ctx.access.require(Permission.ADMIN_WRITE)
    
    const type = await ctx.db.documentTypes.create({
      ...data,
      tenantId: ctx.tenantId
    })
    
    await ctx.audit.log({
      eventType: "document_type_created",
      userId: ctx.user!.id,
      resourceType: "document_type",
      resourceId: type.id,
      changes: data
    })
    
    return type
  }
  
  /**
   * Update document type
   */
  static async update(
    ctx: ExecutionContext, 
    id: string, 
    data: UpdateDocumentTypeDTO
  ): Promise<DocumentType> {
    await ctx.access.require(Permission.ADMIN_WRITE)
    
    const type = await ctx.db.documentTypes.update(id, data)
    
    await ctx.audit.log({
      eventType: "document_type_updated",
      userId: ctx.user!.id,
      resourceType: "document_type",
      resourceId: id,
      changes: data
    })
    
    return type
  }
}

