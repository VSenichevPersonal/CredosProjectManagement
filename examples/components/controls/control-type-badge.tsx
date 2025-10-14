import { Badge } from "@/components/ui/badge"
import { Shield, Eye, Wrench } from "lucide-react"
import type { ControlType } from "@/types/domain/control"

interface ControlTypeBadgeProps {
  type: ControlType
  className?: string
}

const typeConfig = {
  preventive: {
    label: "Превентивный",
    icon: Shield,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  detective: {
    label: "Детективный",
    icon: Eye,
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  corrective: {
    label: "Корректирующий",
    icon: Wrench,
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
}

export function ControlTypeBadge({ type, className }: ControlTypeBadgeProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`${config.className} ${className || ""}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  )
}
