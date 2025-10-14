/**
 * @intent: Inline actuality indicator with tooltip
 * @architecture: Compact status display for lists
 */

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react"
import type { DocumentStatus } from "@/types/domain/document"
import { cn } from "@/lib/utils"

interface DocumentActualityIndicatorProps {
  status?: DocumentStatus
  daysUntilExpiry?: number
  daysUntilReview?: number
  className?: string
}

export function DocumentActualityIndicator({
  status = "ok",
  daysUntilExpiry,
  daysUntilReview,
  className,
}: DocumentActualityIndicatorProps) {
  const config = {
    ok: {
      label: "Актуален",
      icon: CheckCircle,
      color: "text-green-600",
    },
    needs_update: {
      label: "Требует пересмотра",
      icon: Clock,
      color: "text-yellow-600",
    },
    expired: {
      label: "Истек",
      icon: AlertCircle,
      color: "text-red-600",
    },
    not_relevant: {
      label: "Не актуален",
      icon: XCircle,
      color: "text-gray-600",
    },
  }

  const { label, icon: Icon, color } = config[status]

  // Build tooltip message
  let tooltipMessage = label
  if (status === "needs_update" && (daysUntilExpiry !== undefined || daysUntilReview !== undefined)) {
    const days = Math.min(daysUntilExpiry ?? Number.POSITIVE_INFINITY, daysUntilReview ?? Number.POSITIVE_INFINITY)
    if (days < Number.POSITIVE_INFINITY) {
      tooltipMessage = `${label}: ${days} дн. до действия`
    }
  } else if (status === "expired" && daysUntilExpiry !== undefined && daysUntilExpiry < 0) {
    tooltipMessage = `${label}: ${Math.abs(daysUntilExpiry)} дн. назад`
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Icon className={cn("h-4 w-4", color, className)} />
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
