/**
 * @intent: Business logic for document generation wizard
 * @llm-note: Manages wizard sessions and orchestrates document generation
 * @architecture: Service layer - coordinates packages, LLM, and document creation
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import type {
  DocumentGenerationSession,
  StartWizardDTO,
  SaveAnswersDTO,
  SelectProviderDTO,
  GeneratedDocument,
} from "@/types/domain/document-package"
import { Permission } from "@/lib/access-control/permissions"
import { NotFoundError, ValidationError } from "@/lib/utils/errors"
import { DocumentPackageService } from "./document-package-service"

export class DocumentGenerationWizardService {
  /**
   * @intent: Start new wizard session
   * @precondition: user has document:create permission
   * @postcondition: session created with status 'draft'
   */
  static async startWizard(
    ctx: ExecutionContext,
    data: StartWizardDTO,
  ): Promise<DocumentGenerationSession> {
    ctx.logger.info("[v0] DocumentGenerationWizardService.startWizard", { data })

    // Check permission
    await ctx.access.require(Permission.DOCUMENT_CREATE)

    // Verify package exists
    const pkg = await DocumentPackageService.getById(ctx, data.packageId)

    if (!pkg.isAvailable) {
      throw new ValidationError("This document package is not available")
    }

    // Create session
    const { data: session, error } = await ctx.db.supabase
      .from("document_generation_sessions")
      .insert({
        tenant_id: ctx.tenantId,
        user_id: ctx.user!.id,
        organization_id: data.organizationId,
        package_id: data.packageId,
        answers: {},
        status: "draft",
        current_step: 1,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Audit log
    await ctx.audit.log({
      eventType: "wizard_started",
      userId: ctx.user!.id,
      resourceType: "document_generation_session",
      resourceId: session.id,
      metadata: { packageId: data.packageId, organizationId: data.organizationId },
    })

    ctx.logger.info("[v0] Wizard session created", { sessionId: session.id })
    return session as DocumentGenerationSession
  }

  /**
   * @intent: Get session by ID
   * @precondition: user owns the session or has admin access
   * @postcondition: returns session or throws NotFoundError
   */
  static async getById(ctx: ExecutionContext, id: string): Promise<DocumentGenerationSession> {
    ctx.logger.info("[v0] DocumentGenerationWizardService.getById", { id })

    const { data, error } = await ctx.db.supabase
      .from("document_generation_sessions")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", ctx.tenantId)
      .single()

    if (error || !data) {
      throw new NotFoundError("Wizard session")
    }

    // Check user access
    if (data.user_id !== ctx.user!.id) {
      // TODO: Check if user has admin permission
      await ctx.access.require(Permission.DOCUMENT_READ)
    }

    return data as DocumentGenerationSession
  }

  /**
   * @intent: Save answers to questionnaire
   * @precondition: session exists and user owns it
   * @postcondition: answers saved, status may change
   */
  static async saveAnswers(
    ctx: ExecutionContext,
    sessionId: string,
    data: SaveAnswersDTO,
  ): Promise<DocumentGenerationSession> {
    ctx.logger.info("[v0] DocumentGenerationWizardService.saveAnswers", { sessionId })

    // Get session
    const session = await this.getById(ctx, sessionId)

    // Update session
    const { data: updated, error } = await ctx.db.supabase
      .from("document_generation_sessions")
      .update({
        answers: data.answers,
        current_step: 2,
        status: "clarifying",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single()

    if (error) throw error

    ctx.logger.info("[v0] Answers saved", { sessionId })
    return updated as DocumentGenerationSession
  }

  /**
   * @intent: Select generation provider
   * @precondition: session has answers
   * @postcondition: provider selected, ready for generation
   */
  static async selectProvider(
    ctx: ExecutionContext,
    sessionId: string,
    data: SelectProviderDTO,
  ): Promise<DocumentGenerationSession> {
    ctx.logger.info("[v0] DocumentGenerationWizardService.selectProvider", { sessionId, providerType: data.providerType })

    // Get session
    const session = await this.getById(ctx, sessionId)

    // Update session
    const { data: updated, error } = await ctx.db.supabase
      .from("document_generation_sessions")
      .update({
        provider_type: data.providerType,
        provider_config: data.providerConfig || {},
        current_step: 4,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single()

    if (error) throw error

    ctx.logger.info("[v0] Provider selected", { sessionId, providerType: data.providerType })
    return updated as DocumentGenerationSession
  }

  /**
   * @intent: Generate documents using selected provider
   * @precondition: provider selected
   * @postcondition: documents generated or error status
   */
  static async generateDocuments(
    ctx: ExecutionContext,
    sessionId: string,
  ): Promise<DocumentGenerationSession> {
    ctx.logger.info("[v0] DocumentGenerationWizardService.generateDocuments", { sessionId })

    // Get session
    const session = await this.getById(ctx, sessionId)

    if (!session.provider_type) {
      throw new ValidationError("Provider not selected")
    }

    // Update status to processing
    await ctx.db.supabase
      .from("document_generation_sessions")
      .update({
        status: "processing",
        current_step: 4,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)

    try {
      // Generate documents based on provider type
      let generatedDocs: GeneratedDocument[]

      if (session.provider_type === "llm" || session.provider_type === "finetuned") {
        // Use LLM provider
        const { DocumentGenerationService } = await import("./document-generation-service")
        generatedDocs = await DocumentGenerationService.generateForSession(ctx, sessionId)
      } else if (session.provider_type === "human") {
        // Create task for human expert
        throw new Error("Human provider not yet implemented")
      } else {
        throw new Error(`Unknown provider type: ${session.provider_type}`)
      }

      // Update session with results
      const { data: updated, error } = await ctx.db.supabase
        .from("document_generation_sessions")
        .update({
          generated_documents: generatedDocs,
          status: "completed",
          current_step: 5,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .select()
        .single()

      if (error) throw error

      // Audit log
      await ctx.audit.log({
        eventType: "documents_generated",
        userId: ctx.user!.id,
        resourceType: "document_generation_session",
        resourceId: sessionId,
        metadata: {
          documentsCount: generatedDocs.length,
          providerType: session.provider_type,
        },
      })

      ctx.logger.info("[v0] Documents generated successfully", {
        sessionId,
        count: generatedDocs.length,
      })
      return updated as DocumentGenerationSession
    } catch (error: any) {
      // Update session with error
      await ctx.db.supabase
        .from("document_generation_sessions")
        .update({
          status: "failed",
          error_message: error.message,
          error_details: { stack: error.stack },
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId)

      ctx.logger.error("[v0] Document generation failed", { sessionId, error: error.message })
      throw error
    }
  }

  /**
   * @intent: Save generated documents to library
   * @precondition: session has generated_documents
   * @postcondition: documents saved as Document + DocumentVersion
   */
  static async saveDocuments(
    ctx: ExecutionContext,
    sessionId: string,
  ): Promise<string[]> {
    ctx.logger.info("[v0] DocumentGenerationWizardService.saveDocuments", { sessionId })

    // Get session
    const session = await this.getById(ctx, sessionId)

    if (!session.generatedDocuments || session.generatedDocuments.length === 0) {
      throw new ValidationError("No documents to save")
    }

    const { DocumentService } = await import("./document-service")
    const documentIds: string[] = []

    // Save each document
    for (const genDoc of session.generatedDocuments) {
      // Create Document
      const document = await DocumentService.create(ctx, {
        title: genDoc.title,
        description: `Сгенерировано автоматически из пакета`,
        organizationId: session.organizationId,
        // TODO: templateId from genDoc.templateId
        fileName: `${genDoc.templateCode}.md`,
        fileUrl: "", // TODO: upload to storage
        fileType: "text/markdown",
        fileSize: genDoc.content.length,
        storagePath: "",
        versionNumber: "v1.0",
        changeSummary: "Автоматически сгенерированный документ",
      })

      // Link session → document
      await ctx.db.supabase.from("session_documents").insert({
        tenant_id: ctx.tenantId,
        session_id: sessionId,
        document_id: document.id,
        template_id: genDoc.templateId,
        template_code: genDoc.templateCode,
        confidence_score: genDoc.confidence,
      })

      documentIds.push(document.id)
    }

    ctx.logger.info("[v0] Documents saved to library", {
      sessionId,
      count: documentIds.length,
    })
    return documentIds
  }
}

