/**
 * @intent: Dialog for editing control template
 * @llm-note: Form for updating existing control template
 */

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { ControlTemplate, UpdateControlTemplateDTO } from "@/types/domain/control-template"

interface EditControlTemplateDialogProps {
  template: ControlTemplate
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditControlTemplateDialog({ template, open, onOpenChange, onSuccess }: EditControlTemplateDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<UpdateControlTemplateDTO>({})

  useEffect(() => {
    if (open) {
      setFormData({
        title: template.title,
        description: template.description || undefined,
        controlType: template.controlType,
        category: template.category || undefined,
        frequency: template.frequency,
        isAutomated: template.isAutomated,
        estimatedImplementationDays: template.estimatedImplementationDays || undefined,
        validityPeriodMonths: template.validityPeriodMonths || undefined,
        implementationGuide: template.implementationGuide || undefined,
        testingProcedure: template.testingProcedure || undefined,
        isPublic: template.isPublic,
      })
    }
  }, [open, template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/control-templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to update template")
      }

      toast({
        title: "✅ Изменения сохранены",
        description: `Типовая мера "${template.code}" успешно обновлена`,
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Failed to update template:", error)
      toast({
        title: "❌ Ошибка сохранения",
        description: "Не удалось обновить типовую меру. Попробуйте еще раз.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать типовую меру</DialogTitle>
          <DialogDescription>Обновите информацию о типовой мере защиты</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название *</Label>
            <Input
              id="title"
              required
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="controlType">Тип меры *</Label>
              <Select
                value={formData.controlType}
                onValueChange={(value: any) => setFormData({ ...formData, controlType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Превентивная</SelectItem>
                  <SelectItem value="detective">Детективная</SelectItem>
                  <SelectItem value="corrective">Корректирующая</SelectItem>
                  <SelectItem value="compensating">Компенсирующая</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Частота выполнения *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="continuous">Непрерывно</SelectItem>
                  <SelectItem value="daily">Ежедневно</SelectItem>
                  <SelectItem value="weekly">Еженедельно</SelectItem>
                  <SelectItem value="monthly">Ежемесячно</SelectItem>
                  <SelectItem value="quarterly">Ежеквартально</SelectItem>
                  <SelectItem value="annually">Ежегодно</SelectItem>
                  <SelectItem value="on_demand">По требованию</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Категория</Label>
            <Input
              id="category"
              value={formData.category || ""}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="estimatedImplementationDays">Срок внедрения (дней)</Label>
              <Input
                id="estimatedImplementationDays"
                type="number"
                min="1"
                value={formData.estimatedImplementationDays || ""}
                onChange={(e) => setFormData({ ...formData, estimatedImplementationDays: parseInt(e.target.value) || undefined })}
                placeholder="30, 60, 90..."
              />
              <p className="text-xs text-muted-foreground">Примерный срок для внедрения меры</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validityPeriodMonths">Срок действия (месяцев)</Label>
              <Input
                id="validityPeriodMonths"
                type="number"
                min="1"
                value={formData.validityPeriodMonths || ""}
                onChange={(e) => setFormData({ ...formData, validityPeriodMonths: parseInt(e.target.value) || undefined })}
                placeholder="12, 24, 36..."
              />
              <p className="text-xs text-muted-foreground">Срок до обязательного пересмотра</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="implementationGuide">Руководство по внедрению</Label>
            <Textarea
              id="implementationGuide"
              value={formData.implementationGuide || ""}
              onChange={(e) => setFormData({ ...formData, implementationGuide: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="testingProcedure">Процедура тестирования</Label>
            <Textarea
              id="testingProcedure"
              value={formData.testingProcedure || ""}
              onChange={(e) => setFormData({ ...formData, testingProcedure: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isAutomated">Автоматизированная мера</Label>
              <p className="text-sm text-muted-foreground">Мера выполняется автоматически</p>
            </div>
            <Switch
              id="isAutomated"
              checked={formData.isAutomated}
              onCheckedChange={(checked) => setFormData({ ...formData, isAutomated: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isPublic">Публичная мера</Label>
              <p className="text-sm text-muted-foreground">Доступна всем пользователям системы</p>
            </div>
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
