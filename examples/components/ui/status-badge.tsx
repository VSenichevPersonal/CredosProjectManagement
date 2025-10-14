import { cn } from "@/lib/utils/cn"
import type { ComplianceStatus } from "@/types/domain/compliance"

interface StatusBadgeProps {
  status: ComplianceStatus
  className?: string
}

const statusConfig: Record<ComplianceStatus, { label: string; className: string }> = {
  in_progress: {
    label: "В процессе",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  partial: {
    label: "Частично соответствует",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  compliant: {
    label: "Соответствует",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  non_compliant: {
    label: "Не соответствует",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  not_applicable: {
    label: "Не применимо",
    className: "bg-gray-50 text-gray-700 border-gray-200",
  },
  pending: {
    label: "Ожидает",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.in_progress

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
