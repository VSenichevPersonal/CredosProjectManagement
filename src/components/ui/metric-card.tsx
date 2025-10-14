import { ArrowUp, ArrowDown, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: number | string
  trend?: {
    value: number
    direction: "up" | "down" | "neutral"
  }
  className?: string
  icon?: React.ReactNode
  description?: string
}

export function MetricCard({ label, value, trend, className, icon, description }: MetricCardProps) {
  const TrendIcon = trend
    ? trend.direction === "up"
      ? ArrowUp
      : trend.direction === "down"
        ? ArrowDown
        : ArrowRight
    : null

  const trendColor =
    trend?.direction === "up" ? "text-green-600" : trend?.direction === "down" ? "text-red-600" : "text-neutral-500"

  return (
    <Card className={cn("credos-metric-card", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            {icon && <div className="text-credos-primary">{icon}</div>}
          </div>
          
          <p className="credos-metric-value">{value}</p>
          
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          
          {trend && TrendIcon && (
            <div className={cn("credos-trend-up flex items-center gap-1 text-sm font-medium", trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span>
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
