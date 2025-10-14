"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Trash2, ExternalLink, FileText } from "lucide-react"
import { formatDate } from "@/lib/utils/date"

interface EvidenceLinksTableProps {
  evidenceId?: string
  complianceId?: string
}

interface EvidenceLink {
  id: string
  evidence?: {
    id: string
    fileName: string
    fileType: string
  }
  controlMeasure: {
    id: string
    title: string
    status: string
  }
  linkNotes?: string
  createdAt: Date
  createdBy?: {
    fullName: string
  }
}

export function EvidenceLinksTable({ evidenceId, complianceId }: EvidenceLinksTableProps) {
  const [links, setLinks] = useState<EvidenceLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchLinks = async () => {
    try {
      let url = "/api/evidence-links?"
      if (evidenceId) url += `evidenceId=${evidenceId}&`
      if (complianceId) url += `complianceId=${complianceId}&`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setLinks(data.data || [])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch evidence links:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLinks()
  }, [evidenceId, complianceId])

  const handleDelete = async (linkId: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту связь?")) {
      return
    }

    setDeletingId(linkId)
    try {
      const response = await fetch(`/api/evidence-links/${linkId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchLinks()
      } else {
        const data = await response.json()
        alert(data.error || "Ошибка удаления связи")
      }
    } catch (error) {
      console.error("[v0] Failed to delete link:", error)
      alert("Ошибка удаления связи")
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return <div className="text-center py-4 text-muted-foreground">Загрузка связей...</div>
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>
          {evidenceId
            ? "Это доказательство еще не привязано к мерам контроля"
            : "Связи доказательств с мерами еще не созданы"}
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {!evidenceId && <TableHead>Доказательство</TableHead>}
          <TableHead>Мера контроля</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Примечание</TableHead>
          <TableHead>Добавлено</TableHead>
          <TableHead className="text-right">Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {links.map((link) => (
          <TableRow key={link.id}>
            {!evidenceId && link.evidence && (
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{link.evidence.fileName}</span>
                </div>
              </TableCell>
            )}
            <TableCell>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{link.controlMeasure.title}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{link.controlMeasure.status}</Badge>
            </TableCell>
            <TableCell>
              {link.linkNotes ? (
                <span className="text-sm">{link.linkNotes}</span>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div>{formatDate(link.createdAt)}</div>
                {link.createdBy && <div className="text-muted-foreground">{link.createdBy.fullName}</div>}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`/control-measures/${link.controlMeasure.id}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(link.id)}
                  disabled={deletingId === link.id}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
