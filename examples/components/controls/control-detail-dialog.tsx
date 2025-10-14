"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Shield, TestTube, Plus } from "lucide-react"
import { ControlTypeBadge } from "./control-type-badge"
import { ControlFrequencyBadge } from "./control-frequency-badge"

interface ControlDetailDialogProps {
  controlId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ControlDetailDialog({ controlId, open, onOpenChange }: ControlDetailDialogProps) {
  const [control, setControl] = useState<any>(null)
  const [requirements, setRequirements] = useState<any[]>([])
  const [evidence, setEvidence] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && controlId) {
      fetchControlDetails()
    }
  }, [open, controlId])

  const fetchControlDetails = async () => {
    try {
      // Fetch control details
      const controlRes = await fetch(`/api/controls/${controlId}`)
      const controlData = await controlRes.json()
      setControl(controlData.data)

      // Fetch linked requirements
      const reqRes = await fetch(`/api/controls/${controlId}/requirements`)
      const reqData = await reqRes.json()
      setRequirements(reqData.data || [])

      // Fetch linked evidence
      const evidenceRes = await fetch(`/api/controls/${controlId}/evidence`)
      const evidenceData = await evidenceRes.json()
      setEvidence(evidenceData.data || [])
    } catch (error) {
      console.error("Failed to fetch control details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !control) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="text-center py-8">Загрузка...</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-muted-foreground">{control.code}</span>
            <ControlTypeBadge type={control.controlType} />
            <ControlFrequencyBadge frequency={control.frequency} />
            {control.isAutomated && (
              <Badge variant="outline" className="text-xs">
                Автоматизирован
              </Badge>
            )}
          </div>
          <DialogTitle>{control.title}</DialogTitle>
          <DialogDescription>{control.description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="requirements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requirements">
              <Shield className="h-4 w-4 mr-2" />
              Требования ({requirements.length})
            </TabsTrigger>
            <TabsTrigger value="evidence">
              <FileText className="h-4 w-4 mr-2" />
              Доказательства ({evidence.length})
            </TabsTrigger>
            <TabsTrigger value="tests">
              <TestTube className="h-4 w-4 mr-2" />
              Тесты
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requirements" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Связанные требования</CardTitle>
                    <CardDescription>Требования, которые закрывает эта мера защиты</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить требование
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {requirements.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    К этой мере еще не привязаны требования
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requirements.map((req) => (
                      <Card key={req.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-muted-foreground">{req.requirement?.code}</span>
                                <Badge variant="outline" className="text-xs">
                                  {req.mappingType === "direct"
                                    ? "Прямой"
                                    : req.mappingType === "indirect"
                                      ? "Косвенный"
                                      : "Частичный"}
                                </Badge>
                                {req.coveragePercentage && (
                                  <Badge variant="secondary" className="text-xs">
                                    Покрытие: {req.coveragePercentage}%
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium text-sm">{req.requirement?.title}</h4>
                              {req.mappingNotes && (
                                <p className="text-xs text-muted-foreground mt-1 italic">{req.mappingNotes}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidence" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Доказательства выполнения</CardTitle>
                    <CardDescription>Документы и файлы, подтверждающие выполнение меры</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить доказательство
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {evidence.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    К этой мере еще не привязаны доказательства
                  </div>
                ) : (
                  <div className="space-y-3">
                    {evidence.map((ev) => (
                      <Card key={ev.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm mb-1">{ev.evidence?.title}</h4>
                              <p className="text-xs text-muted-foreground">{ev.evidence?.description}</p>
                              {ev.notes && <p className="text-xs text-muted-foreground mt-2 italic">{ev.notes}</p>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>История тестирования</CardTitle>
                <CardDescription>Результаты проверок эффективности меры защиты</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Функционал тестирования в разработке
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
