"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, FileText, Shield, Plus, Filter } from "lucide-react"
import type { ControlMeasure } from "@/types/domain/control-measure"
import type { Requirement } from "@/types/domain/requirement"
import { AddControlMeasureDialog } from "./add-control-measure-dialog"
import { SyncMeasuresButton } from "./sync-measures-button"
import { ControlMeasureCard } from "./control-measure-card"

interface ComplianceMeasuresTabProps {
  complianceId: string
  requirementId: string
  measureMode: "strict" | "flexible"
  requirement?: Requirement
}

export function ComplianceMeasuresTab({
  complianceId,
  requirementId,
  measureMode,
  requirement,
}: ComplianceMeasuresTabProps) {
  const [measures, setMeasures] = useState<ControlMeasure[]>([])
  const [suggestedTemplates, setSuggestedTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchMeasures = async () => {
    try {
      console.log("[v0] Fetching measures for compliance:", complianceId)
      const measuresRes = await fetch(
        `/api/compliance/${complianceId}/measures?includeEvidenceTypes=true&includeLinkedEvidence=true`,
      )

      if (!measuresRes.ok) {
        console.error("[v0] Failed to fetch measures:", measuresRes.status, measuresRes.statusText)
        setMeasures([])
        return
      }

      const measuresData = await measuresRes.json()
      console.log("[v0] Measures fetched:", measuresData)
      setMeasures(Array.isArray(measuresData) ? measuresData : measuresData.data || [])

      const templateIds = requirement?.suggestedControlMeasureTemplateIds || []
      console.log("[v0] Suggested template IDs from requirement:", templateIds)

      if (templateIds.length > 0) {
        const templatesRes = await fetch(`/api/control-templates?ids=${templateIds.join(",")}`)
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json()
          console.log("[v0] Loaded suggested templates:", templatesData)
          setSuggestedTemplates(Array.isArray(templatesData) ? templatesData : templatesData.data || [])
        } else {
          console.error("[v0] Failed to fetch templates:", templatesRes.status)
          setSuggestedTemplates([])
        }
      } else {
        setSuggestedTemplates([])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch measures:", error)
      setMeasures([])
      setSuggestedTemplates([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMeasures()
  }, [complianceId, requirementId, requirement])

  const filteredMeasures = Array.isArray(measures)
    ? measures.filter((m) => statusFilter === "all" || m.status === statusFilter)
    : []
  const completedCount = Array.isArray(measures)
    ? measures.filter((m) => m.status === "verified" || m.status === "implemented").length
    : 0

  const implementedTemplateIds = new Set(
    Array.isArray(measures) ? measures.filter((m) => m.templateId).map((m) => m.templateId) : [],
  )
  const unimplementedTemplates = Array.isArray(suggestedTemplates)
    ? suggestedTemplates.filter((t) => !implementedTemplateIds.has(t.id))
    : []

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      {/* Внедренные меры - НАВЕРХ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Внедренные меры защиты</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {completedCount} из {measures.length} мер выполнено • 
              {measures.reduce((sum, m) => sum + (m.linkedEvidenceCount || m.linkedEvidence?.length || 0), 0)} доказательств загружено
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Все меры" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все меры</SelectItem>
                <SelectItem value="planned">Запланировано</SelectItem>
                <SelectItem value="in_progress">В работе</SelectItem>
                <SelectItem value="implemented">Внедрено</SelectItem>
                <SelectItem value="verified">Проверено</SelectItem>
                <SelectItem value="failed">Не выполнено</SelectItem>
              </SelectContent>
            </Select>
            {measureMode === "flexible" && (
              <AddControlMeasureDialog
                complianceRecordId={complianceId}
                requirementId={requirementId}
                onSuccess={fetchMeasures}
              />
            )}
          </div>
        </div>

        {/* Info banner для strict режима */}
        {measureMode === "strict" && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-amber-900">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Строгий режим:</span>
                <span>Меры создаются из обязательных шаблонов и не могут быть изменены</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Список мер в виде cards */}
        {filteredMeasures.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Shield className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Меры еще не внедрены</p>
                {unimplementedTemplates.length > 0 && (
                  <p className="text-sm mt-2">Начните с внедрения рекомендуемых мер ниже</p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMeasures.map((measure, index) => (
              <ControlMeasureCard
                key={measure.id}
                measure={{ ...measure, complianceRecordId: complianceId }}
                onUpdate={fetchMeasures}
                measureMode={measureMode}
                complianceId={complianceId}
                requirementId={requirementId}
                evidenceTypeMode={requirement?.evidenceTypeMode || requirement?.evidence_type_mode || 'flexible'}
                allowedEvidenceTypeIds={measure.allowedEvidenceTypeIds || measure.allowed_evidence_type_ids || []}
              />
            ))}
          </div>
        )}
      </div>

      {/* Рекомендуемые меры для добавления - ВНИЗ (только в гибком режиме) */}
      {measureMode === "flexible" && suggestedTemplates.length > 0 && unimplementedTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Добавить рекомендуемые меры</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Гибкий режим: вы можете добавить рекомендуемые меры или создать свои собственные
                </p>
              </div>
              <SyncMeasuresButton complianceId={complianceId} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unimplementedTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{template.title}</div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    )}
                    {template.implementationGuide && (
                      <p className="text-xs text-muted-foreground mt-2">
                        <FileText className="inline h-3 w-3 mr-1" />
                        {template.implementationGuide}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleCreateFromTemplate(template.id)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Внедрить
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  async function handleCreateFromTemplate(templateId: string) {
    try {
      const response = await fetch(`/api/compliance/${complianceId}/measures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      })

      if (!response.ok) throw new Error("Failed to create measure")

      await fetchMeasures()
    } catch (error) {
      console.error("[v0] Failed to create measure from template:", error)
    }
  }
}
