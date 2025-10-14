"use client"

/**
 * Executive Summary Page
 * Сводный отчёт для руководства
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { ExecutiveSummaryData, Recommendation } from "@/types/domain/recommendation"
import Link from "next/link"

export default function ExecutiveSummaryPage() {
  const [data, setData] = useState<ExecutiveSummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/reports/executive-summary")
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("[Executive Summary] Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка Executive Summary...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Не удалось загрузить данные</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Executive Summary</h1>
          <p className="text-muted-foreground mt-2">
            Сводный отчёт о состоянии информационной безопасности
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Скачать PDF
          </Button>
          <Link href="/reports">
            <Button variant="ghost">Назад к отчётам</Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Общее соответствие"
          value={`${data.overallCompletionRate}%`}
          trend={data.monthlyTrend}
          description="Уровень выполнения всех требований"
          status={getStatusColor(data.overallCompletionRate)}
        />
        <MetricCard
          title="Критические требования"
          value={`${data.criticalCompletionRate}%`}
          trend={0}
          description="Выполнение критичных требований"
          status={getStatusColor(data.criticalCompletionRate)}
        />
        <MetricCard
          title="Организаций"
          value={data.totalOrganizations}
          description="Подведомственных учреждений"
        />
        <MetricCard
          title="Рекомендаций"
          value={data.recommendations.length}
          description="Требуют внимания"
          status={data.recommendations.some(r => r.priority === 'critical') ? 'critical' : 'warning'}
        />
      </div>

      {/* Regulator Status */}
      <Card>
        <CardHeader>
          <CardTitle>Статус по регуляторам</CardTitle>
          <CardDescription>Уровень выполнения требований различных регуляторов</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.regulatorStatus.map((regulator) => (
            <div key={regulator.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{regulator.name}</span>
                  <StatusBadge status={regulator.status} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {regulator.requirementsCompleted} из {regulator.requirementsTotal}
                  </span>
                  <span className="font-bold text-lg w-16 text-right">
                    {regulator.completionRate}%
                  </span>
                </div>
              </div>
              <Progress value={regulator.completionRate} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Требует внимания
          </CardTitle>
          <CardDescription>Приоритетные рекомендации для руководства</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.recommendations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Критичных проблем не обнаружено</p>
              <p className="text-sm text-muted-foreground mt-2">
                Система соответствия работает нормально
              </p>
            </div>
          ) : (
            data.recommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Weak Organizations */}
      {data.weakOrganizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Организации с низким уровнем выполнения</CardTitle>
            <CardDescription>Топ-5 организаций, требующих усиленного контроля</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.weakOrganizations.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{org.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Критичных проблем: {org.criticalIssues}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={org.completionRate} className="w-32 h-2" />
                    <span className="font-bold w-12 text-right">{Math.round(org.completionRate)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground py-4">
        <p>Отчёт сгенерирован {new Date().toLocaleString('ru-RU')}</p>
        <p className="mt-1">Система управления информационной безопасностью</p>
      </div>
    </div>
  )
}

// Helper Components

interface MetricCardProps {
  title: string
  value: string | number
  trend?: number
  description?: string
  status?: 'good' | 'warning' | 'critical'
}

function MetricCard({ title, value, trend, description, status }: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="h-4 w-4" />
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }

  const getStatusClass = () => {
    if (!status) return ""
    if (status === 'good') return "border-green-500"
    if (status === 'warning') return "border-orange-500"
    return "border-red-500"
  }

  return (
    <Card className={getStatusClass()}>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">{value}</div>
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              {trend !== 0 && (
                <span className="text-sm font-medium">
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: 'good' | 'warning' | 'critical' }) {
  const config = {
    good: { label: 'Хорошо', className: 'bg-green-100 text-green-800' },
    warning: { label: 'Внимание', className: 'bg-orange-100 text-orange-800' },
    critical: { label: 'Критично', className: 'bg-red-100 text-red-800' },
  }

  const { label, className } = config[status]

  return <Badge variant="outline" className={className}>{label}</Badge>
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const priorityConfig = {
    critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'КРИТИЧНО' },
    high: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50', label: 'ВАЖНО' },
    medium: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'СРЕДНИЙ' },
    low: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50', label: 'НИЗКИЙ' },
  }

  const config = priorityConfig[recommendation.priority]
  const Icon = config.icon

  return (
    <div className={`p-4 rounded-lg border ${config.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 ${config.color} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={config.color}>{config.label}</Badge>
            <h4 className="font-semibold">{recommendation.title}</h4>
          </div>
          
          <p className="text-sm text-muted-foreground">{recommendation.description}</p>
          
          <div className="bg-white p-3 rounded border">
            <p className="text-sm font-medium mb-1">📋 Рекомендуемые действия:</p>
            <p className="text-sm">{recommendation.action}</p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            {recommendation.deadline && (
              <div>
                <span className="text-muted-foreground">Срок:</span>{' '}
                <span className="font-medium">{recommendation.deadline}</span>
              </div>
            )}
            {recommendation.estimatedBudget && (
              <div>
                <span className="text-muted-foreground">Бюджет:</span>{' '}
                <span className="font-medium">{recommendation.estimatedBudget}</span>
              </div>
            )}
            {recommendation.legalBasis && (
              <div>
                <span className="text-muted-foreground">Основание:</span>{' '}
                <span className="font-medium">{recommendation.legalBasis}</span>
              </div>
            )}
          </div>

          {recommendation.affectedOrganizations && recommendation.affectedOrganizations.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Затронуто организаций: {recommendation.affectedOrganizations.length}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getStatusColor(rate: number): 'good' | 'warning' | 'critical' {
  if (rate >= 80) return 'good'
  if (rate >= 60) return 'warning'
  return 'critical'
}

