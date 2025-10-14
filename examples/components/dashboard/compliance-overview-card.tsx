"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface ComplianceOverviewCardProps {
  totalRequirements: number
  applicableRequirements: number
  completedRequirements: number
  inProgressRequirements: number
  overdueRequirements: number
  trend?: {
    value: number
    direction: "up" | "down" | "neutral"
  }
}

export function ComplianceOverviewCard({
  totalRequirements,
  applicableRequirements,
  completedRequirements,
  inProgressRequirements,
  overdueRequirements,
  trend,
}: ComplianceOverviewCardProps) {
  const completionRate =
    applicableRequirements > 0 ? Math.round((completedRequirements / applicableRequirements) * 100) : 0

  const getTrendIcon = () => {
    if (!trend) return null
    switch (trend.direction) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return "text-muted-foreground"
    switch (trend.direction) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Общий обзор соответствия</CardTitle>
        <CardDescription>Прогресс выполнения требований</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Уровень соответствия</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{completionRate}%</span>
              {trend && (
                <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
                  {getTrendIcon()}
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>
          </div>
          <Progress value={completionRate} className="h-3" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Всего требований</p>
            <p className="text-2xl font-bold">{totalRequirements}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Применимых</p>
            <p className="text-2xl font-bold">{applicableRequirements}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Выполнено</p>
            <p className="text-2xl font-bold text-green-600">{completedRequirements}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">В работе</p>
            <p className="text-2xl font-bold text-blue-600">{inProgressRequirements}</p>
          </div>
        </div>

        {overdueRequirements > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-800">Просроченных требований</span>
              <Badge variant="destructive">{overdueRequirements}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
