/**
 * @intent: Badge component for document actuality status
 * @architecture: Reusable UI component with color coding
 */

import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react"
import type { DocumentStatus } from "@/types/domain/document"
import { cn } from "@/lib/utils"

interface DocumentActualityBadgeProps {
  status?: DocumentStatus
  daysUntilExpiry?: number
  daysUntilReview?: number
  className?: string
  showIcon?: boolean
}

export function DocumentActualityBadge({
  status = "ok",
  daysUntilExpiry,
  daysUntilReview,
  className,
  showIcon = true,
}: DocumentActualityBadgeProps) {
  const config = {
    ok: {
      label: "Актуален",
      className: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle,
    },
    needs_update: {
      label: "Требует пересмотра",
      className: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icon: Clock,
    },
    expired: {
      label: "Истек",
      className: "bg-red-50 text-red-700 border-red-200",
      icon: AlertCircle,
    },
    not_relevant: {
      label: "Не актуален",
      className: "bg-gray-50 text-gray-700 border-gray-200",
      icon: XCircle,
    },
  }

  const { label, className: statusClassName, icon: Icon } = config[status]

  // Add urgency info if available
  let displayLabel = label
  if (status === "needs_update" && (daysUntilExpiry !== undefined || daysUntilReview !== undefined)) {
    const days = Math.min(daysUntilExpiry ?? Number.POSITIVE_INFINITY, daysUntilReview ?? Number.POSITIVE_INFINITY)
    if (days < Number.POSITIVE_INFINITY) {
      displayLabel = `${label} (${days} дн.)`
    }
  } else if (status === "expired" && daysUntilExpiry !== undefined && daysUntilExpiry < 0) {
    displayLabel = `${label} (${Math.abs(daysUntilExpiry)} дн. назад)`
  }

  return (
    <Badge variant="outline" className={cn(statusClassName, className)}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {displayLabel}
    </Badge>
  )
}
