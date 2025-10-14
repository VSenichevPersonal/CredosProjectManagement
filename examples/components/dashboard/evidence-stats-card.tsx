"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, CheckCircle2, Clock, XCircle } from "lucide-react"

interface EvidenceStatsCardProps {
  total: number
  approved: number
  pending: number
  rejected: number
}

export function EvidenceStatsCard({ total, approved, pending, rejected }: EvidenceStatsCardProps) {
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Статистика доказательств
        </CardTitle>
        <CardDescription>Состояние загруженных доказательств</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Уровень одобрения</span>
            <span className="font-semibold">{approvalRate}%</span>
          </div>
          <Progress value={approvalRate} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 bg-green-50 rounded-md">
            <CheckCircle2 className="h-5 w-5 text-green-600 mb-1" />
            <div className="text-2xl font-bold text-green-600">{approved}</div>
            <div className="text-xs text-green-700">Одобрено</div>
          </div>

          <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-md">
            <Clock className="h-5 w-5 text-yellow-600 mb-1" />
            <div className="text-2xl font-bold text-yellow-600">{pending}</div>
            <div className="text-xs text-yellow-700">На проверке</div>
          </div>

          <div className="flex flex-col items-center p-3 bg-red-50 rounded-md">
            <XCircle className="h-5 w-5 text-red-600 mb-1" />
            <div className="text-2xl font-bold text-red-600">{rejected}</div>
            <div className="text-xs text-red-700">Отклонено</div>
          </div>
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Всего доказательств</span>
            <Badge variant="outline">{total}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
