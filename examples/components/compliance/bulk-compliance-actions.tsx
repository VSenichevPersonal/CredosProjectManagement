"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BulkActionDialog } from "@/components/common/bulk-action-dialog"
import { Trash2, CheckCircle2, XCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface BulkComplianceActionsProps {
  selectedIds: string[]
  onSuccess: () => void
}

export function BulkComplianceActions({ selectedIds, onSuccess }: BulkComplianceActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [updateType, setUpdateType] = useState<"approve" | "reject" | null>(null)

  const handleDelete = async () => {
    const response = await fetch("/api/compliance/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complianceIds: selectedIds }),
    })

    if (!response.ok) {
      throw new Error("Failed to delete compliance records")
    }

    onSuccess()
  }

  const handleUpdate = async () => {
    if (!updateType) return

    const updates =
      updateType === "approve"
        ? { status: "compliant", reviewedAt: new Date().toISOString() }
        : { status: "non_compliant", reviewedAt: new Date().toISOString() }

    const response = await fetch("/api/compliance/bulk-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complianceIds: selectedIds, updates }),
    })

    if (!response.ok) {
      throw new Error("Failed to update compliance records")
    }

    onSuccess()
  }

  if (selectedIds.length === 0) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Массовые действия ({selectedIds.length})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setUpdateType("approve")
              setUpdateDialogOpen(true)
            }}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Утвердить все
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setUpdateType("reject")
              setUpdateDialogOpen(true)
            }}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Отклонить все
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Удалить все
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BulkActionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Удалить записи о соответствии"
        description="Вы уверены, что хотите удалить выбранные записи о соответствии?"
        actionType="delete"
        selectedCount={selectedIds.length}
        onConfirm={handleDelete}
        warningMessage="Это действие нельзя отменить. Все связанные данные будут удалены."
        requireConfirmation={true}
      />

      <BulkActionDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        title={updateType === "approve" ? "Утвердить записи" : "Отклонить записи"}
        description={`Вы уверены, что хотите ${updateType === "approve" ? "утвердить" : "отклонить"} выбранные записи?`}
        actionType={updateType === "approve" ? "approve" : "reject"}
        selectedCount={selectedIds.length}
        onConfirm={handleUpdate}
        requireConfirmation={false}
      />
    </>
  )
}
