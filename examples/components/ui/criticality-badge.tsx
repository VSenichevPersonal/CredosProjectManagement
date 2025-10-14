import { cn } from "@/lib/utils/cn"
import type { Criticality } from "@/types/domain/requirement"

interface CriticalityBadgeProps {
  level: Criticality
  className?: string
}

const criticalityConfig: Record<Criticality, { label: string; className: string }> = {
  critical: {
    label: "Критический",
    className: "bg-red-100 text-red-800 border-red-300",
  },
  high: {
    label: "Высокий",
    className: "bg-orange-100 text-orange-800 border-orange-300",
  },
  medium: {
    label: "Средний",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  low: {
    label: "Низкий",
    className: "bg-green-100 text-green-800 border-green-300",
  },
}

const defaultConfig = {
  label: "Не указан",
  className: "bg-gray-100 text-gray-800 border-gray-300",
}

export function CriticalityBadge({ level, className }: CriticalityBadgeProps) {
  const config = criticalityConfig[level] || defaultConfig

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
