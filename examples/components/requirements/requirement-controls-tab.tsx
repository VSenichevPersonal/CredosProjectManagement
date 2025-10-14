"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Shield, Trash2, Info } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RequirementControlsTabProps {
  requirementId: string
}

export function RequirementControlsTab({ requirementId }: RequirementControlsTabProps) {
  const [requirement, setRequirement] = useState<any>(null)
  const [recommendedControls, setRecommendedControls] = useState<any[]>([])
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([])
  const [evidenceTypes, setEvidenceTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [requirementId])

  const fetchData = async () => {
    try {
      console.log("[v0] [RequirementControlsTab] Fetching data for requirement:", requirementId)

      const [reqRes, controlsRes, templatesRes, evidenceTypesRes] = await Promise.all([
        fetch(`/api/requirements/${requirementId}`),
        fetch(`/api/requirements/${requirementId}/control-templates`),
        fetch("/api/dictionaries/control-measure-templates"),
        fetch("/api/dictionaries/evidence-types"),
      ])

      const reqData = await reqRes.json()
      const controlsData = await controlsRes.json()
      const templatesData = await templatesRes.json()
      const evidenceTypesData = await evidenceTypesRes.json()

      console.log("[v0] [RequirementControlsTab] Requirement data:", reqData.data)
      console.log("[v0] [RequirementControlsTab] Controls data:", controlsData.data)
      console.log("[v0] [RequirementControlsTab] Templates data:", templatesData.data)
      console.log("[v0] [RequirementControlsTab] Evidence types data:", evidenceTypesData)

      setRequirement(reqData.data)
      setRecommendedControls(controlsData.data || [])
      setAvailableTemplates(templatesData.data || [])
      setEvidenceTypes(Array.isArray(evidenceTypesData) ? evidenceTypesData : evidenceTypesData.data || [])
    } catch (error) {
      console.error("[v0] [RequirementControlsTab] Failed to fetch data:", error)
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить данные",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleModeChange = async (newMode: "strict" | "flexible") => {
    try {
      console.log("[v0] [RequirementControlsTab] Changing mode to:", newMode)

      const response = await fetch(`/api/requirements/${requirementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ measure_mode: newMode }),
      })

      if (!response.ok) throw new Error("Failed to update mode")

      const result = await response.json()
      console.log("[v0] [RequirementControlsTab] Mode updated:", result)

      toast({
        title: "Режим обновлен",
        description: `Режим исполнения по мерам изменен на ${newMode === "strict" ? "строгий" : "гибкий"}`,
      })

      await fetchData()
    } catch (error) {
      console.error("[v0] [RequirementControlsTab] Failed to update mode:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить режим",
        variant: "destructive",
      })
    }
  }

  const handleAddControl = async () => {
    if (!selectedTemplateId) return

    try {
      const response = await fetch(`/api/requirements/${requirementId}/control-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedTemplateId }),
      })

      if (!response.ok) throw new Error("Failed to add control")

      toast({
        title: "Мера добавлена",
        description: "Рекомендуемая мера успешно добавлена к требованию",
      })

      setShowAddDialog(false)
      setSelectedTemplateId("")
      await fetchData()
    } catch (error) {
      console.error("[v0] [RequirementControlsTab] Failed to add control:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось добавить меру",
        variant: "destructive",
      })
    }
  }

  const handleRemoveControl = async (templateId: string) => {
    try {
      const response = await fetch(`/api/requirements/${requirementId}/control-templates/${templateId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to remove control")

      toast({
        title: "Типовая мера удалена",
        description: "Типовая мера успешно удалена из требования",
      })

      await fetchData()
    } catch (error) {
      console.error("[v0] [RequirementControlsTab] Failed to remove control:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить типовую меру",
        variant: "destructive",
      })
    }
  }

  const getEvidenceTypeNames = (evidenceTypeIds: string[] | undefined) => {
    if (!evidenceTypeIds || evidenceTypeIds.length === 0) return []
    return evidenceTypeIds
      .map((id) => {
        const type = evidenceTypes.find((et) => et.id === id)
        return type?.title || type?.name
      })
      .filter(Boolean)
  }

  if (loading) {
    return <div className="text-center py-8">Загрузка рекомендуемых мер...</div>
  }

  const availableToAdd = availableTemplates.filter(
    (t) => !recommendedControls.some((rc) => rc.templateId === t.id || rc.template?.id === t.id),
  )

  const currentMode = requirement?.measureMode || requirement?.measure_mode || "flexible"

  console.log("[v0] [RequirementControlsTab] Current mode:", currentMode)
  console.log("[v0] [RequirementControlsTab] Requirement data:", requirement)
  console.log("[v0] [RequirementControlsTab] Available templates:", availableTemplates.length)
  console.log("[v0] [RequirementControlsTab] Available to add:", availableToAdd.length)

  return (
    <div className="flex flex-col gap-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <span className="font-medium">Текущий режим:</span>{" "}
          {currentMode === "strict" ? (
            <>
              <span className="font-semibold text-red-700">Строгий</span> - организации обязаны использовать только
              рекомендуемые типовые меры
            </>
          ) : (
            <>
              <span className="font-semibold text-green-700">Гибкий</span> - типовые меры предлагаются, но можно
              добавлять свои
            </>
          )}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Типовые меры защиты</CardTitle>
              <CardDescription>
                Типовые меры защиты, которые рекомендуются для выполнения данного требования. Каждая мера определяет,
                какие типы доказательств необходимы для подтверждения.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddDialog(true)} disabled={availableTemplates.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить типовую меру
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recommendedControls.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                К этому требованию еще не привязаны типовые меры защиты
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDialog(true)}
                disabled={availableTemplates.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                {availableTemplates.length === 0 ? "Нет доступных мер в справочнике" : "Добавить первую типовую меру"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendedControls.map((rc) => {
                const recommendedEvidenceTypes = getEvidenceTypeNames(
                  rc.template?.recommendedEvidenceTypeIds || rc.template?.recommended_evidence_type_ids,
                )

                return (
                  <Card key={rc.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-mono text-muted-foreground">{rc.template?.code}</span>
                            {rc.template?.category && <Badge variant="outline">{rc.template.category}</Badge>}
                            {rc.template?.measureType && <Badge variant="secondary">{rc.template.measureType}</Badge>}
                          </div>
                          <h4 className="font-semibold mb-1">{rc.template?.title || rc.template?.name}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{rc.template?.description}</p>

                          {recommendedEvidenceTypes.length > 0 && (
                            <div className="mt-3 p-3 bg-muted rounded-md">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Рекомендуемые типы доказательств:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {recommendedEvidenceTypes.map((typeName, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {typeName}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveControl(rc.templateId || rc.template?.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить типовую меру</DialogTitle>
            <DialogDescription>Выберите типовую меру защиты из справочника</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Мера защиты</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите меру" />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Все доступные меры уже добавлены
                    </div>
                  ) : (
                    availableToAdd.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.code} - {template.name || template.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleAddControl} disabled={!selectedTemplateId}>
                Добавить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
