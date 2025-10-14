"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { RequirementModeBadge } from "@/components/compliance/requirement-mode-badge"
import { UpdateStatusDialog } from "@/components/compliance/update-status-dialog"
import { ComplianceMeasuresTab } from "@/components/compliance/compliance-measures-tab"
import { ComplianceEvidenceTab } from "@/components/compliance/compliance-evidence-tab"
import { ComplianceHistoryTab } from "@/components/compliance/compliance-history-tab"
import { WorkflowTimeline } from "@/components/compliance/workflow-timeline"
import { StatusBadge } from "@/components/ui/status-badge"
import { CriticalityBadge } from "@/components/ui/criticality-badge"
import { RequirementCode } from "@/components/ui/requirement-code"
import { Building2, Calendar, User, FileText, Shield, ArrowLeft } from "lucide-react"
import { formatDate } from "@/lib/utils/date"
import Link from "next/link"
import type { Compliance } from "@/types/domain/compliance"
import { EvidenceLinksTable } from "@/components/evidence/evidence-links-table"

interface ComplianceDetailClientProps {
  compliance: Compliance & {
    requirement: any
    organization: any
    assignedTo?: any
  }
}

interface ProgressData {
  progress: number
  measures: {
    total: number
    completed: number
  }
  evidence: {
    total: number
    linked: number
  }
}

export function ComplianceDetailClient({ compliance }: ComplianceDetailClientProps) {
  const [activeTab, setActiveTab] = useState("general")
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [isLoadingProgress, setIsLoadingProgress] = useState(true)

  const measureMode = compliance.requirement.measureMode || "flexible"

  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch(`/api/compliance/${compliance.id}/progress`)
        if (response.ok) {
          const data = await response.json()
          setProgressData(data)
        }
      } catch (error) {
        console.error("Failed to fetch progress:", error)
      } finally {
        setIsLoadingProgress(false)
      }
    }

    fetchProgress()
  }, [compliance.id])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/compliance">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Запись соответствия</h1>
            
            {/* Организация */}
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{compliance.organization.name}</span>
            </div>

            {/* Требование */}
            <div className="flex items-center gap-2">
              <RequirementCode code={compliance.requirement.code} />
              <span className="text-base">{compliance.requirement.title}</span>
            </div>

            {/* Нормативный акт (если есть) */}
            {(compliance.requirement.regulatoryFramework || compliance.requirement.regulatoryDocument) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>
                  {compliance.requirement.regulatoryDocument 
                    ? `${compliance.requirement.regulatoryDocument.number || ''} ${compliance.requirement.regulatoryDocument.title || ''}`.trim()
                    : compliance.requirement.regulatoryFramework?.name}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Кнопка "Загрузить доказательство" убрана - теперь доказательства загружаются к конкретным мерам */}
          <UpdateStatusDialog complianceId={compliance.id} currentStatus={compliance.status} />
        </div>
      </div>

      {/* Progress Bar and Mode Badges */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium">Прогресс выполнения</div>
                <div className="text-2xl font-bold">
                  {isLoadingProgress ? "..." : `${progressData?.progress || 0}%`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RequirementModeBadge mode={measureMode} type="measure" />
                <RequirementModeBadge 
                  mode={compliance.requirement.evidenceTypeMode || "flexible"} 
                  type="evidence" 
                />
              </div>
            </div>
            <Progress value={progressData?.progress || 0} className="h-3" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Меры: {progressData?.measures.completed || 0} из {progressData?.measures.total || 0} выполнено
              </span>
              <span>
                Доказательства: {progressData?.evidence.linked || 0} из {progressData?.evidence.total || 0} связано
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full grid grid-cols-4 h-12">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Общее
          </TabsTrigger>
          <TabsTrigger value="measures" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Меры
          </TabsTrigger>
          <TabsTrigger value="evidence" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Доказательства
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            История
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Информация о требовании</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <RequirementCode code={compliance.requirement.code} />
                  <h3 className="font-semibold mt-2">{compliance.requirement.title}</h3>
                  {compliance.requirement.description && (
                    <p className="text-sm text-muted-foreground mt-2">{compliance.requirement.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <CriticalityBadge level={compliance.requirement.criticalityLevel} />
                  {compliance.requirement.deadline && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Срок: {formatDate(compliance.requirement.deadline)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Статус выполнения</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Текущий статус</div>
                  <StatusBadge status={compliance.status} />
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Организация</div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{compliance.organization.name}</span>
                  </div>
                </div>

                {compliance.assignedTo && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Ответственный</div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{compliance.assignedTo.fullName}</span>
                    </div>
                  </div>
                )}

                {compliance.comments && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Комментарий</div>
                    <p className="text-sm">{compliance.comments}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <WorkflowTimeline currentStatus={compliance.status} />
        </TabsContent>

        {/* Measures Tab */}
        <TabsContent value="measures">
          <ComplianceMeasuresTab
            complianceId={compliance.id}
            requirementId={compliance.requirement.id}
            measureMode={measureMode}
            requirement={compliance.requirement}
          />
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence">
          <div className="space-y-6">
            <ComplianceEvidenceTab complianceId={compliance.id} requirement={compliance.requirement} />
            <Card>
              <CardHeader>
                <CardTitle>Связи доказательств с мерами</CardTitle>
              </CardHeader>
              <CardContent>
                <EvidenceLinksTable complianceId={compliance.id} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <ComplianceHistoryTab complianceId={compliance.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
