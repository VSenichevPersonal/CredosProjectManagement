"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, History, Sparkles, RefreshCw } from "lucide-react"
import { DocumentStatusBadge } from "./document-status-badge"
import { DocumentActualityBadge } from "./document-actuality-badge"
import { ReviewDocumentDialog } from "./review-document-dialog"
import type { Document } from "@/types/domain/document"
import Link from "next/link"

interface DocumentCardProps {
  document: Document
  onUpdate?: () => void
}

export function DocumentCard({ document, onUpdate }: DocumentCardProps) {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)

  const formatDate = (date: Date | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("ru-RU")
  }

  const getFileIcon = (fileType: string) => {
    return <FileText className="h-4 w-4" />
  }

  // Calculate actuality info
  const now = new Date()
  let daysUntilExpiry: number | undefined
  let daysUntilReview: number | undefined

  if (document.expiresAt) {
    daysUntilExpiry = Math.ceil((new Date(document.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  if (document.nextReviewDate) {
    daysUntilReview = Math.ceil((new Date(document.nextReviewDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getFileIcon(document.fileType)}
              <CardTitle className="text-base leading-tight truncate">{document.title || document.fileName}</CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <DocumentStatusBadge status={document.documentStatus} />
              <DocumentActualityBadge
                status={document.actualityStatus}
                daysUntilExpiry={daysUntilExpiry}
                daysUntilReview={daysUntilReview}
              />
            </div>
          </div>
          {document.description && <CardDescription className="line-clamp-2">{document.description}</CardDescription>}
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Metadata */}
          <div className="flex flex-col gap-2 text-sm">
            {document.expiresAt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Истекает: {formatDate(document.expiresAt)}</span>
              </div>
            )}
            {document.nextReviewDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Пересмотр: {formatDate(document.nextReviewDate)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <History className="h-3.5 w-3.5" />
              <span>Загружен: {formatDate(document.uploadedAt)}</span>
            </div>
          </div>

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {document.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {document.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{document.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-transparent"
              onClick={() => setReviewDialogOpen(true)}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Пересмотр
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
              <Link href={`/documents/${document.id}`}>
                <History className="h-3.5 w-3.5 mr-1.5" />
                Версии
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
              <Link href={`/documents/${document.id}/analyze`}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Анализ
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <ReviewDocumentDialog
        documentId={document.id}
        documentName={document.title || document.fileName}
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        onSuccess={onUpdate}
      />
    </>
  )
}
