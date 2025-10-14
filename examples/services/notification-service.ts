/**
 * @intent: Service for creating and managing notifications
 * @architecture: DDD service layer with ExecutionContext
 */

import type { DatabaseProvider } from "@/providers/database-provider"
import type { Document } from "@/types/domain/document"
import { differenceInDays } from "date-fns"

export interface CreateNotificationParams {
  userId: string
  type: "deadline_reminder" | "document_expiring" | "document_expired" | "review_needed"
  title: string
  message: string
  relatedResourceType?: string
  relatedResourceId?: string
}

export class NotificationService {
  constructor(private db: DatabaseProvider) {}

  /**
   * @intent: Create a notification for a user
   * @precondition: user exists
   * @postcondition: notification created
   */
  async createNotification(params: CreateNotificationParams): Promise<void> {
    await this.db.notifications.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedResourceType: params.relatedResourceType,
      relatedResourceId: params.relatedResourceId,
      isRead: false,
    })
  }

  /**
   * @intent: Check documents and create notifications for expiring/expired ones
   * @precondition: documents exist
   * @postcondition: notifications created for relevant documents
   */
  async checkDocumentActualityAndNotify(tenantId: string): Promise<{ created: number }> {
    // Get all documents for tenant
    const documents = await this.db.evidence.findAll({
      tenantId,
      isDocument: true,
    })

    let created = 0
    const now = new Date()

    for (const doc of documents) {
      const document = doc as Document

      // Check expiration
      if (document.expiresAt) {
        const daysUntilExpiry = differenceInDays(document.expiresAt, now)

        // Notify 30 days before expiration
        if (daysUntilExpiry === 30) {
          await this.createNotification({
            userId: document.uploadedBy,
            type: "document_expiring",
            title: "Документ скоро истечет",
            message: `Документ "${document.title || document.fileName}" истекает через 30 дней`,
            relatedResourceType: "document",
            relatedResourceId: document.id,
          })
          created++
        }

        // Notify 7 days before expiration
        if (daysUntilExpiry === 7) {
          await this.createNotification({
            userId: document.uploadedBy,
            type: "document_expiring",
            title: "Документ скоро истечет",
            message: `Документ "${document.title || document.fileName}" истекает через 7 дней`,
            relatedResourceType: "document",
            relatedResourceId: document.id,
          })
          created++
        }

        // Notify on expiration day
        if (daysUntilExpiry === 0) {
          await this.createNotification({
            userId: document.uploadedBy,
            type: "document_expired",
            title: "Документ истек",
            message: `Документ "${document.title || document.fileName}" истек сегодня`,
            relatedResourceType: "document",
            relatedResourceId: document.id,
          })
          created++
        }
      }

      // Check review date
      if (document.nextReviewDate) {
        const daysUntilReview = differenceInDays(document.nextReviewDate, now)

        // Notify 14 days before review
        if (daysUntilReview === 14) {
          await this.createNotification({
            userId: document.uploadedBy,
            type: "review_needed",
            title: "Требуется пересмотр документа",
            message: `Документ "${document.title || document.fileName}" требует пересмотра через 14 дней`,
            relatedResourceType: "document",
            relatedResourceId: document.id,
          })
          created++
        }

        // Notify on review day
        if (daysUntilReview === 0) {
          await this.createNotification({
            userId: document.uploadedBy,
            type: "review_needed",
            title: "Требуется пересмотр документа",
            message: `Документ "${document.title || document.fileName}" требует пересмотра сегодня`,
            relatedResourceType: "document",
            relatedResourceId: document.id,
          })
          created++
        }
      }
    }

    return { created }
  }

  /**
   * @intent: Bulk create notifications for multiple users
   * @precondition: users exist
   * @postcondition: notifications created
   */
  async bulkCreateNotifications(notifications: CreateNotificationParams[]): Promise<{ created: number }> {
    let created = 0

    for (const notification of notifications) {
      try {
        await this.createNotification(notification)
        created++
      } catch (error) {
        console.error("[v0] Failed to create notification:", error)
      }
    }

    return { created }
  }
}
