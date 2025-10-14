/**
 * NotificationSchedulerService
 *
 * Manages automated notifications for compliance deadlines.
 * Part of ComplianceContext.
 */

import type { ExecutionContext } from "@/lib/context/execution-context"

export interface DeadlineNotification {
  complianceRecordId: string
  organizationId: string
  requirementId: string
  requirementTitle: string
  nextReviewDate: Date
  daysUntilDeadline: number
  assignedToUserId?: string
}

export class NotificationSchedulerService {
  /**
   * Check upcoming deadlines and create notifications
   * Called by cron job daily
   */
  async checkAndNotifyDeadlines(ctx: ExecutionContext): Promise<void> {
    const upcomingDeadlines = await this.getUpcomingDeadlines(ctx)

    for (const deadline of upcomingDeadlines) {
      await this.createDeadlineNotification(ctx, deadline)
    }
  }

  /**
   * Get compliance records with deadlines in 30, 14, 7, or 1 day
   */
  private async getUpcomingDeadlines(ctx: ExecutionContext): Promise<DeadlineNotification[]> {
    const NOTIFICATION_DAYS = [30, 14, 7, 1]
    const today = new Date()

    const deadlines: DeadlineNotification[] = []

    for (const days of NOTIFICATION_DAYS) {
      const targetDate = new Date(today)
      targetDate.setDate(targetDate.getDate() + days)

      const records = await ctx.db.complianceRecords.findByReviewDate(targetDate)

      for (const record of records) {
        deadlines.push({
          complianceRecordId: record.id,
          organizationId: record.organizationId,
          requirementId: record.requirementId,
          requirementTitle: record.requirement?.title || "Требование",
          nextReviewDate: record.nextReviewDate!,
          daysUntilDeadline: days,
          assignedToUserId: record.assignedTo,
        })
      }
    }

    return deadlines
  }

  /**
   * Create notification for deadline
   */
  private async createDeadlineNotification(ctx: ExecutionContext, deadline: DeadlineNotification): Promise<void> {
    const userId = deadline.assignedToUserId || ctx.user?.id

    if (!userId) return

    const existingNotification = await ctx.db.notifications.findByDeadline(
      deadline.complianceRecordId,
      deadline.daysUntilDeadline,
    )

    if (existingNotification) {
      return
    }

    const title = this.getNotificationTitle(deadline.daysUntilDeadline)
    const message = this.getNotificationMessage(deadline)

    await ctx.db.notifications.create({
      userId,
      title,
      message,
      type: "deadline_reminder",
      metadata: {
        complianceRecordId: deadline.complianceRecordId,
        daysUntilDeadline: deadline.daysUntilDeadline,
      },
    })
  }

  private getNotificationTitle(days: number): string {
    if (days === 1) return "Срочно: Дедлайн завтра!"
    if (days === 7) return "Напоминание: Дедлайн через неделю"
    if (days === 14) return "Напоминание: Дедлайн через 2 недели"
    return "Напоминание: Дедлайн через месяц"
  }

  private getNotificationMessage(deadline: DeadlineNotification): string {
    const dateStr = deadline.nextReviewDate.toLocaleDateString("ru-RU")
    return `Требование "${deadline.requirementTitle}" требует проверки до ${dateStr}. Осталось дней: ${deadline.daysUntilDeadline}.`
  }
}
