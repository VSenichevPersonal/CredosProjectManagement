/**
 * @intent: Preview evidence files (images, PDFs, text)
 * @llm-note: Modal dialog with file preview based on type
 */

"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"
import type { Evidence } from "@/types/domain/evidence"
import { getEvidenceTypeLabel } from "@/lib/utils/evidence-type-helpers"

interface EvidencePreviewDialogProps {
  evidence: Evidence | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EvidencePreviewDialog({ evidence, open, onOpenChange }: EvidencePreviewDialogProps) {
  if (!evidence) return null

  const isImage = evidence.evidenceType === "screenshot" || evidence.fileType.startsWith("image/")
  const isPDF = evidence.fileType === "application/pdf"
  const isText = evidence.fileType.startsWith("text/")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="truncate">{evidence.title || evidence.fileName}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{getEvidenceTypeLabel(evidence.evidenceType)}</Badge>
                <span className="text-xs text-muted-foreground">{(evidence.fileSize / 1024 / 1024).toFixed(2)} МБ</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={evidence.fileUrl} download>
                  <Download className="h-4 w-4 mr-2" />
                  Скачать
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={evidence.fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Открыть
                </a>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isImage && (
            <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
              <img
                src={evidence.fileUrl || "/placeholder.svg"}
                alt={evidence.title || evidence.fileName}
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
          )}

          {isPDF && (
            <div className="w-full h-[60vh] bg-muted/50 rounded-lg">
              <iframe src={evidence.fileUrl} className="w-full h-full rounded-lg" title={evidence.fileName} />
            </div>
          )}

          {isText && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Предпросмотр текстовых файлов недоступен. Пожалуйста, скачайте файл для просмотра.
              </p>
            </div>
          )}

          {!isImage && !isPDF && !isText && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Предпросмотр для этого типа файла недоступен. Пожалуйста, скачайте файл для просмотра.
              </p>
            </div>
          )}

          {evidence.description && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Описание</h4>
              <p className="text-sm text-muted-foreground">{evidence.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
