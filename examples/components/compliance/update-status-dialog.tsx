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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ComplianceStatus } from "@/types/domain/compliance"

interface UpdateStatusDialogProps {
  complianceId: string
  currentStatus: ComplianceStatus
  trigger?: React.ReactNode
}

export function UpdateStatusDialog({ complianceId, currentStatus, trigger }: UpdateStatusDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<ComplianceStatus>(currentStatus)
  const [comments, setComments] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const shouldNotifyReviewer = status === "pending_review" && currentStatus !== "pending_review"

      const response = await fetch(`/api/compliance/${complianceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          comments,
          completedAt: status === "pending_review" || status === "approved" ? new Date().toISOString() : undefined,
          notifyReviewer: shouldNotifyReviewer,
        }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to update status:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button variant="outline">Изменить статус</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Изменить статус выполнения</DialogTitle>
          <DialogDescription>Обновите статус выполнения требования</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Новый статус</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as ComplianceStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Не начато</SelectItem>
                  <SelectItem value="in_progress">В работе</SelectItem>
                  <SelectItem value="pending_review">На проверке</SelectItem>
                  <SelectItem value="approved">Утверждено</SelectItem>
                  <SelectItem value="rejected">Отклонено</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="comments">Комментарий</Label>
              <Textarea
                id="comments"
                placeholder="Добавьте комментарий к изменению статуса..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
