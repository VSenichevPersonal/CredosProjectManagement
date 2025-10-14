"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Trash2, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface EvidenceType {
  id: string
  code: string
  title: string
  description?: string
  icon?: string
  fileFormatRegex?: string
}

interface ControlTemplateEvidenceTypesTabProps {
  templateId: string
}

export function ControlTemplateEvidenceTypesTab({ templateId }: ControlTemplateEvidenceTypesTabProps) {
  const { toast } = useToast()
  const [template, setTemplate] = useState<any>(null)
  const [recommendedTypes, setRecommendedTypes] = useState<EvidenceType[]>([])
  const [allTypes, setAllTypes] = useState<EvidenceType[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [templateId])

  const fetchData = async () => {
    try {
      const [templateRes, typesRes] = await Promise.all([
        fetch(`/api/control-templates/${templateId}`),
        fetch("/api/dictionaries/evidence-types"),
      ])

      const templateData = await templateRes.json()
      const typesData = await typesRes.json()

      console.log("[v0] Evidence types data:", typesData)

      setTemplate(templateData.data)
      setAllTypes(typesData || [])

      // Filter recommended types
      const recommendedIds = templateData.data?.recommendedEvidenceTypeIds || []
      const recommended = (typesData || []).filter((type: EvidenceType) => recommendedIds.includes(type.id))
      setRecommendedTypes(recommended)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddType = async (typeId: string) => {
    try {
      const currentIds = template?.recommendedEvidenceTypeIds || []
      const newIds = [...currentIds, typeId]

      const response = await fetch(`/api/control-templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendedEvidenceTypeIds: newIds }),
      })

      if (!response.ok) {
        throw new Error("Failed to add evidence type")
      }

      toast({
        title: "Тип доказательства добавлен",
        description: "Тип доказательства успешно добавлен к шаблону меры",
      })

      fetchData()
    } catch (error) {
      console.error("Failed to add evidence type:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось добавить тип доказательства",
        variant: "destructive",
      })
    }
  }

  const handleRemoveType = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const currentIds = template?.recommendedEvidenceTypeIds || []
      const newIds = currentIds.filter((id: string) => id !== deleteId)

      const response = await fetch(`/api/control-templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendedEvidenceTypeIds: newIds }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove evidence type")
      }

      toast({
        title: "Тип доказательства удалён",
        description: "Тип доказательства успешно удалён из шаблона меры",
      })

      fetchData()
    } catch (error) {
      console.error("Failed to remove evidence type:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить тип доказательства",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  const availableTypes = allTypes.filter((type) => !recommendedTypes.some((recommended) => recommended.id === type.id))

  return (
    <>
      <div className="space-y-6">
        {/* Linked types section */}
        <Card>
          <CardHeader>
            <CardTitle>Привязанные типы доказательств ({recommendedTypes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {recommendedTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Не указаны рекомендуемые типы доказательств</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Добавьте типы доказательств из списка доступных ниже
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {recommendedTypes.map((type) => (
                  <Card key={type.id}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="font-mono text-xs">
                          {type.code}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(type.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-medium">{type.title}</h4>
                      {type.description && <p className="text-sm text-muted-foreground mt-1">{type.description}</p>}
                      {type.fileFormatRegex && (
                        <p className="text-xs text-muted-foreground mt-2 font-mono">Формат: {type.fileFormatRegex}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available types section */}
        <Card>
          <CardHeader>
            <CardTitle>Доступные для добавления ({availableTypes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {availableTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">Все доступные типы уже добавлены</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Все типы доказательств из справочника уже привязаны к этой типовой мере
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {availableTypes.map((type) => (
                  <Card key={type.id}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="font-mono text-xs">
                          {type.code}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAddType(type.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-medium">{type.title}</h4>
                      {type.description && <p className="text-sm text-muted-foreground mt-1">{type.description}</p>}
                      {type.fileFormatRegex && (
                        <p className="text-xs text-muted-foreground mt-2 font-mono">Формат: {type.fileFormatRegex}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить тип доказательства?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот тип доказательства из рекомендуемых для данного шаблона меры?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveType}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
