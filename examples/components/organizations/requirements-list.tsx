"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Minus, RotateCcw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Requirement {
  id: string
  code: string
  name: string
  mappingType: "automatic" | "manual_include" | "manual_exclude"
  reason?: string
  regulatoryFramework?: string
  criticality?: string
}

interface RequirementsListProps {
  requirements: Requirement[]
  totalRequirements: number
  onManualAction: (requirementId: string, action: "remove" | "exclude", reason?: string) => Promise<void>
}

export function RequirementsList({ requirements, totalRequirements, onManualAction }: RequirementsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null)
  const [reason, setReason] = useState("")

  const filteredReqs = requirements.filter(
    (req) =>
      req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.code.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getMappingBadge = (mappingType: string) => {
    switch (mappingType) {
      case "automatic":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Автоматически
          </Badge>
        )
      case "manual_include":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Добавлено вручную
          </Badge>
        )
      case "manual_exclude":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Исключено вручную
          </Badge>
        )
      default:
        return null
    }
  }

  const getCriticalityBadge = (criticality?: string) => {
    if (!criticality) return null

    const colors = {
      critical: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-green-100 text-green-800 border-green-200",
    }

    const labels = {
      critical: "Критическая",
      high: "Высокая",
      medium: "Средняя",
      low: "Низкая",
    }

    return (
      <Badge variant="outline" className={colors[criticality as keyof typeof colors]}>
        {labels[criticality as keyof typeof labels]}
      </Badge>
    )
  }

  const handleOpenDialog = (req: Requirement) => {
    setSelectedReq(req)
    setReason("")
    setDialogOpen(true)
  }

  const handleExclude = async () => {
    if (!selectedReq) return
    await onManualAction(selectedReq.id, "exclude", reason)
    setDialogOpen(false)
    setSelectedReq(null)
    setReason("")
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Поиск требований..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          Показано {filteredReqs.length} из {requirements.length} применимых требований (всего {totalRequirements})
        </div>
      </div>

      {/* Requirements List */}
      <div className="grid gap-3">
        {filteredReqs.map((req) => (
          <Card key={req.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{req.code}</code>
                  <h4 className="font-medium truncate">{req.name}</h4>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {getMappingBadge(req.mappingType)}
                  {getCriticalityBadge(req.criticality)}
                  {req.regulatoryFramework && (
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                      {req.regulatoryFramework}
                    </Badge>
                  )}
                </div>
                {req.reason && <p className="text-sm text-muted-foreground mt-2">Причина: {req.reason}</p>}
              </div>

              <div className="flex items-center gap-2">
                {req.mappingType === "automatic" && (
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(req)}>
                    <Minus className="mr-2 h-4 w-4" />
                    Исключить
                  </Button>
                )}
                {req.mappingType === "manual_include" && (
                  <Button variant="outline" size="sm" onClick={() => onManualAction(req.id, "remove")}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Отменить
                  </Button>
                )}
                {req.mappingType === "manual_exclude" && (
                  <Button variant="outline" size="sm" onClick={() => onManualAction(req.id, "remove")}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Вернуть
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredReqs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-lg font-medium">Требования не найдены</p>
          <p className="text-sm text-muted-foreground">Попробуйте изменить поисковый запрос или добавьте требования</p>
        </div>
      )}

      {/* Dialog for excluding requirement */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Исключить требование</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div>
              <Label>Требование</Label>
              <p className="text-sm font-medium mt-1">
                {selectedReq?.code} - {selectedReq?.name}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="reason">Причина исключения</Label>
              <Textarea
                id="reason"
                placeholder="Укажите причину исключения требования..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleExclude}>Исключить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
