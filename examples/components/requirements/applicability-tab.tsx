"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FilterBuilder } from "./filter-builder"
import { OrganizationsList } from "./organizations-list"
import { ComplianceRecordsList } from "./compliance-records-list"
import { Save, RefreshCw, FileCheck, Eye } from "lucide-react"
import { CreateComplianceRecordsDialog } from "./create-compliance-records-dialog"
import type { ApplicabilityFilterRules, ApplicabilityResult } from "@/types/domain/applicability"

interface ApplicabilityTabProps {
  requirementId: string
}

export function ApplicabilityTab({ requirementId }: ApplicabilityTabProps) {
  const [result, setResult] = useState<ApplicabilityResult | null>(null)
  const [filterRules, setFilterRules] = useState<ApplicabilityFilterRules>({})
  const [previewResult, setPreviewResult] = useState<ApplicabilityResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [requirementCode, setRequirementCode] = useState("")
  const [complianceRecordsCount, setComplianceRecordsCount] = useState(0)
  const [complianceStats, setComplianceStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    approved: 0,
    rejected: 0,
  })

  useEffect(() => {
    fetchApplicability()
    fetchRequirementCode()
    fetchComplianceRecordsCount()
  }, [requirementId])

  const fetchApplicability = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Fetching applicability for requirement:", requirementId)

      const resultResponse = await fetch(`/api/requirements/${requirementId}/applicability/organizations`)
      console.log("[v0] Applicability response status:", resultResponse.status)

      if (resultResponse.ok) {
        const data = await resultResponse.json()
        console.log("[v0] Applicability data received:", {
          applicableOrganizations: data.applicableOrganizations,
          totalOrganizations: data.totalOrganizations,
          organizationsCount: data.organizations?.length || 0,
        })
        setResult(data)
      } else if (resultResponse.status === 404) {
        console.log("[v0] No applicability rules found, setting default state")
        setResult({
          applicableOrganizations: 0,
          automaticCount: 0,
          manualIncludeCount: 0,
          manualExcludeCount: 0,
          totalOrganizations: 0,
          organizations: [],
        })
      }

      const rulesResponse = await fetch(`/api/requirements/${requirementId}/applicability`)
      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json()
        console.log("[v0] Filter rules loaded:", rulesData.filterRules)
        setFilterRules(rulesData.filterRules || {})
      } else {
        console.log("[v0] No filter rules found, using empty rules")
        setFilterRules({})
      }
    } catch (error) {
      console.error("[v0] Failed to fetch applicability:", error)
      setResult({
        applicableOrganizations: 0,
        automaticCount: 0,
        manualIncludeCount: 0,
        manualExcludeCount: 0,
        totalOrganizations: 0,
        organizations: [],
      })
      setFilterRules({})
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRequirementCode = async () => {
    try {
      const response = await fetch(`/api/requirements/${requirementId}`)
      if (response.ok) {
        const data = await response.json()
        setRequirementCode(data.data?.code || "")
      }
    } catch (error) {
      console.error("Failed to fetch requirement code:", error)
    }
  }

  const fetchComplianceRecordsCount = async () => {
    try {
      const response = await fetch(`/api/compliance?requirementId=${requirementId}`)
      console.log("[v0] Fetching compliance records count, response:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Compliance records count data:", data)
        const recordsData = Array.isArray(data) ? data : data.data || []
        setComplianceRecordsCount(recordsData.length)

        const stats = {
          total: recordsData.length,
          pending: recordsData.filter((r: any) => r.status === "pending").length,
          in_progress: recordsData.filter((r: any) => r.status === "in_progress").length,
          completed: recordsData.filter((r: any) => r.status === "completed").length,
          approved: recordsData.filter((r: any) => r.status === "approved").length,
          rejected: recordsData.filter((r: any) => r.status === "rejected").length,
        }
        setComplianceStats(stats)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch compliance records count:", error)
    }
  }

  const handlePreview = async () => {
    setIsPreviewing(true)
    try {
      console.log("[v0] Previewing with filter rules:", filterRules)
      const response = await fetch(`/api/requirements/${requirementId}/applicability/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filterRules }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Preview result:", data)
        setPreviewResult(data)
      }
    } catch (error) {
      console.error("[v0] Failed to preview:", error)
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/requirements/${requirementId}/applicability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filterRules }),
      })
      const data = await response.json()
      await fetchApplicability()
      setPreviewResult(null) // Clear preview after save
    } catch (error) {
      console.error("Failed to save applicability:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleManualAction = async (
    organizationId: string,
    action: "include" | "exclude" | "remove",
    reason?: string,
  ) => {
    try {
      console.log("[v0] Manual action:", { organizationId, action, reason })
      const response = await fetch(`/api/requirements/${requirementId}/applicability/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, action, reason }),
      })

      if (!response.ok) {
        console.error("[v0] Manual action failed:", response.status, response.statusText)
        return
      }

      await fetchApplicability()
    } catch (error) {
      console.error("[v0] Failed to update manual mapping:", error)
    }
  }

  if (isLoading) {
    return <div>Загрузка...</div>
  }

  const displayResult = previewResult || result

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Применимость требования</h3>
          <div className="flex items-center gap-2">
            <Button variant="default" onClick={() => setShowCreateDialog(true)}>
              <FileCheck className="mr-2 h-4 w-4" />
              Создать записи соответствия
            </Button>
            <Button variant="outline" size="icon" onClick={fetchApplicability}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold">{displayResult?.applicableOrganizations || 0}</div>
            <div className="text-sm text-muted-foreground">Применимо к организациям</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold text-blue-600">{displayResult?.automaticCount || 0}</div>
            <div className="text-sm text-muted-foreground">Автоматически</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold text-green-600">{displayResult?.manualIncludeCount || 0}</div>
            <div className="text-sm text-muted-foreground">Добавлено вручную</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold text-red-600">{displayResult?.manualExcludeCount || 0}</div>
            <div className="text-sm text-muted-foreground">Исключено вручную</div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Статистика записей соответствия</h3>
        <div className="grid gap-4 md:grid-cols-6">
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold">{complianceStats.total}</div>
            <div className="text-sm text-muted-foreground">Всего записей</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold text-gray-600">{complianceStats.pending}</div>
            <div className="text-sm text-muted-foreground">Ожидают</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold text-blue-600">{complianceStats.in_progress}</div>
            <div className="text-sm text-muted-foreground">В работе</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold text-yellow-600">{complianceStats.completed}</div>
            <div className="text-sm text-muted-foreground">Завершены</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold text-green-600">{complianceStats.approved}</div>
            <div className="text-sm text-muted-foreground">Утверждены</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold text-red-600">{complianceStats.rejected}</div>
            <div className="text-sm text-muted-foreground">Отклонены</div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="automatic" className="w-full">
        <TabsList>
          <TabsTrigger value="automatic">Автоматические правила</TabsTrigger>
          <TabsTrigger value="organizations">Организации ({displayResult?.applicableOrganizations || 0})</TabsTrigger>
          <TabsTrigger value="compliance-records">Записи соответствия ({complianceRecordsCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="automatic" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Фильтры применимости</h3>
                <p className="text-sm text-muted-foreground">
                  Настройте правила для автоматического определения применимых организаций
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePreview} disabled={isPreviewing}>
                  <Eye className="mr-2 h-4 w-4" />
                  {isPreviewing ? "Загрузка..." : "Предпросмотр"}
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Сохранение..." : "Сохранить правила"}
                </Button>
              </div>
            </div>

            <FilterBuilder filterRules={filterRules} onChange={setFilterRules} />

            <div
              className={`mt-6 rounded-lg border p-4 ${previewResult ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}`}
            >
              <h4 className={`font-medium text-sm mb-2 ${previewResult ? "text-green-900" : "text-blue-900"}`}>
                {previewResult ? "Результат предпросмотра" : "Текущее состояние"}
              </h4>
              <p className={`text-sm ${previewResult ? "text-green-800" : "text-blue-800"}`}>
                С текущими фильтрами требование будет применимо к{" "}
                <span className="font-bold">{previewResult?.automaticCount || displayResult?.automaticCount || 0}</span>{" "}
                организациям автоматически
              </p>
              {previewResult && (
                <p className="text-xs text-green-700 mt-2">Нажмите "Сохранить правила" чтобы применить изменения</p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="mt-6">
          <OrganizationsList
            organizations={displayResult?.organizations || []}
            totalOrganizations={displayResult?.totalOrganizations || 0}
            onManualAction={handleManualAction}
          />
        </TabsContent>

        <TabsContent value="compliance-records" className="mt-6">
          <ComplianceRecordsList
            requirementId={requirementId}
            onUpdate={() => {
              fetchComplianceRecordsCount()
              fetchApplicability()
            }}
          />
        </TabsContent>
      </Tabs>

      <CreateComplianceRecordsDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        requirementId={requirementId}
        requirementCode={requirementCode}
        organizations={displayResult?.organizations || []}
        onSuccess={() => {
          fetchApplicability()
          fetchComplianceRecordsCount()
        }}
      />
    </div>
  )
}
