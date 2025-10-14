"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Download, Trash2, Calendar } from "lucide-react"
import type { Evidence } from "@/types/domain/evidence"
import { formatDate } from "@/lib/utils/date"

interface EvidenceListProps {
  complianceId: string
}

export function EvidenceList({ complianceId }: EvidenceListProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchEvidence = async () => {
    try {
      const response = await fetch(`/api/evidence?complianceId=${complianceId}`)
      const data = await response.json()
      setEvidence(data.data || [])
    } catch (error) {
      console.error("Failed to fetch evidence:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvidence()
  }, [complianceId])

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить это доказательство?")) {
      return
    }

    try {
      const response = await fetch(`/api/evidence/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchEvidence()
      }
    } catch (error) {
      console.error("Failed to delete evidence:", error)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
  }

  if (evidence.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Доказательства еще не загружены</p>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Файл</TableHead>
            <TableHead>Описание</TableHead>
            <TableHead>Размер</TableHead>
            <TableHead>Загружено</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evidence.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{item.fileName}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{item.description || "—"}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm">{(item.fileSize / 1024 / 1024).toFixed(2)} МБ</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(item.uploadedAt)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
