"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Download, Edit, LinkIcon, CheckCircle, XCircle, Clock } from "lucide-react"
import { EditEvidenceDialog } from "./edit-evidence-dialog"
import { VerifyEvidenceDialog } from "./verify-evidence-dialog"
import { LinkEvidenceToMeasuresDialog } from "@/components/compliance/link-evidence-to-measures-dialog"
import { formatBytes, formatDate } from "@/lib/utils"

interface EvidenceDetailClientProps {
  evidenceId: string
}

export function EvidenceDetailClient({ evidenceId }: EvidenceDetailClientProps) {
  const [evidence, setEvidence] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)

  useEffect(() => {
    fetchEvidence()
  }, [evidenceId])

  const fetchEvidence = async () => {
    try {
      const response = await fetch(`/api/evidence/${evidenceId}`)
      const result = await response.json()
      setEvidence(result.data)
    } catch (error) {
      console.error("Failed to fetch evidence:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6">Загрузка...</div>
  }

  if (!evidence) {
    return <div className="p-6">Доказательство не найдено</div>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Одобрено
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Отклонено
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            На проверке
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{evidence.title || evidence.file_name}</h1>
          <p className="text-muted-foreground">{evidence.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Редактировать
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={evidence.file_url} download>
              <Download className="mr-2 h-4 w-4" />
              Скачать
            </a>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Общее</TabsTrigger>
          <TabsTrigger value="measures">Связанные меры ({evidence.control_measure_evidence?.length || 0})</TabsTrigger>
          <TabsTrigger value="verification">Верификация</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Информация о файле</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Имя файла</p>
                <p className="font-medium">{evidence.file_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Тип файла</p>
                <p className="font-medium">{evidence.file_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Размер</p>
                <p className="font-medium">{formatBytes(evidence.file_size)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Тип доказательства</p>
                <Badge variant="outline">{evidence.evidence_type}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Загружено</p>
                <p className="font-medium">{formatDate(evidence.uploaded_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Загрузил</p>
                <p className="font-medium">{evidence.uploaded_by_user?.name || "—"}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Связи</h3>
            <div className="space-y-3">
              {evidence.compliance_record && (
                <div>
                  <p className="text-sm text-muted-foreground">Запись соответствия</p>
                  <p className="font-medium">
                    {evidence.compliance_record.requirement?.code} - {evidence.compliance_record.requirement?.title}
                  </p>
                </div>
              )}
              {evidence.organization && (
                <div>
                  <p className="text-sm text-muted-foreground">Организация</p>
                  <p className="font-medium">{evidence.organization.name}</p>
                </div>
              )}
            </div>
          </Card>

          {evidence.tags && evidence.tags.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Теги</h3>
              <div className="flex flex-wrap gap-2">
                {evidence.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="measures" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Связанные меры контроля</h3>
              <Button size="sm" onClick={() => setLinkDialogOpen(true)}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Связать с мерами
              </Button>
            </div>

            {evidence.control_measure_evidence && evidence.control_measure_evidence.length > 0 ? (
              <div className="space-y-3">
                {evidence.control_measure_evidence.map((link: any) => (
                  <div key={link.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{link.control_measure.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{link.control_measure.description}</p>
                        {link.notes && <p className="text-sm text-muted-foreground mt-2 italic">{link.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {link.relevance_score && (
                          <Badge variant="outline">Релевантность: {link.relevance_score}/5</Badge>
                        )}
                        <Badge>{link.control_measure.status}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Доказательство не связано ни с одной мерой контроля
              </p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Статус верификации</h3>
              {getStatusBadge(evidence.status)}
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              {evidence.reviewed_by_user && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Проверил</p>
                    <p className="font-medium">{evidence.reviewed_by_user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Дата проверки</p>
                    <p className="font-medium">{formatDate(evidence.reviewed_at)}</p>
                  </div>
                  {evidence.review_notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Комментарии проверяющего</p>
                      <p className="font-medium">{evidence.review_notes}</p>
                    </div>
                  )}
                </>
              )}

              {evidence.status === "pending" && (
                <div className="pt-4">
                  <Button onClick={() => setVerifyDialogOpen(true)}>Проверить доказательство</Button>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <EditEvidenceDialog
        evidence={evidence}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchEvidence}
      />

      <VerifyEvidenceDialog
        evidence={evidence}
        open={verifyDialogOpen}
        onOpenChange={setVerifyDialogOpen}
        onSuccess={fetchEvidence}
      />

      {evidence.compliance_record && (
        <LinkEvidenceToMeasuresDialog
          evidenceId={evidence.id}
          complianceRecordId={evidence.compliance_record_id}
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          onSuccess={fetchEvidence}
        />
      )}
    </div>
  )
}
