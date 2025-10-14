"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Sparkles, AlertTriangle, TrendingUp, Lightbulb, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react"
import type { DocumentAnalysis } from "@/types/domain/document"

interface DocumentAnalysisViewProps {
  documentId: string
  currentVersionId: string
  previousVersionId?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function DocumentAnalysisView({ documentId, currentVersionId, previousVersionId }: DocumentAnalysisViewProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Fetch analyses for this document
  const { data: analysesData, mutate } = useSWR(`/api/documents/${documentId}/analyses`, fetcher)

  const analyses: DocumentAnalysis[] = analysesData?.data || []

  // Find latest analysis
  const latestAnalysis = analyses.find((a) => a.toVersionId === currentVersionId && a.status === "completed")

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromVersionId: previousVersionId,
          toVersionId: currentVersionId,
          llmProvider: "openai",
        }),
      })

      if (!response.ok) throw new Error("Failed to start analysis")

      // Poll for completion
      const { data: analysis } = await response.json()
      let attempts = 0
      const maxAttempts = 60 // 60 seconds timeout

      const pollInterval = setInterval(async () => {
        attempts++
        const statusResponse = await fetch(`/api/analyses/${analysis.id}`)
        const { data: updatedAnalysis } = await statusResponse.json()

        if (updatedAnalysis.status === "completed" || updatedAnalysis.status === "failed") {
          clearInterval(pollInterval)
          setIsAnalyzing(false)
          mutate()
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          setIsAnalyzing(false)
        }
      }, 1000)
    } catch (error) {
      console.error("[v0] Analysis error:", error)
      setIsAnalyzing(false)
    }
  }

  if (isAnalyzing) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <Spinner className="h-8 w-8" />
          <div className="text-center">
            <h3 className="font-semibold">Анализируем изменения...</h3>
            <p className="text-sm text-muted-foreground mt-1">AI анализирует документ и выявляет критичные изменения</p>
          </div>
        </div>
      </Card>
    )
  }

  if (!latestAnalysis) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <Sparkles className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h3 className="font-semibold">Анализ не выполнен</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Запустите AI-анализ для выявления изменений и оценки влияния
            </p>
          </div>
          <Button onClick={handleAnalyze} className="mt-2">
            <Sparkles className="h-4 w-4 mr-2" />
            Запустить анализ
          </Button>
        </div>
      </Card>
    )
  }

  const { summary, criticalChanges, impactAssessment, recommendations } = latestAnalysis

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold">AI Анализ изменений</h3>
          <Badge variant="outline" className="ml-2">
            {latestAnalysis.llmProvider} / {latestAnalysis.llmModel}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={handleAnalyze}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить анализ
        </Button>
      </div>

      {/* Summary */}
      <Card className="p-6 border-l-4 border-l-purple-500">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Краткое описание
        </h4>
        <p className="text-sm leading-relaxed">{summary}</p>
      </Card>

      {/* Critical Changes */}
      {criticalChanges && criticalChanges.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Критичные изменения ({criticalChanges.length})
          </h4>
          <div className="space-y-3">
            {criticalChanges.map((change: any, index: number) => (
              <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-shrink-0 mt-0.5">
                  {change.severity === "critical" && <XCircle className="h-5 w-5 text-red-500" />}
                  {change.severity === "high" && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                  {change.severity === "medium" && <Clock className="h-5 w-5 text-yellow-500" />}
                  {change.severity === "low" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        change.type === "addition"
                          ? "default"
                          : change.type === "deletion"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {change.type === "addition" ? "Добавлено" : change.type === "deletion" ? "Удалено" : "Изменено"}
                    </Badge>
                    {change.section && <span className="text-xs text-muted-foreground">{change.section}</span>}
                  </div>
                  <p className="text-sm">{change.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Impact Assessment */}
      {impactAssessment && (
        <Card className="p-6 border-l-4 border-l-orange-500">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Оценка влияния
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Общее влияние:</span>
              <Badge
                variant={
                  impactAssessment.overallImpact === "high"
                    ? "destructive"
                    : impactAssessment.overallImpact === "medium"
                      ? "default"
                      : "secondary"
                }
              >
                {impactAssessment.overallImpact === "high"
                  ? "Высокое"
                  : impactAssessment.overallImpact === "medium"
                    ? "Среднее"
                    : "Низкое"}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed">{impactAssessment.description}</p>

            {impactAssessment.affectedRequirements?.length > 0 && (
              <div>
                <span className="text-sm font-medium">Затронутые требования:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {impactAssessment.affectedRequirements.map((reqId: string) => (
                    <Badge key={reqId} variant="outline">
                      {reqId}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card className="p-6 border-l-4 border-l-blue-500">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Рекомендации ({recommendations.length})
          </h4>
          <div className="space-y-3">
            {recommendations.map((rec: any, index: number) => (
              <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-shrink-0 mt-0.5">
                  <Badge
                    variant={
                      rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {rec.priority === "high" ? "Высокий" : rec.priority === "medium" ? "Средний" : "Низкий"}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm mb-1">{rec.action}</p>
                  {rec.deadline && (
                    <p className="text-xs text-muted-foreground">
                      Срок: {new Date(rec.deadline).toLocaleDateString("ru-RU")}
                    </p>
                  )}
                  {rec.relatedDocuments?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rec.relatedDocuments.map((docId: string) => (
                        <Badge key={docId} variant="outline" className="text-xs">
                          {docId}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted-foreground">
        Анализ выполнен {new Date(latestAnalysis.createdAt).toLocaleString("ru-RU")}
        {latestAnalysis.tokensUsed && ` • Использовано токенов: ${latestAnalysis.tokensUsed}`}
        {latestAnalysis.processingTimeMs &&
          ` • Время обработки: ${(latestAnalysis.processingTimeMs / 1000).toFixed(1)}с`}
      </div>
    </div>
  )
}
