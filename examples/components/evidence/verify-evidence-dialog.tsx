"use client"

import type React from "react"

import { useState } from "react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"

interface VerifyEvidenceDialogProps {
  evidence: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function VerifyEvidenceDialog({ evidence, open, onOpenChange, onSuccess }: VerifyEvidenceDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"approved" | "rejected">("approved")
  const [reviewNotes, setReviewNotes] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/evidence/${evidence.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNotes }),
      })

      if (!response.ok) throw new Error("Failed to verify evidence")

      toast({
        title: "Успешно",
        description: `Доказательство ${status === "approved" ? "одобрено" : "отклонено"}`,
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось проверить доказательство",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Проверить доказательство</DialogTitle>
          <DialogDescription>Одобрите или отклоните доказательство</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Решение</Label>
            <RadioGroup value={status} onValueChange={(value: any) => setStatus(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approved" id="approved" />
                <Label htmlFor="approved" className="font-normal cursor-pointer">
                  Одобрить
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rejected" id="rejected" />
                <Label htmlFor="rejected" className="font-normal cursor-pointer">
                  Отклонить
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewNotes">Комментарии</Label>
            <Textarea
              id="reviewNotes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Укажите причину решения..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Сохранение..." : "Подтвердить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
