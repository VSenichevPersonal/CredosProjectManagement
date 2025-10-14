/**
 * @intent: Dialog for reviewing documents and updating actuality
 * @architecture: Form-based dialog with date pickers
 */

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ReviewDocumentDialogProps {
  documentId: string
  documentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ReviewDocumentDialog({
  documentId,
  documentName,
  open,
  onOpenChange,
  onSuccess,
}: ReviewDocumentDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewNotes, setReviewNotes] = useState("")
  const [nextReviewDate, setNextReviewDate] = useState<Date>()
  const [validityPeriodDays, setValidityPeriodDays] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/documents/${documentId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewNotes,
          nextReviewDate: nextReviewDate?.toISOString(),
          validityPeriodDays: validityPeriodDays ? Number.parseInt(validityPeriodDays) : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to review document")
      }

      toast.success("Документ пересмотрен", {
        description: "Статус актуальности обновлен",
      })

      onOpenChange(false)
      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error("[v0] Review error:", error)
      toast.error("Ошибка", {
        description: error instanceof Error ? error.message : "Не удалось пересмотреть документ",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Пересмотр документа</DialogTitle>
          <DialogDescription>Обновите информацию об актуальности документа "{documentName}"</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Review Notes */}
          <div className="space-y-2">
            <Label htmlFor="reviewNotes">Примечания к пересмотру</Label>
            <Textarea
              id="reviewNotes"
              placeholder="Опишите результаты пересмотра..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Validity Period */}
          <div className="space-y-2">
            <Label htmlFor="validityPeriod">Срок действия (дней)</Label>
            <Input
              id="validityPeriod"
              type="number"
              placeholder="365"
              value={validityPeriodDays}
              onChange={(e) => setValidityPeriodDays(e.target.value)}
              min="1"
            />
            <p className="text-xs text-muted-foreground">Если указано, дата истечения будет рассчитана автоматически</p>
          </div>

          {/* Next Review Date */}
          <div className="space-y-2">
            <Label>Дата следующего пересмотра</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !nextReviewDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {nextReviewDate ? format(nextReviewDate, "PPP", { locale: ru }) : "Выберите дату"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={nextReviewDate} onSelect={setNextReviewDate} initialFocus />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">Если не указано, будет установлено за 30 дней до истечения</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
