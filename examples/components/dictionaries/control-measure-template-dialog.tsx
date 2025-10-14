"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import type { ControlMeasureTemplate } from "@/types/domain/control-measure"

const templateSchema = z.object({
  code: z.string().min(1, "Код обязателен"),
  name: z.string().min(1, "Название обязательно"),
  description: z.string().optional(),
  category: z.string().optional(),
  measureType: z.enum(["preventive", "detective", "corrective", "compensating"]),
  implementationGuide: z.string().optional(),
  estimatedEffort: z.string().optional(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
})

type TemplateFormData = z.infer<typeof templateSchema>

interface ControlMeasureTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: ControlMeasureTemplate | null
  onSuccess: () => void
}

export function ControlMeasureTemplateDialog({
  open,
  onOpenChange,
  template,
  onSuccess,
}: ControlMeasureTemplateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: template
      ? {
          code: template.code,
          name: template.name,
          description: template.description || "",
          category: template.category || "",
          measureType: template.measureType,
          implementationGuide: template.implementationGuide || "",
          estimatedEffort: template.estimatedEffort || "",
          sortOrder: template.sortOrder,
          isActive: template.isActive,
        }
      : {
          code: "",
          name: "",
          description: "",
          category: "",
          measureType: "preventive",
          implementationGuide: "",
          estimatedEffort: "",
          sortOrder: 0,
          isActive: true,
        },
  })

  const onSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true)

    try {
      const url = template
        ? `/api/dictionaries/control-measure-templates/${template.id}`
        : "/api/dictionaries/control-measure-templates"

      const response = await fetch(url, {
        method: template ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Не удалось сохранить шаблон меры")
      }

      toast({
        title: template ? "Шаблон меры обновлён" : "Шаблон меры создан",
        description: template ? "Изменения успешно сохранены" : "Новый шаблон меры успешно добавлен в справочник",
      })

      reset()
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Failed to save control measure template:", error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить шаблон меры",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Редактировать шаблон меры" : "Создать шаблон меры"}</DialogTitle>
          <DialogDescription>
            {template ? "Внесите изменения в шаблон меры контроля" : "Добавьте новый шаблон меры контроля в справочник"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Код *</Label>
              <Input id="code" {...register("code")} placeholder="МЗ-001" />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="measureType">Тип меры *</Label>
              <Select value={watch("measureType")} onValueChange={(value) => setValue("measureType", value as any)}>
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
              {errors.measureType && <p className="text-sm text-destructive">{errors.measureType.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Название *</Label>
            <Input id="name" {...register("name")} placeholder="Контроль доступа к серверам" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Подробное описание меры контроля"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Категория</Label>
            <Input id="category" {...register("category")} placeholder="Управление доступом" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="implementationGuide">Руководство по внедрению</Label>
            <Textarea
              id="implementationGuide"
              {...register("implementationGuide")}
              placeholder="Инструкции по внедрению меры"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedEffort">Оценка трудозатрат</Label>
              <Input id="estimatedEffort" {...register("estimatedEffort")} placeholder="2-4 недели" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Порядок сортировки</Label>
              <Input id="sortOrder" type="number" {...register("sortOrder", { valueAsNumber: true })} placeholder="0" />
              {errors.sortOrder && <p className="text-sm text-destructive">{errors.sortOrder.message}</p>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={watch("isActive")}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
            <Label htmlFor="isActive">Активен</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Сохранение..." : template ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
