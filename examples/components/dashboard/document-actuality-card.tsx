/**
 * @intent: Dashboard card showing document actuality statistics
 * @architecture: Stats card with visual indicators
 */

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, AlertCircle, Clock, CheckCircle } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface DocumentActualityCardProps {
  organizationId?: string
}

export function DocumentActualityCard({ organizationId }: DocumentActualityCardProps) {
  const { data, isLoading } = useSWR(
    `/api/documents/actuality/stats${organizationId ? `?organizationId=${organizationId}` : ""}`,
    fetcher,
    { refreshInterval: 60000 }, // Refresh every minute
  )

  const stats = data?.data || {
    total: 0,
    ok: 0,
    needsReview: 0,
    expired: 0,
    notRelevant: 0,
  }

  const actualityRate = stats.total > 0 ? Math.round((stats.ok / stats.total) * 100) : 0
  const needsAttention = stats.needsReview + stats.expired

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Актуальность документов</CardTitle>
          <CardDescription>Загрузка...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Загрузка статистики...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Актуальность документов
        </CardTitle>
        <CardDescription>Статус актуальности документов</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Actuality Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Актуальных документов</span>
            <span className="text-2xl font-bold">{actualityRate}%</span>
          </div>
          <Progress value={actualityRate} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              <p className="text-xs text-muted-foreground">Актуальных</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.ok}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-yellow-600" />
              <p className="text-xs text-muted-foreground">Требуют пересмотра</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.needsReview}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-red-600" />
              <p className="text-xs text-muted-foreground">Истекших</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-gray-600" />
              <p className="text-xs text-muted-foreground">Всего</p>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>

        {/* Alert for documents needing attention */}
        {needsAttention > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-800">Требуют внимания</span>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                {needsAttention}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
