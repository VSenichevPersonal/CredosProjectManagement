/**
 * @intent: Dialog for viewing control template details
 * @llm-note: Read-only view of control template with all details
 */

"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import type { ControlTemplate } from "@/types/domain/control-template"

interface ViewControlTemplateDialogProps {
  template: ControlTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewControlTemplateDialog({ template, open, onOpenChange }: ViewControlTemplateDialogProps) {
  if (!template) {
    return null
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      preventive: "Превентивная",
      detective: "Детективная",
      corrective: "Корректирующая",
      compensating: "Компенсирующая",
    }
    return labels[type] || type
  }

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      continuous: "Непрерывно",
      daily: "Ежедневно",
      weekly: "Еженедельно",
      monthly: "Ежемесячно",
      quarterly: "Ежеквартально",
      annually: "Ежегодно",
      on_demand: "По требованию",
    }
    return labels[frequency] || frequency
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{template.title}</span>
            <Badge variant="outline">{template.code}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge>{getTypeLabel(template.controlType)}</Badge>
            <Badge variant="secondary">{getFrequencyLabel(template.frequency)}</Badge>
            {template.isAutomated && <Badge variant="outline">Автоматизированная</Badge>}
            {template.isPublic && <Badge variant="outline">Публичная</Badge>}
          </div>

          {template.description && (
            <div className="space-y-2">
              <Label>Описание</Label>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
          )}

          {template.category && (
            <div className="space-y-2">
              <Label>Категория</Label>
              <p className="text-sm">{template.category}</p>
            </div>
          )}

          {(template.estimatedImplementationDays || template.validityPeriodMonths) && (
            <div className="grid gap-4 md:grid-cols-2">
              {template.estimatedImplementationDays && (
                <div className="space-y-2">
                  <Label>Срок внедрения</Label>
                  <p className="text-sm font-medium">~{template.estimatedImplementationDays} дней</p>
                  <p className="text-xs text-muted-foreground">Примерный срок для внедрения меры</p>
                </div>
              )}

              {template.validityPeriodMonths && (
                <div className="space-y-2">
                  <Label>Срок действия</Label>
                  <p className="text-sm font-medium">{template.validityPeriodMonths} месяцев</p>
                  <p className="text-xs text-muted-foreground">До обязательного пересмотра</p>
                </div>
              )}
            </div>
          )}

          {template.implementationGuide && (
            <div className="space-y-2">
              <Label>Руководство по внедрению</Label>
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm whitespace-pre-wrap">{template.implementationGuide}</p>
              </div>
            </div>
          )}

          {template.testingProcedure && (
            <div className="space-y-2">
              <Label>Процедура тестирования</Label>
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm whitespace-pre-wrap">{template.testingProcedure}</p>
              </div>
            </div>
          )}

          {template.tags && template.tags.length > 0 && (
            <div className="space-y-2">
              <Label>Теги</Label>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <Label className="text-muted-foreground">Создано</Label>
              <p>{new Date(template.createdAt).toLocaleDateString("ru-RU")}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Обновлено</Label>
              <p>{new Date(template.updatedAt).toLocaleDateString("ru-RU")}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
