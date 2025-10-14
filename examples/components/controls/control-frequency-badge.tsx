import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import type { ControlFrequency } from "@/types/domain/control"

interface ControlFrequencyBadgeProps {
  frequency: ControlFrequency
  className?: string
}

const frequencyLabels: Record<ControlFrequency, string> = {
  continuous: "Непрерывно",
  daily: "Ежедневно",
  weekly: "Еженедельно",
  monthly: "Ежемесячно",
  quarterly: "Ежеквартально",
  annual: "Ежегодно",
  on_demand: "По требованию",
}

export function ControlFrequencyBadge({ frequency, className }: ControlFrequencyBadgeProps) {
  return (
    <Badge variant="secondary" className={className}>
      <Clock className="h-3 w-3 mr-1" />
      {frequencyLabels[frequency]}
    </Badge>
  )
}
