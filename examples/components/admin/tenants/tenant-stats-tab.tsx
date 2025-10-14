"use client"

/**
 * Tenant Stats Tab
 *
 * Displays tenant statistics and metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { TenantStats } from "@/types/domain/tenant"
import { Users, Building2, FileText, Shield, Database, Activity } from "lucide-react"

interface TenantStatsTabProps {
  stats?: TenantStats
}

export function TenantStatsTab({ stats }: TenantStatsTabProps) {
  if (!stats) {
    return <div className="text-center py-8 text-muted-foreground">Статистика недоступна</div>
  }

  const statCards = [
    {
      title: "Пользователи",
      value: stats.userCount,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Организации",
      value: stats.organizationCount,
      icon: Building2,
      color: "text-green-500",
    },
    {
      title: "Требования",
      value: stats.requirementCount,
      icon: FileText,
      color: "text-purple-500",
    },
    {
      title: "Контроли",
      value: stats.controlCount,
      icon: Shield,
      color: "text-orange-500",
    },
    {
      title: "Доказательства",
      value: stats.evidenceCount,
      icon: Database,
      color: "text-cyan-500",
    },
    {
      title: "Записи соответствия",
      value: stats.complianceRecordCount,
      icon: Activity,
      color: "text-pink-500",
    },
  ]

  const storageUsedPercent = stats.storageUsedMB ? Math.min((stats.storageUsedMB / 1024) * 100, 100) : 0

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString("ru-RU")}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Использование хранилища</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Использовано</span>
            <span className="font-medium">{stats.storageUsedMB.toFixed(2)} MB</span>
          </div>
          <Progress value={storageUsedPercent} />
          <p className="text-xs text-muted-foreground">{storageUsedPercent.toFixed(1)}% от 1 GB</p>
        </CardContent>
      </Card>

      {/* Activity */}
      {stats.lastActivityAt && (
        <Card>
          <CardHeader>
            <CardTitle>Активность</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Последняя активность</span>
              <span>{new Date(stats.lastActivityAt).toLocaleString("ru-RU")}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
