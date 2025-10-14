/**
 * @intent: Control Template Card component
 * @llm-note: Displays single control template with actions
 */

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, Eye, Trash2, Edit } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { ControlTemplate } from "@/types/domain/control-template"
import { ViewControlTemplateDialog } from "./view-control-template-dialog"
import { EditControlTemplateDialog } from "./edit-control-template-dialog"

interface ControlTemplateCardProps {
  template: ControlTemplate
  onUpdate: () => void
}

export function ControlTemplateCard({ template, onUpdate }: ControlTemplateCardProps) {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить эту типовую меру?")) {
      return
    }

    try {
      const response = await fetch(`/api/control-templates/${template.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete template")
      }

      onUpdate()
    } catch (error) {
      console.error("[v0] Failed to delete template:", error)
      alert("Не удалось удалить типовую меру")
    }
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
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{template.code}</Badge>
                {template.isPublic && <Badge variant="secondary">Публичная</Badge>}
                {template.isAutomated && <Badge>Автоматизированная</Badge>}
              </div>
              <CardTitle className="text-lg">{template.title}</CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsViewDialogOpen(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Просмотр
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {template.description && <CardDescription className="line-clamp-2">{template.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Тип:</span>
              <span className="font-medium">{getTypeLabel(template.controlType)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Частота:</span>
              <span className="font-medium">{getFrequencyLabel(template.frequency)}</span>
            </div>
            {template.category && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Категория:</span>
                <span className="font-medium">{template.category}</span>
              </div>
            )}
            {template.estimatedImplementationDays && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Срок внедрения:</span>
                <span className="font-medium">~{template.estimatedImplementationDays} дней</span>
              </div>
            )}
            {template.validityPeriodMonths && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Срок действия:</span>
                <span className="font-medium">{template.validityPeriodMonths} мес</span>
              </div>
            )}
            {template.tags && template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ViewControlTemplateDialog template={template} open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} />

      <EditControlTemplateDialog
        template={template}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={onUpdate}
      />
    </>
  )
}
