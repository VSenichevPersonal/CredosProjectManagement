"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Plus, Eye } from "lucide-react"
import { ControlTypeBadge } from "@/components/controls/control-type-badge"
import { ControlFrequencyBadge } from "@/components/controls/control-frequency-badge"
import { ViewControlTemplateDialog } from "@/components/control-templates/view-control-template-dialog"
import type { ControlTemplate } from "@/types/domain/control-template"
import { useToast } from "@/hooks/use-toast"

interface RecommendedTemplatesSectionProps {
  requirementId: string
  onTemplateApplied?: () => void
}

export function RecommendedTemplatesSection({ requirementId, onTemplateApplied }: RecommendedTemplatesSectionProps) {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<ControlTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)
  const [viewTemplate, setViewTemplate] = useState<ControlTemplate | null>(null)

  useEffect(() => {
    fetchRecommendations()
  }, [requirementId])

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`/api/requirements/${requirementId}/templates`)
      const data = await response.json()
      setTemplates(data.data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch template recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyTemplate = async (templateId: string) => {
    setApplying(templateId)
    try {
      const response = await fetch(`/api/control-templates/${templateId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirementIds: [requirementId],
        }),
      })

      if (!response.ok) throw new Error("Failed to apply template")

      toast({
        title: "Мера создана",
        description: "Типовая мера успешно применена к требованию",
      })

      onTemplateApplied?.()
      fetchRecommendations()
    } catch (error) {
      console.error("[v0] Failed to apply template:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось применить типовую меру",
        variant: "destructive",
      })
    } finally {
      setApplying(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Загрузка рекомендаций...</div>
  }

  if (templates.length === 0) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <div>
              <CardTitle>Рекомендуемые типовые меры</CardTitle>
              <CardDescription>Проверенные меры защиты, которые помогут выполнить это требование</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {templates.map((template) => (
              <Card key={template.id} className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono text-muted-foreground">{template.code}</span>
                        <ControlTypeBadge type={template.controlType} />
                        <ControlFrequencyBadge frequency={template.frequency} />
                        {template.isAutomated && (
                          <Badge variant="outline" className="text-xs">
                            Автоматизирован
                          </Badge>
                        )}
                        {template.isRecommended && (
                          <Badge variant="default" className="text-xs bg-amber-500">
                            Рекомендуется
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold mb-1">{template.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                      {template.category && (
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setViewTemplate(template)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Подробнее
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApplyTemplate(template.id)}
                        disabled={applying === template.id}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {applying === template.id ? "Применение..." : "Применить"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {viewTemplate && (
        <ViewControlTemplateDialog
          template={viewTemplate}
          open={!!viewTemplate}
          onOpenChange={(open) => !open && setViewTemplate(null)}
        />
      )}
    </>
  )
}
