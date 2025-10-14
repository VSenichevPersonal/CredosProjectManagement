export type NotificationType =
  | "requirement_assigned"
  | "deadline_approaching"
  | "status_changed"
  | "review_requested"
  | "approved"
  | "rejected"
  | "comment_added"
  | "evidence_uploaded"
  | "evidence_approved"
  | "evidence_rejected"
  | "bulk_operation_completed"
  | "control_test_due"
  | "compliance_record_created"

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: Date
}
