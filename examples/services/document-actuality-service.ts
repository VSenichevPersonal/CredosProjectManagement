/**
 * @intent: Service for managing document actuality and review cycles
 * @architecture: DDD service layer with ExecutionContext
 * @llm-note: Handles automatic status calculation and review workflows
 */

import type { DatabaseProvider } from "@/providers/database-provider"
import type { Document, DocumentStatus } from "@/types/domain/document"
import { AppError } from "@/lib/errors"
import { addDays, differenceInDays } from "date-fns"

export interface ActualityCalculationResult {
  status: DocumentStatus
  daysUntilExpiry?: number
  daysUntilReview?: number
  needsAttention: boolean
  message: string
}

export interface ReviewDocumentParams {
  documentId: string
  userId: string
  reviewNotes?: string
  nextReviewDate?: Date
  validityPeriodDays?: number
}

export class DocumentActualityService {
  constructor(private db: DatabaseProvider) {}

  /**
   * @intent: Calculate actuality status for a document
   * @precondition: document exists
   * @postcondition: status calculated based on dates
   */
  calculateActualityStatus(document: Document): ActualityCalculationResult {
    const now = new Date()
    let status: DocumentStatus = "ok"
    let needsAttention = false
    let message = "Документ актуален"
    let daysUntilExpiry: number | undefined
    let daysUntilReview: number | undefined

    // Check expiration
    if (document.expiresAt) {
      daysUntilExpiry = differenceInDays(document.expiresAt, now)

      if (daysUntilExpiry < 0) {
        status = "expired"
        needsAttention = true
        message = `Документ истек ${Math.abs(daysUntilExpiry)} дн. назад`
      } else if (daysUntilExpiry <= 30) {
        status = "needs_update"
        needsAttention = true
        message = `Истекает через ${daysUntilExpiry} дн.`
      }
    }

    // Check review date (only if not already expired)
    if (status !== "expired" && document.nextReviewDate) {
      daysUntilReview = differenceInDays(document.nextReviewDate, now)

      if (daysUntilReview < 0) {
        status = "needs_update"
        needsAttention = true
        message = `Требуется пересмотр (просрочен на ${Math.abs(daysUntilReview)} дн.)`
      } else if (daysUntilReview <= 14) {
        if (status === "ok") {
          status = "needs_update"
        }
        needsAttention = true
        message = `Пересмотр через ${daysUntilReview} дн.`
      }
    }

    return {
      status,
      daysUntilExpiry,
      daysUntilReview,
      needsAttention,
      message,
    }
  }

  /**
   * @intent: Mark document as reviewed and set next review date
   * @precondition: user has permission to review
   * @postcondition: document review metadata updated
   */
  async reviewDocument(params: ReviewDocumentParams): Promise<Document> {
    const { documentId, userId, reviewNotes, nextReviewDate, validityPeriodDays } = params

    // Get document
    const document = await this.db.evidence.findById(documentId)
    if (!document) {
      throw new AppError("Document not found", 404)
    }

    if (!document.isDocument) {
      throw new AppError("Evidence is not a document", 400)
    }

    // Calculate new dates
    const now = new Date()
    let newNextReviewDate = nextReviewDate
    let newExpiresAt = document.expiresAt

    // If validity period is provided, calculate new expiration
    if (validityPeriodDays) {
      newExpiresAt = addDays(now, validityPeriodDays)
    }

    // If no next review date provided, calculate based on validity period
    if (!newNextReviewDate && validityPeriodDays) {
      // Set review date to 30 days before expiration
      newNextReviewDate = addDays(now, validityPeriodDays - 30)
    }

    // Update document
    const updated = await this.db.evidence.update(documentId, {
      lastReviewedAt: now,
      lastReviewedBy: userId,
      reviewNotes,
      nextReviewDate: newNextReviewDate,
      validityPeriodDays,
      expiresAt: newExpiresAt,
    })

    return updated as Document
  }

  /**
   * @intent: Get documents requiring attention (expiring or needing review)
   * @precondition: user authenticated
   * @postcondition: list of documents needing attention
   */
  async getDocumentsNeedingAttention(userId: string, tenantId: string, organizationId?: string): Promise<Document[]> {
    // Get all documents for tenant/organization
    const documents = await this.db.evidence.findAll({
      tenantId,
      organizationId,
      isDocument: true,
    })

    // Filter documents needing attention
    const needingAttention = documents.filter((doc) => {
      const result = this.calculateActualityStatus(doc as Document)
      return result.needsAttention
    })

    // Sort by urgency (expired first, then by days until action needed)
    return needingAttention.sort((a, b) => {
      const aResult = this.calculateActualityStatus(a as Document)
      const bResult = this.calculateActualityStatus(b as Document)

      if (aResult.status === "expired" && bResult.status !== "expired") return -1
      if (aResult.status !== "expired" && bResult.status === "expired") return 1

      const aDays = Math.min(
        aResult.daysUntilExpiry ?? Number.POSITIVE_INFINITY,
        aResult.daysUntilReview ?? Number.POSITIVE_INFINITY,
      )
      const bDays = Math.min(
        bResult.daysUntilExpiry ?? Number.POSITIVE_INFINITY,
        bResult.daysUntilReview ?? Number.POSITIVE_INFINITY,
      )

      return aDays - bDays
    }) as Document[]
  }

  /**
   * @intent: Get actuality statistics for dashboard
   * @precondition: user authenticated
   * @postcondition: statistics calculated
   */
  async getActualityStatistics(
    tenantId: string,
    organizationId?: string,
  ): Promise<{
    total: number
    ok: number
    needsReview: number
    expired: number
    notRelevant: number
  }> {
    const documents = await this.db.evidence.findAll({
      tenantId,
      organizationId,
      isDocument: true,
    })

    const stats = {
      total: documents.length,
      ok: 0,
      needsReview: 0,
      expired: 0,
      notRelevant: 0,
    }

    documents.forEach((doc) => {
      const result = this.calculateActualityStatus(doc as Document)
      switch (result.status) {
        case "ok":
          stats.ok++
          break
        case "needs_update":
          stats.needsReview++
          break
        case "expired":
          stats.expired++
          break
        case "not_relevant":
          stats.notRelevant++
          break
      }
    })

    return stats
  }

  /**
   * @intent: Bulk update review dates for multiple documents
   * @precondition: user has permission
   * @postcondition: documents updated
   */
  async bulkSetReviewDates(
    documentIds: string[],
    nextReviewDate: Date,
    userId: string,
  ): Promise<{ updated: number; failed: number }> {
    let updated = 0
    let failed = 0

    for (const documentId of documentIds) {
      try {
        await this.db.evidence.update(documentId, {
          nextReviewDate,
          lastReviewedBy: userId,
          lastReviewedAt: new Date(),
        })
        updated++
      } catch (error) {
        console.error(`[v0] Failed to update document ${documentId}:`, error)
        failed++
      }
    }

    return { updated, failed }
  }
}
