"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, CheckCircle2 } from "lucide-react"
import type { ControlMeasure } from "@/types/domain/control-measure"

interface LinkEvidenceToMeasuresDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  evidenceId: string
  evidenceName: string
  complianceId: string
  onSuccess: () => void
}

export function LinkEvidenceToMeasuresDialog({
  open,
  onOpenChange,
  evidenceId,
  evidenceName,
  complianceId,
  onSuccess,
}: LinkEvidenceToMeasuresDialogProps) {
  const [measures, setMeasures] = useState<ControlMeasure[]>([])
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>([])
  const [linkedMeasures, setLinkedMeasures] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      fetchMeasures()
      fetchLinkedMeasures()
    }
  }, [open, complianceId, evidenceId])

  const fetchMeasures = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/compliance/${complianceId}/measures`)
      const data = await response.json()
      setMeasures(data.data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch measures:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLinkedMeasures = async () => {
    try {
      const response = await fetch(`/api/evidence/${evidenceId}/measures`)
      const data = await response.json()
      const linked = data.data?.map((link: any) => link.controlMeasureId) || []
      setLinkedMeasures(linked)
      setSelectedMeasures(linked)
    } catch (error) {
      console.error("[v0] Failed to fetch linked measures:", error)
    }
  }

  const handleToggleMeasure = (measureId: string) => {
    setSelectedMeasures((prev) =>
      prev.includes(measureId) ? prev.filter((id) => id !== measureId) : [...prev, measureId],
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Unlink removed measures
      const toUnlink = linkedMeasures.filter((id) => !selectedMeasures.includes(id))
      await Promise.all(
        toUnlink.map((measureId) =>
          fetch(`/api/evidence/${evidenceId}/measures?measureId=${measureId}`, {
            method: "DELETE",
          }),
        ),
      )

      // Link new measures
      const toLink = selectedMeasures.filter((id) => !linkedMeasures.includes(id))
      if (toLink.length > 0) {
        await fetch(`/api/evidence/${evidenceId}/measures`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ measureIds: toLink, relevanceScore: 5 }),
        })
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Failed to save measure links:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Связать доказательство с мерами</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Выберите меры, которые подтверждает доказательство: <strong>{evidenceName}</strong>
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Загрузка мер...</div>
          ) : measures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Меры еще не созданы</p>
            </div>
          ) : (
            <div className="space-y-3">
              {measures.map((measure) => {
                const isSelected = selectedMeasures.includes(measure.id)
                const wasLinked = linkedMeasures.includes(measure.id)

                return (
                  <div
                    key={measure.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-primary/5 border-primary" : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleToggleMeasure(measure.id)}
                  >
                    <Checkbox checked={isSelected} onCheckedChange={() => handleToggleMeasure(measure.id)} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="cursor-pointer font-medium">{measure.title}</Label>
                        {wasLinked && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Связано
                          </Badge>
                        )}
                      </div>
                      {measure.description && <p className="text-sm text-muted-foreground">{measure.description}</p>}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {measure.status}
                        </Badge>
                        {measure.fromTemplate && (
                          <Badge variant="outline" className="text-xs">
                            Из шаблона
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
