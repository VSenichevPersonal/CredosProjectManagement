"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, RefreshCw, Info, AlertTriangle, Clock, CheckCircle2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { translateCriticality, translateCategory } from "@/lib/utils/translations"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ReadinessReportProps {
  organizations: Array<{ id: string; name: string }>
}

export function ReadinessReport({ organizations }: ReadinessReportProps) {
  const [selectedOrg, setSelectedOrg] = useState<string>("all")
  const [report, setReport] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [selectedOrg])

  const fetchReport = async () => {
    setIsLoading(true)
    try {
      const url =
        selectedOrg === "all" ? "/api/reports/readiness" : `/api/reports/readiness?organizationId=${selectedOrg}`
      const response = await fetch(url)
      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error("Failed to fetch readiness report:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div>Загрузка отчета о готовности...</div>
  }

  if (!report) {
    return null
  }

  const { summary, documentStatus, evidence, readinessByCategory, readinessByCriticality, criticalIssues } = report

  const upcomingDeadlines = report.upcomingDeadlines || []
  const staleEvidence = report.staleEvidence || []
  const missingEvidence = report.missingEvidence || []

  const readinessScore = Math.round(
    summary.complianceRate * 0.5 +
      (evidence.approved / evidence.total) * 100 * 0.3 +
      (100 - (staleEvidence.length / evidence.total) * 100) * 0.2,
  )

  const getReadinessStatus = (score: number) => {
    if (score >= 80) return { label: "Готов", color: "text-green-600", bgColor: "bg-green-50", icon: CheckCircle2 }
    if (score >= 60) return { label: "Частично готов", color: "text-yellow-600", bgColor: "bg-yellow-50", icon: Clock }
    return { label: "Не готов", color: "text-red-600", bgColor: "bg-red-50", icon: AlertTriangle }
  }

  const readinessStatus = getReadinessStatus(readinessScore)
  const ReadinessIcon = readinessStatus.icon

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Отчет о готовности к комплаенсу</h2>
          <p className="text-sm text-muted-foreground">
            Сгенерирован: {new Date(report.generatedAt).toLocaleString("ru-RU")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Выберите организацию" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все организации</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchReport}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Экспорт PDF
          </Button>
        </div>
      </div>

      <Card className={`p-6 ${readinessStatus.bgColor} border-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ReadinessIcon className={`h-12 w-12 ${readinessStatus.color}`} />
            <div>
              <h3 className="text-2xl font-bold">{readinessStatus.label}</h3>
              <p className="text-sm text-muted-foreground">Общая оценка готовности к проверке</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-bold ${readinessStatus.color}`}>{readinessScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">Индекс готовности</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Требуют внимания</h4>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600">{criticalIssues.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Критические проблемы</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Приближаются дедлайны</h4>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-600">{upcomingDeadlines.length}</div>
          <p className="text-xs text-muted-foreground mt-1">В течение 30 дней</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Устаревшие доказательства</h4>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-orange-600">{staleEvidence.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Требуют обновления</p>
        </Card>
      </div>

      {/* Overall Compliance Score */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Общий уровень соответствия</h3>
          <span className="text-3xl font-bold">{summary.complianceRate}%</span>
        </div>
        <Progress value={summary.complianceRate} className="h-3" />
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.compliantCount}</div>
            <div className="text-xs text-muted-foreground">Соответствует</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.partiallyCompliantCount}</div>
            <div className="text-xs text-muted-foreground">Частично</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.nonCompliantCount}</div>
            <div className="text-xs text-muted-foreground">Не соответствует</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{summary.notApplicableCount}</div>
            <div className="text-xs text-muted-foreground">Не применимо</div>
          </div>
        </div>
      </Card>

      {/* Document Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Статус документов</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-2xl font-bold text-red-600">{documentStatus.needDocument}</div>
            <div className="text-xs text-muted-foreground">Требуется документ</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-2xl font-bold text-green-600">{documentStatus.ok}</div>
            <div className="text-xs text-muted-foreground">Актуален</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-2xl font-bold text-yellow-600">{documentStatus.needsUpdate}</div>
            <div className="text-xs text-muted-foreground">Требуется обновление</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-2xl font-bold text-gray-600">{documentStatus.notRelevant}</div>
            <div className="text-xs text-muted-foreground">Не применимо</div>
          </div>
        </div>
      </Card>

      {/* Evidence Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Доказательства</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-2xl font-bold">{evidence.total}</div>
            <div className="text-xs text-muted-foreground">Всего</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-2xl font-bold text-green-600">{evidence.approved}</div>
            <div className="text-xs text-muted-foreground">Одобрено</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-2xl font-bold text-yellow-600">{evidence.pending}</div>
            <div className="text-xs text-muted-foreground">На проверке</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-2xl font-bold text-red-600">{evidence.rejected}</div>
            <div className="text-xs text-muted-foreground">Отклонено</div>
          </div>
        </div>
      </Card>

      {/* Readiness by Category */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold">Готовность по категориям</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Показывает уровень готовности по типам требований: технические (ИТ-инфраструктура), организационные
                  (политики и процедуры), процедурные (рабочие процессы), физические (физическая безопасность)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex flex-col gap-4">
          {readinessByCategory.map((item: any) => (
            <div key={item.category} className="flex items-center gap-4">
              <div className="w-48 text-sm font-medium">{translateCategory(item.category)}</div>
              <div className="flex-1">
                <Progress value={item.rate} className="h-2" />
              </div>
              <div className="w-32 text-right text-sm text-muted-foreground">
                {item.compliant} / {item.total} ({Math.round(item.rate)}%)
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Readiness by Criticality */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold">Готовность по критичности</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Показывает уровень готовности по степени важности требований: критический (требует немедленного
                  внимания), высокий (приоритетный), средний (важный), низкий (желательный)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex flex-col gap-4">
          {readinessByCriticality.map((item: any) => (
            <div key={item.criticality} className="flex items-center gap-4">
              <div className="w-48 text-sm font-medium">{translateCriticality(item.criticality)}</div>
              <div className="flex-1">
                <Progress value={item.rate} className="h-2" />
              </div>
              <div className="w-32 text-right text-sm text-muted-foreground">
                {item.compliant} / {item.total} ({Math.round(item.rate)}%)
              </div>
            </div>
          ))}
        </div>
      </Card>

      {upcomingDeadlines.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Приближающиеся дедлайны</h3>
          <div className="flex flex-col gap-3">
            {upcomingDeadlines.slice(0, 5).map((deadline: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{deadline.requirementTitle}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Дедлайн: {new Date(deadline.nextReviewDate).toLocaleDateString("ru-RU")} (через {deadline.daysUntil}{" "}
                    дней)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Критические проблемы</h3>
          <div className="flex flex-col gap-3">
            {criticalIssues.map((issue: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 border border-red-200 rounded-lg bg-red-50">
                <Badge variant="destructive" className="mt-0.5">
                  {translateCriticality(issue.criticality)}
                </Badge>
                <div className="flex-1">
                  <div className="font-medium text-sm">{issue.requirementCode}</div>
                  <div className="text-sm text-muted-foreground">{issue.requirementTitle}</div>
                  {issue.lastChecked && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Последняя проверка: {new Date(issue.lastChecked).toLocaleDateString("ru-RU")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
