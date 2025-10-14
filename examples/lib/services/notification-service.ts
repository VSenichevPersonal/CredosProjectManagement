import { createServerClient } from "@/lib/supabase/server"
import type { NotificationType } from "@/types/domain/notification"

export class NotificationService {
  static async create(params: {
    userId: string
    type: NotificationType
    title: string
    message: string
    link?: string
  }) {
    const supabase = await createServerClient()

    const { error } = await supabase.from("notifications").insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
    })

    if (error) {
      console.error("[v0] Failed to create notification:", error)
      throw error
    }
  }

  static async createBulk(
    notifications: Array<{
      userId: string
      type: NotificationType
      title: string
      message: string
      link?: string
    }>,
  ) {
    const supabase = await createServerClient()

    const { error } = await supabase.from("notifications").insert(
      notifications.map((n) => ({
        user_id: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link || null,
      })),
    )

    if (error) {
      console.error("[v0] Failed to create bulk notifications:", error)
      throw error
    }
  }

  static async notifyRequirementAssigned(params: {
    userId: string
    requirementCode: string
    requirementTitle: string
    complianceId: string
  }) {
    await this.create({
      userId: params.userId,
      type: "requirement_assigned",
      title: "Назначено новое требование",
      message: `Вам назначено требование ${params.requirementCode}: ${params.requirementTitle}`,
      link: `/compliance/${params.complianceId}`,
    })
  }

  static async notifyDeadlineApproaching(params: {
    userId: string
    requirementCode: string
    deadline: Date
    complianceId: string
  }) {
    const daysLeft = Math.ceil((params.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    await this.create({
      userId: params.userId,
      type: "deadline_approaching",
      title: "Приближается срок выполнения",
      message: `До дедлайна требования ${params.requirementCode} осталось ${daysLeft} дней`,
      link: `/compliance/${params.complianceId}`,
    })
  }

  static async notifyReviewRequested(params: {
    reviewerId: string
    requirementCode: string
    organizationName: string
    complianceId: string
  }) {
    await this.create({
      userId: params.reviewerId,
      type: "review_requested",
      title: "Требуется проверка выполнения",
      message: `Организация ${params.organizationName} отправила на проверку требование ${params.requirementCode}`,
      link: `/compliance/${params.complianceId}`,
    })
  }

  static async notifyApproved(params: {
    userId: string
    requirementCode: string
    reviewerName: string
    complianceId: string
  }) {
    await this.create({
      userId: params.userId,
      type: "approved",
      title: "Выполнение утверждено",
      message: `${params.reviewerName} утвердил выполнение требования ${params.requirementCode}`,
      link: `/compliance/${params.complianceId}`,
    })
  }

  static async notifyRejected(params: {
    userId: string
    requirementCode: string
    reviewerName: string
    reason: string
    complianceId: string
  }) {
    await this.create({
      userId: params.userId,
      type: "rejected",
      title: "Выполнение отклонено",
      message: `${params.reviewerName} отклонил выполнение требования ${params.requirementCode}. Причина: ${params.reason}`,
      link: `/compliance/${params.complianceId}`,
    })
  }

  static async notifyEvidenceUploaded(params: {
    reviewerIds: string[]
    evidenceTitle: string
    uploaderName: string
    requirementCode?: string
    evidenceId: string
  }) {
    const notifications = params.reviewerIds.map((userId) => ({
      userId,
      type: "evidence_uploaded" as NotificationType,
      title: "Загружено новое доказательство",
      message: `${params.uploaderName} загрузил доказательство "${params.evidenceTitle}"${params.requirementCode ? ` для требования ${params.requirementCode}` : ""}`,
      link: `/evidence/${params.evidenceId}`,
    }))

    await this.createBulk(notifications)
  }

  static async notifyEvidenceApproved(params: {
    uploaderId: string
    evidenceTitle: string
    reviewerName: string
    evidenceId: string
  }) {
    await this.create({
      userId: params.uploaderId,
      type: "evidence_approved",
      title: "Доказательство утверждено",
      message: `${params.reviewerName} утвердил доказательство "${params.evidenceTitle}"`,
      link: `/evidence/${params.evidenceId}`,
    })
  }

  static async notifyEvidenceRejected(params: {
    uploaderId: string
    evidenceTitle: string
    reviewerName: string
    reason: string
    evidenceId: string
  }) {
    await this.create({
      userId: params.uploaderId,
      type: "evidence_rejected",
      title: "Доказательство отклонено",
      message: `${params.reviewerName} отклонил доказательство "${params.evidenceTitle}". Причина: ${params.reason}`,
      link: `/evidence/${params.evidenceId}`,
    })
  }

  static async notifyBulkOperationCompleted(params: {
    userIds: string[]
    operationType: string
    affectedCount: number
    entityType: string
  }) {
    const notifications = params.userIds.map((userId) => ({
      userId,
      type: "bulk_operation_completed" as NotificationType,
      title: "Массовая операция завершена",
      message: `Операция "${params.operationType}" выполнена для ${params.affectedCount} ${params.entityType}`,
    }))

    await this.createBulk(notifications)
  }

  static async notifyControlTestDue(params: {
    responsibleUserIds: string[]
    controlCode: string
    controlTitle: string
    dueDate: Date
    controlId: string
  }) {
    const daysLeft = Math.ceil((params.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    const notifications = params.responsibleUserIds.map((userId) => ({
      userId,
      type: "control_test_due" as NotificationType,
      title: "Требуется тестирование меры защиты",
      message: `Мера защиты ${params.controlCode} "${params.controlTitle}" требует тестирования через ${daysLeft} дней`,
      link: `/controls/${params.controlId}`,
    }))

    await this.createBulk(notifications)
  }

  static async notifyComplianceRecordsCreated(params: {
    userIds: string[]
    requirementCode: string
    organizationCount: number
    requirementId: string
  }) {
    const notifications = params.userIds.map((userId) => ({
      userId,
      type: "compliance_record_created" as NotificationType,
      title: "Созданы записи о соответствии",
      message: `Создано ${params.organizationCount} записей о соответствии для требования ${params.requirementCode}`,
      link: `/requirements/${params.requirementId}`,
    }))

    await this.createBulk(notifications)
  }
}
