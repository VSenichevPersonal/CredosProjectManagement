"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { calculateEvidenceFreshness, getFreshnessBadgeVariant } from "@/lib/utils/evidence-freshness"
import { Clock } from "lucide-react"

interface EvidenceFreshnessBadgeProps {
  updatedAt: Date
  expiresAt?: Date
  regulatoryChangeDate?: Date
  showDetails?: boolean
}

export function EvidenceFreshnessBadge({
  updatedAt,
  expiresAt,
  regulatoryChangeDate,
  showDetails = true,
}: EvidenceFreshnessBadgeProps) {
  const freshness = calculateEvidenceFreshness(updatedAt, expiresAt, regulatoryChangeDate)

  if (!showDetails) {
    return <Badge variant={getFreshnessBadgeVariant(freshness.status)}>{freshness.score}%</Badge>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <Badge variant={getFreshnessBadgeVariant(freshness.status)}>
              {freshness.message} ({freshness.score}%)
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-sm">
            <p>Обновлено: {freshness.daysOld} дней назад</p>
            {expiresAt && <p>Истекает: {expiresAt.toLocaleDateString("ru-RU")}</p>}
            <p className="text-muted-foreground">Оценка актуальности: {freshness.score}/100</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
