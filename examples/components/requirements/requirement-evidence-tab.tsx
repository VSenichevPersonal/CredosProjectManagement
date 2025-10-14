"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Download, Trash2, Eye, CheckCircle2, XCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Evidence } from "@/types/domain/evidence"
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
import { RequirementModeBadge } from "@/components/compliance/requirement-mode-badge"

interface RequirementEvidenceTabProps {
  requirementId: string
}

export function RequirementEvidenceTab({ requirementId }: RequirementEvidenceTabProps) {
  const { toast } = useToast()
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [requirement, setRequirement] = useState<any>(null)

  useEffect(() => {
    fetchEvidence()
    fetchRequirement()
  }, [requirementId])

  const fetchRequirement = async () => {
    try {
      const response = await fetch(`/api/requirements/${requirementId}`)
      const data = await response.json()
      setRequirement(data.data)
    } catch (error) {
      console.error("Failed to fetch requirement:", error)
    }
  }

  const fetchEvidence = async () => {
    try {
      const response = await fetch(`/api/evidence?requirementId=${requirementId}`)
      const data = await response.json()
      setEvidence(data.data || [])
    } catch (error) {
      console.error("Failed to fetch evidence:", error)
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить доказательства",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/evidence/${deleteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete evidence")
      }

      toast({
        title: "Доказательство удалено",
        description: "Файл успешно удален",
      })

      await fetchEvidence()
    } catch (error) {
      console.error("Failed to delete evidence:", error)
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить доказательство",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="border-green-600 text-green-600">
            Одобрено
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="border-red-600 text-red-600">
            Отклонено
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-600 text-yellow-600">
            На проверке
          </Badge>
        )
      default:
        return <Badge variant="outline">Черновик</Badge>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Б`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (loading) {
    return <div className="text-center py-8">Загрузка доказательств...</div>
  }

  const stats = {
    total: evidence.length,
    approved: evidence.filter((e) => e.status === "approved").length,
    pending: evidence.filter((e) => e.status === "pending").length,
    rejected: evidence.filter((e) => e.status === "rejected").length,
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Доказательства выполнения</CardTitle>
              <CardDescription>
                Документы и файлы, подтверждающие выполнение требования
                {requirement?.evidenceTypeMode && (
                  <span className="ml-2 inline-flex">
                    <RequirementModeBadge mode={requirement.evidenceTypeMode} type="evidence" />
                  </span>
                )}
              </CardDescription>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Загрузить доказательство
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {evidence.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">К этому требованию еще не загружены доказательства</p>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Загрузить первое доказательство
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {evidence.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">{getStatusIcon(item.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{item.title || item.fileName}</h4>
                            {item.title && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{item.fileName}</p>
                            )}
                          </div>
                          {getStatusBadge(item.status)}
                        </div>

                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                        )}

                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {item.tags.map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">Размер:</span> {formatFileSize(item.fileSize)}
                          </div>
                          <div>
                            <span className="font-medium">Загружено:</span> {formatDate(item.uploadedAt)}
                          </div>
                          {item.reviewedAt && (
                            <div>
                              <span className="font-medium">Проверено:</span> {formatDate(item.reviewedAt)}
                            </div>
                          )}
                        </div>

                        {item.reviewNotes && (
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <p className="text-xs font-medium mb-1">Комментарий проверяющего:</p>
                            <p className="text-xs text-muted-foreground">{item.reviewNotes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={item.fileUrl} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Статистика доказательств</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Всего</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-xs text-muted-foreground">Одобрено</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">На проверке</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-xs text-muted-foreground">Отклонено</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить доказательство?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить это доказательство? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
