"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import type { ComplianceStatus } from "@/types/domain/compliance"
import {
  getAvailableTransitions,
  COMPLIANCE_STATUS_CONFIG,
  type WorkflowTransition,
} from "@/lib/workflow/compliance-workflow"
import {
  Circle,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  FileText,
  MessageSquare,
} from "lucide-react"

interface WorkflowStatusCardProps {
  complianceId: string
  currentStatus: ComplianceStatus
  onStatusChange?: () => void
}

const iconMap = {
  circle: Circle,
  clock: Clock,
  eye: Eye,
  "check-circle": CheckCircle2,
  "x-circle": XCircle,
  "alert-circle": AlertCircle,
}

export function WorkflowStatusCard({ complianceId, currentStatus, onStatusChange }: WorkflowStatusCardProps) {
  const { toast } = useToast()
  const [selectedTransition, setSelectedTransition] = useState<WorkflowTransition | null>(null)
  const [comment, setComment] = useState("")
  const [updating, setUpdating] = useState(false)

  const availableTransitions = getAvailableTransitions(currentStatus)
  const statusConfig = COMPLIANCE_STATUS_CONFIG[currentStatus]
  const StatusIcon = iconMap[statusConfig.icon as keyof typeof iconMap] || Circle

  const handleTransitionClick = (transition: WorkflowTransition) => {
    setSelectedTransition(transition)
    setComment("")
  }

  const handleConfirmTransition = async () => {
    if (!selectedTransition) return

    if (selectedTransition.requiresComment && !comment.trim()) {
      toast({
        title: "Требуется комментарий",
        description: "Пожалуйста, укажите причину изменения статуса",
        variant: "destructive",
      })
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/compliance/${complianceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedTransition.to,
          comments: comment || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      toast({
        title: "Статус обновлен",
        description: `Статус изменен на "${COMPLIANCE_STATUS_CONFIG[selectedTransition.to].label}"`,
      })

      setSelectedTransition(null)
      setComment("")
      onStatusChange?.()
    } catch (error) {
      console.error("Failed to update status:", error)
      toast({
        title: "Ошибка обновления",
        description: "Не удалось изменить статус",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 text-${statusConfig.color}-600`} />
            Текущий статус
          </CardTitle>
          <CardDescription>{statusConfig.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <Badge
              variant="outline"
              className={`text-${statusConfig.color}-600 border-${statusConfig.color}-600 px-4 py-2 text-base`}
            >
              {statusConfig.label}
            </Badge>
          </div>

          {availableTransitions.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Доступные действия:</Label>
              <div className="grid gap-2">
                {availableTransitions.map((transition) => {
                  const targetConfig = COMPLIANCE_STATUS_CONFIG[transition.to]
                  const TargetIcon = iconMap[targetConfig.icon as keyof typeof iconMap] || Circle

                  return (
                    <Button
                      key={`${transition.from}-${transition.to}`}
                      variant="outline"
                      className="justify-start h-auto py-3 bg-transparent"
                      onClick={() => handleTransitionClick(transition)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <TargetIcon className={`h-4 w-4 text-${transition.color}-600 flex-shrink-0`} />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{transition.label}</div>
                          {(transition.requiresComment || transition.requiresEvidence) && (
                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                              {transition.requiresComment && (
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  Требуется комментарий
                                </span>
                              )}
                              {transition.requiresEvidence && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Требуются доказательства
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {availableTransitions.length === 0 && (
            <p className="text-sm text-muted-foreground">Нет доступных действий для текущего статуса</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={selectedTransition !== null} onOpenChange={() => setSelectedTransition(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение изменения статуса</DialogTitle>
            <DialogDescription>
              {selectedTransition && (
                <>
                  Вы собираетесь изменить статус на "
                  <strong>{COMPLIANCE_STATUS_CONFIG[selectedTransition.to].label}</strong>"
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedTransition?.requiresComment && (
            <div className="space-y-2">
              <Label htmlFor="comment">
                Комментарий <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="comment"
                placeholder="Укажите причину изменения статуса..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {selectedTransition?.requiresEvidence && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Внимание:</strong> Перед отправкой на проверку убедитесь, что загружены все необходимые
                доказательства выполнения требования.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTransition(null)} disabled={updating}>
              Отмена
            </Button>
            <Button onClick={handleConfirmTransition} disabled={updating}>
              {updating ? "Обновление..." : "Подтвердить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
