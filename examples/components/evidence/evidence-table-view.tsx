"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Trash2, Calendar, User, CheckCircle, XCircle, Clock, Eye } from "lucide-react"
import { formatDate } from "@/lib/utils/date"
import { getEvidenceTypeLabel } from "@/lib/utils/evidence-type-helpers"
import { EvidenceFreshnessBadge } from "./evidence-freshness-badge"

interface EvidenceTableViewProps {
  evidence: any[]
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
    icon: Clock,
    className: "bg-gray-50 text-gray-700 border-gray-200",
  },
}

export function EvidenceTableView({ evidence }: EvidenceTableViewProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить это доказательство?")) {
      return
    }

    try {
      const response = await fetch(`/api/evidence/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to delete evidence:", error)
    }
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Актуальность</TableHead>
            <TableHead>Загрузил</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead>Размер</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evidence.map((item) => {
            const status = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.pending
            const StatusIcon = status.icon

            return (
              <TableRow
                key={item.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => (window.location.href = `/evidence/${item.id}`)}
              >
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{item.title || item.file_name}</span>
                    {item.title && <span className="text-xs text-muted-foreground">{item.file_name}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getEvidenceTypeLabel(item.evidence_type)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={status.className}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <EvidenceFreshnessBadge
                    updatedAt={new Date(item.updated_at)}
                    expiresAt={item.expires_at ? new Date(item.expires_at) : undefined}
                    showDetails={false}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span>{item.uploaded_by_user?.name || item.uploaded_by_user?.email || "Неизвестно"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(item.uploaded_at)}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{(item.file_size / 1024 / 1024).toFixed(2)} МБ</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = `/evidence/${item.id}`
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                      <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(item.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
