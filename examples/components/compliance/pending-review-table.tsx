"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { CriticalityBadge } from "@/components/ui/criticality-badge"
import { RequirementCode } from "@/components/ui/requirement-code"
import { ApprovalDialog } from "./approval-dialog"
import { CheckCircle2, XCircle, Eye } from "lucide-react"
import { formatDate } from "@/lib/utils/date"
import Link from "next/link"

interface PendingReviewTableProps {
  data: any[]
}

export function PendingReviewTable({ data }: PendingReviewTableProps) {
  const [selectedCompliance, setSelectedCompliance] = useState<any>(null)
  const [dialogAction, setDialogAction] = useState<"approve" | "reject">("approve")
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleApprove = (compliance: any) => {
    setSelectedCompliance(compliance)
    setDialogAction("approve")
    setDialogOpen(true)
  }

  const handleReject = (compliance: any) => {
    setSelectedCompliance(compliance)
    setDialogAction("reject")
    setDialogOpen(true)
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Нет требований, ожидающих проверки</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Код</TableHead>
              <TableHead>Требование</TableHead>
              <TableHead>Организация</TableHead>
              <TableHead>Критичность</TableHead>
              <TableHead>Ответственный</TableHead>
              <TableHead>Дата отправки</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <RequirementCode code={item.requirements?.code} />
                </TableCell>
                <TableCell className="font-medium max-w-xs">
                  <Link href={`/compliance/${item.id}`} className="hover:underline">
                    {item.requirements?.title}
                  </Link>
                </TableCell>
                <TableCell>{item.organizations?.name}</TableCell>
                <TableCell>
                  <CriticalityBadge level={item.requirements?.criticality_level} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.users?.full_name || "Не назначен"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(item.updated_at)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/compliance/${item.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleApprove(item)}>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Утвердить
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleReject(item)}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Отклонить
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedCompliance && (
        <ApprovalDialog
          complianceId={selectedCompliance.id}
          requirementTitle={selectedCompliance.requirements?.title}
          organizationName={selectedCompliance.organizations?.name}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          action={dialogAction}
        />
      )}
    </>
  )
}
