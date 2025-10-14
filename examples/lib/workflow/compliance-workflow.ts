import type { ComplianceStatus } from "@/types/domain/compliance"

export interface WorkflowTransition {
  from: ComplianceStatus
  to: ComplianceStatus
  label: string
  requiresComment?: boolean
  requiresEvidence?: boolean
  color: string
}

export const COMPLIANCE_WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  {
    from: "not_started",
    to: "in_progress",
    label: "Начать выполнение",
    color: "blue",
  },
  {
    from: "in_progress",
    to: "pending_review",
    label: "Отправить на проверку",
    requiresEvidence: true,
    color: "yellow",
  },
  {
    from: "in_progress",
    to: "not_started",
    label: "Вернуть в начало",
    requiresComment: true,
    color: "gray",
  },
  {
    from: "pending_review",
    to: "approved",
    label: "Одобрить",
    color: "green",
  },
  {
    from: "pending_review",
    to: "rejected",
    label: "Отклонить",
    requiresComment: true,
    color: "red",
  },
  {
    from: "pending_review",
    to: "in_progress",
    label: "Вернуть на доработку",
    requiresComment: true,
    color: "orange",
  },
  {
    from: "rejected",
    to: "in_progress",
    label: "Возобновить работу",
    color: "blue",
  },
  {
    from: "approved",
    to: "in_progress",
    label: "Переоткрыть",
    requiresComment: true,
    color: "orange",
  },
]

export function getAvailableTransitions(currentStatus: ComplianceStatus): WorkflowTransition[] {
  return COMPLIANCE_WORKFLOW_TRANSITIONS.filter((t) => t.from === currentStatus)
}

export function canTransition(from: ComplianceStatus, to: ComplianceStatus): boolean {
  return COMPLIANCE_WORKFLOW_TRANSITIONS.some((t) => t.from === from && t.to === to)
}

export function getTransition(from: ComplianceStatus, to: ComplianceStatus): WorkflowTransition | undefined {
  return COMPLIANCE_WORKFLOW_TRANSITIONS.find((t) => t.from === from && t.to === to)
}

export const COMPLIANCE_STATUS_CONFIG: Record<
  ComplianceStatus,
  {
    label: string
    description: string
    color: string
    icon: string
  }
> = {
  not_started: {
    label: "Не начато",
    description: "Работа над требованием еще не начата",
    color: "gray",
    icon: "circle",
  },
  in_progress: {
    label: "В работе",
    description: "Требование находится в процессе выполнения",
    color: "blue",
    icon: "clock",
  },
  pending_review: {
    label: "На проверке",
    description: "Требование отправлено на проверку",
    color: "yellow",
    icon: "eye",
  },
  approved: {
    label: "Одобрено",
    description: "Требование выполнено и одобрено",
    color: "green",
    icon: "check-circle",
  },
  rejected: {
    label: "Отклонено",
    description: "Требование отклонено, требуется доработка",
    color: "red",
    icon: "x-circle",
  },
  overdue: {
    label: "Просрочено",
    description: "Срок выполнения требования истек",
    color: "red",
    icon: "alert-circle",
  },
}
