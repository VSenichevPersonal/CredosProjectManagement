"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, FileText, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface LegalArticle {
  id: string
  fullReference: string
  title?: string
  articleNumber?: string
  part?: string
  paragraph?: string
  clause?: string
}

interface LegalReference {
  id: string
  legalArticleId: string
  isPrimary: boolean
  relevanceNote?: string
  legalArticle?: LegalArticle
}

interface RegulatoryFramework {
  id: string
  name: string
  shortName?: string
}

interface RequirementLegalReferencesProps {
  requirementId: string
}

export function RequirementLegalReferences({ requirementId }: RequirementLegalReferencesProps) {
  const [references, setReferences] = useState<LegalReference[]>([])
  const [availableArticles, setAvailableArticles] = useState<LegalArticle[]>([])
  const [regulatoryFrameworks, setRegulatoryFrameworks] = useState<RegulatoryFramework[]>([])
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedArticleId, setSelectedArticleId] = useState<string>("")
  const [isPrimary, setIsPrimary] = useState(false)
  const [relevanceNote, setRelevanceNote] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchReferences()
    fetchRegulatoryFrameworks()
  }, [requirementId])

  useEffect(() => {
    if (selectedFrameworkId) {
      fetchAvailableArticles(selectedFrameworkId)
    } else {
      setAvailableArticles([])
    }
  }, [selectedFrameworkId])

  const fetchReferences = async () => {
    try {
      const response = await fetch(`/api/requirements/${requirementId}/legal-references`)
      if (response.ok) {
        const data = await response.json()
        setReferences(data.data || data)
      }
    } catch (error) {
      console.error("Failed to fetch legal references:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRegulatoryFrameworks = async () => {
    try {
      console.log("[v0] [LegalReferences] Fetching regulatory frameworks")
      const response = await fetch("/api/dictionaries/regulatory-frameworks")
      console.log("[v0] [LegalReferences] Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] [LegalReferences] Frameworks loaded:", data)
        setRegulatoryFrameworks(data.data || data)
      } else {
        const errorText = await response.text()
        console.error("[v0] [LegalReferences] Failed to fetch frameworks:", errorText)
        throw new Error("Failed to fetch frameworks")
      }
    } catch (error) {
      console.error("[v0] [LegalReferences] Failed to fetch regulatory frameworks:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить нормативные базы",
        variant: "destructive",
      })
    }
  }

  const fetchAvailableArticles = async (frameworkId: string) => {
    try {
      const response = await fetch(`/api/legal-articles?regulatory_framework_id=${frameworkId}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableArticles(data.data || data)
      }
    } catch (error) {
      console.error("Failed to fetch legal articles:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить статьи закона",
        variant: "destructive",
      })
    }
  }

  const handleAdd = async () => {
    console.log("[v0] [LegalReferences] handleAdd called", {
      selectedFrameworkId,
      selectedArticleId,
      isPrimary,
      relevanceNote,
    })

    if (!selectedFrameworkId) {
      console.log("[v0] [LegalReferences] No framework selected")
      toast({
        title: "Ошибка",
        description: "Выберите нормативную базу",
        variant: "destructive",
      })
      return
    }

    if (!selectedArticleId) {
      console.log("[v0] [LegalReferences] No article selected")
      toast({
        title: "Ошибка",
        description: "Выберите статью закона",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("[v0] [LegalReferences] Making API call to add reference")

      const response = await fetch(`/api/requirements/${requirementId}/legal-references`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalArticleId: selectedArticleId,
          isPrimary,
          relevanceNote: relevanceNote || undefined,
        }),
      })

      console.log("[v0] [LegalReferences] API response", { status: response.status, ok: response.ok })

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Нормативная ссылка добавлена",
        })
        setShowAddDialog(false)
        setSelectedFrameworkId("")
        setSelectedArticleId("")
        setIsPrimary(false)
        setRelevanceNote("")
        fetchReferences()
      } else {
        const errorData = await response.json().catch(() => null)
        console.error("[v0] [LegalReferences] API error", { status: response.status, errorData })
        throw new Error("Failed to add reference")
      }
    } catch (error) {
      console.error("[v0] [LegalReferences] Failed to add reference", error)
      toast({
        title: "Ошибка",
        description: "Не удалось добавить нормативную ссылку",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (referenceId: string) => {
    try {
      const response = await fetch(`/api/requirements/${requirementId}/legal-references/${referenceId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Нормативная ссылка удалена",
        })
        fetchReferences()
      } else {
        throw new Error("Failed to delete reference")
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить нормативную ссылку",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Нормативные ссылки</CardTitle>
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Добавить ссылку
        </Button>
      </CardHeader>
      <CardContent>
        {references.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Нормативные ссылки не указаны</p>
            <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить первую ссылку
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {references.map((ref) => (
              <div key={ref.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{ref.legalArticle?.fullReference}</span>
                    {ref.isPrimary && (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3" />
                        Основная
                      </Badge>
                    )}
                  </div>
                  {ref.legalArticle?.title && (
                    <p className="text-sm text-muted-foreground mb-1">{ref.legalArticle.title}</p>
                  )}
                  {ref.relevanceNote && <p className="text-sm text-muted-foreground italic">{ref.relevanceNote}</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(ref.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить нормативную ссылку</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Нормативная база</Label>
              <Select
                value={selectedFrameworkId}
                onValueChange={(value) => {
                  console.log("[v0] [LegalReferences] Framework selected", value)
                  setSelectedFrameworkId(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите нормативную базу" />
                </SelectTrigger>
                <SelectContent>
                  {regulatoryFrameworks.map((framework) => (
                    <SelectItem key={framework.id} value={framework.id}>
                      {framework.shortName || framework.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Статья закона</Label>
              <Select
                value={selectedArticleId}
                onValueChange={(value) => {
                  console.log("[v0] [LegalReferences] Article selected", value)
                  setSelectedArticleId(value)
                }}
                disabled={!selectedFrameworkId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={selectedFrameworkId ? "Выберите статью" : "Сначала выберите нормативную базу"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableArticles
                    .filter((article) => !references.some((ref) => ref.legalArticleId === article.id))
                    .map((article) => (
                      <SelectItem key={article.id} value={article.id}>
                        {article.fullReference}
                        {article.title && ` - ${article.title}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrimary"
                checked={isPrimary}
                onCheckedChange={(checked) => {
                  console.log("[v0] [LegalReferences] isPrimary changed", checked)
                  setIsPrimary(checked as boolean)
                }}
              />
              <Label htmlFor="isPrimary" className="cursor-pointer">
                Основная нормативная ссылка
              </Label>
            </div>

            <div>
              <Label>Примечание о релевантности (опционально)</Label>
              <Textarea
                value={relevanceNote}
                onChange={(e) => setRelevanceNote(e.target.value)}
                placeholder="Укажите, как эта статья относится к требованию..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                console.log("[v0] [LegalReferences] Cancel clicked")
                setShowAddDialog(false)
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={() => {
                console.log("[v0] [LegalReferences] Add button clicked")
                handleAdd()
              }}
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
