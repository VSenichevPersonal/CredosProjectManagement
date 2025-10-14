"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Upload, History, Download, CheckCircle2, GitCompare } from "lucide-react"
import { DocumentStatusBadge } from "./document-status-badge"
import { AddVersionDialog } from "./add-version-dialog"
import type { Document, DocumentVersion } from "@/types/domain/document"
import Link from "next/link"

interface DocumentVersionsViewProps {
  document: Document
  initialVersions: DocumentVersion[]
  onVersionsSelected?: (versionIds: string[]) => void
}

export function DocumentVersionsView({ document, initialVersions, onVersionsSelected }: DocumentVersionsViewProps) {
  const [versions, setVersions] = useState(initialVersions)
  const [isAddVersionOpen, setIsAddVersionOpen] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleAddVersionSuccess = (newVersion: DocumentVersion) => {
    setVersions((prev) => [newVersion, ...prev])
    setIsAddVersionOpen(false)
  }

  const handleVersionSelect = (versionId: string, checked: boolean) => {
    let newSelected: string[]
    if (checked) {
      newSelected = [...selectedVersions, versionId].slice(-2) // Keep only last 2
    } else {
      newSelected = selectedVersions.filter((id) => id !== versionId)
    }
    setSelectedVersions(newSelected)
    onVersionsSelected?.(newSelected)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Document Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <FileText className="h-6 w-6 mt-1" />
              <div>
                <CardTitle className="text-2xl">{document.title || document.fileName}</CardTitle>
                {document.description && <CardDescription className="mt-1">{document.description}</CardDescription>}
              </div>
            </div>
            <DocumentStatusBadge status={document.documentStatus} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Версий:</span> {versions.length}
            </div>
            {document.expiresAt && (
              <div>
                <span className="font-medium">Истекает:</span>{" "}
                {new Date(document.expiresAt).toLocaleDateString("ru-RU")}
              </div>
            )}
            <div>
              <span className="font-medium">Загружен:</span> {formatDate(document.uploadedAt)}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button onClick={() => setIsAddVersionOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Добавить версию
            </Button>
            <Button asChild variant="outline">
              <Link href={`/documents/${document.id}/analyze`}>
                <History className="h-4 w-4 mr-2" />
                Анализ изменений
              </Link>
            </Button>
            {selectedVersions.length === 2 && (
              <Badge variant="secondary" className="ml-auto">
                <GitCompare className="h-3 w-3 mr-1" />
                Выбрано для сравнения: 2
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Versions Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>История версий</CardTitle>
          <CardDescription>
            {onVersionsSelected
              ? "Выберите две версии для сравнения"
              : "Все версии документа с отслеживанием изменений"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Версии не найдены</div>
          ) : (
            <div className="flex flex-col gap-4">
              {versions.map((version, index) => (
                <div key={version.id}>
                  <div className="flex items-start gap-4">
                    {onVersionsSelected && (
                      <Checkbox
                        checked={selectedVersions.includes(version.id)}
                        onCheckedChange={(checked) => handleVersionSelect(version.id, checked as boolean)}
                        disabled={selectedVersions.length >= 2 && !selectedVersions.includes(version.id)}
                        className="mt-2"
                      />
                    )}
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          version.isCurrent ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {version.isCurrent ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      {index < versions.length - 1 && <div className="h-full w-px bg-border" />}
                    </div>

                    <div className="flex-1 pb-8">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{version.versionNumber}</h4>
                            {version.isCurrent && <Badge variant="default">Текущая</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{version.changeSummary}</p>
                          {version.changeNotes && (
                            <p className="text-sm text-muted-foreground mt-2">{version.changeNotes}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{formatDate(version.createdAt)}</span>
                            <span>{formatFileSize(version.fileSize)}</span>
                            <span>{version.fileName}</span>
                          </div>
                        </div>

                        <Button variant="outline" size="sm" asChild>
                          <a href={version.fileUrl} download>
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            Скачать
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                  {index < versions.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddVersionDialog
        open={isAddVersionOpen}
        onOpenChange={setIsAddVersionOpen}
        documentId={document.id}
        onSuccess={handleAddVersionSuccess}
      />
    </div>
  )
}
