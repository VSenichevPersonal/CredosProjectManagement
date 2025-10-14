"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Calendar, User, Building2, ExternalLink } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { ComplianceRecord } from "@/types/domain/compliance"
import Link from "next/link"

interface ComplianceRecordsListProps {
  requirementId: string
  onUpdate?: () => void
}

export function ComplianceRecordsList({ requirementId, onUpdate }: ComplianceRecordsListProps) {
  const [records, setRecords] = useState<ComplianceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecords()
  }, [requirementId])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/compliance?requirementId=${requirementId}`)
      console.log("[v0] Compliance records response:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Compliance records data:", data)
        const recordsData = Array.isArray(data) ? data : data.data || []
        setRecords(recordsData)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch compliance records:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Ожидает", variant: "secondary" as const },
      compliant: { label: "Соответствует", variant: "default" as const },
      non_compliant: { label: "Не соответствует", variant: "destructive" as const },
      in_progress: { label: "В процессе", variant: "secondary" as const },
      not_applicable: { label: "Не применимо", variant: "outline" as const },
      partial: { label: "Частично", variant: "secondary" as const },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.in_progress
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Загрузка записей соответствия...</div>
        </CardContent>
      </Card>
    )
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Записи соответствия не созданы</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Создайте записи соответствия для организаций, к которым применяется это требование
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Записи соответствия ({records.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Организация</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Следующая проверка</TableHead>
              <TableHead>Оценил</TableHead>
              <TableHead>Дата оценки</TableHead>
              <TableHead className="w-[100px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {record.organization?.name || record.organizationName || "Неизвестная организация"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(record.status)}</TableCell>
                <TableCell>
                  {record.nextReviewDate ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(record.nextReviewDate)}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Не указана</span>
                  )}
                </TableCell>
                <TableCell>
                  {record.assessedBy ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{record.assessedByName || "Неизвестный пользователь"}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Не оценено</span>
                  )}
                </TableCell>
                <TableCell>
                  {record.assessedAt ? (
                    formatDate(record.assessedAt)
                  ) : (
                    <span className="text-muted-foreground">Не оценено</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/compliance/${record.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
