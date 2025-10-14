"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, CheckCircle2, Clock, AlertCircle } from "lucide-react"

interface ControlsStatsCardProps {
  total: number
  implemented: number
  inProgress: number
  notStarted: number
}

export function ControlsStatsCard({ total, implemented, inProgress, notStarted }: ControlsStatsCardProps) {
  const implementationRate = total > 0 ? Math.round((implemented / total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Статистика мер защиты
        </CardTitle>
        <CardDescription>Состояние внедрения мер защиты</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Уровень внедрения</span>
            <span className="font-semibold">{implementationRate}%</span>
          </div>
          <Progress value={implementationRate} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 bg-green-50 rounded-md">
            <CheckCircle2 className="h-5 w-5 text-green-600 mb-1" />
            <div className="text-2xl font-bold text-green-600">{implemented}</div>
            <div className="text-xs text-green-700">Внедрено</div>
          </div>

          <div className="flex flex-col items-center p-3 bg-blue-50 rounded-md">
            <Clock className="h-5 w-5 text-blue-600 mb-1" />
            <div className="text-2xl font-bold text-blue-600">{inProgress}</div>
            <div className="text-xs text-blue-700">В работе</div>
          </div>

          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-md">
            <AlertCircle className="h-5 w-5 text-gray-600 mb-1" />
            <div className="text-2xl font-bold text-gray-600">{notStarted}</div>
            <div className="text-xs text-gray-700">Не начато</div>
          </div>
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Всего мер</span>
            <Badge variant="outline">{total}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
