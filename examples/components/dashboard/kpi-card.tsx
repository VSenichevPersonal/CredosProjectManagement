import { ArrowUp, ArrowDown, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils/cn"

interface KPICardProps {
  label: string
  value: number
  trend?: {
    value: number
    direction: "up" | "down" | "neutral"
  }
  className?: string
}

export function KPICard({ label, value, trend, className }: KPICardProps) {
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
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && TrendIcon && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", trendColor)}>
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
