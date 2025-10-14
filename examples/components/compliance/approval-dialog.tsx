"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, XCircle } from "lucide-react"

interface ApprovalDialogProps {
  complianceId: string
  requirementTitle: string
  organizationName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  action: "approve" | "reject"
}

export function ApprovalDialog({
  complianceId,
  requirementTitle,
  organizationName,
  open,
  onOpenChange,
  action,
}: ApprovalDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [comments, setComments] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/compliance/${complianceId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          comments,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to review compliance")
      }

      onOpenChange(false)
      setComments("")
      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to review compliance:", error)
      alert(error instanceof Error ? error.message : "Произошла ошибка")
    } finally {
      setLoading(false)
    }
  }

  const isApprove = action === "approve"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApprove ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-success" />
                Утвердить выполнение
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-error" />
                Отклонить выполнение
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-1 pt-2">
              <p className="text-sm">
                <span className="font-medium">Требование:</span> {requirementTitle}
              </p>
              <p className="text-sm">
                <span className="font-medium">Организация:</span> {organizationName}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="comments">{isApprove ? "Комментарий (опционально)" : "Причина отклонения *"}</Label>
              <Textarea
                id="comments"
                placeholder={
                  isApprove
                    ? "Добавьте комментарий к утверждению..."
                    : "Укажите причину отклонения и рекомендации по исправлению..."
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                required={!isApprove}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading} variant={isApprove ? "default" : "destructive"}>
              {loading ? "Сохранение..." : isApprove ? "Утвердить" : "Отклонить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
