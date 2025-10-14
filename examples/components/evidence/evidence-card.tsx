"use client"

import type React from "react"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Download,
  Trash2,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  ImageIcon,
  FileCode,
  Award,
  FileSpreadsheet,
  ScanLine,
  Video,
  Music,
  Archive,
  File,
} from "lucide-react"
import { formatDate } from "@/lib/utils/date"
import type { Evidence, EvidenceType } from "@/types/domain/evidence"
import { getEvidenceTypeLabel } from "@/lib/utils/evidence-type-helpers"
import { EvidenceFreshnessBadge } from "./evidence-freshness-badge"

interface EvidenceCardProps {
  evidence: Evidence
}

const statusConfig = {
  pending: {
    label: "На проверке",
    icon: Clock,
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  approved: {
    label: "Одобрено",
    icon: CheckCircle,
    className: "bg-green-50 text-green-700 border-green-200",
  },
  rejected: {
    label: "Отклонено",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
  },
  archived: {
    label: "Архив",
    icon: FileText,
    className: "bg-gray-50 text-gray-700 border-gray-200",
  },
}

const typeIconMap: Record<EvidenceType, any> = {
  document: FileText,
  screenshot: ImageIcon,
  log: FileCode,
  certificate: Award,
  report: FileSpreadsheet,
  scan: ScanLine,
  video: Video,
  audio: Music,
  archive: Archive,
  other: File,
}

const typeColorMap: Record<EvidenceType, string> = {
  document: "bg-blue-50 text-blue-700 border-blue-200",
  screenshot: "bg-purple-50 text-purple-700 border-purple-200",
  log: "bg-gray-50 text-gray-700 border-gray-200",
  certificate: "bg-amber-50 text-amber-700 border-amber-200",
  report: "bg-green-50 text-green-700 border-green-200",
  scan: "bg-cyan-50 text-cyan-700 border-cyan-200",
  video: "bg-pink-50 text-pink-700 border-pink-200",
  audio: "bg-indigo-50 text-indigo-700 border-indigo-200",
  archive: "bg-orange-50 text-orange-700 border-orange-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
}

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  const status = statusConfig[evidence.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.icon

  const TypeIcon = typeIconMap[evidence.evidenceType] || File
  const typeColor = typeColorMap[evidence.evidenceType] || typeColorMap.other

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить это доказательство?")) {
      return
    }

    try {
      const response = await fetch(`/api/evidence/${evidence.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to delete evidence:", error)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    if ((e.target as HTMLElement).closest("button, a")) {
      return
    }
    window.location.href = `/evidence/${evidence.id}`
  }

  return (
    <Card className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow" onClick={handleCardClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TypeIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{evidence.title || evidence.fileName}</h3>
              {evidence.title && <p className="text-xs text-muted-foreground truncate">{evidence.fileName}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge variant="outline" className={typeColor}>
              {getEvidenceTypeLabel(evidence.evidenceType)}
            </Badge>
            <Badge variant="outline" className={status.className}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {evidence.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{evidence.description}</p>
        )}

        <div className="mb-3">
          <EvidenceFreshnessBadge
            updatedAt={new Date(evidence.updatedAt)}
            expiresAt={evidence.expiresAt ? new Date(evidence.expiresAt) : undefined}
            showDetails={false}
          />
        </div>

        {evidence.tags && evidence.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {evidence.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-2 text-xs text-muted-foreground">
          {evidence.requirement && (
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3" />
              <span className="truncate">
                {evidence.requirement.code}: {evidence.requirement.title}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <User className="h-3 w-3" />
            <span>{evidence.uploaded_by_user?.name || evidence.uploaded_by_user?.email || "Неизвестно"}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(evidence.uploadedAt)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">{(evidence.fileSize / 1024 / 1024).toFixed(2)} МБ</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
            <a href={evidence.fileUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Скачать
            </a>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
