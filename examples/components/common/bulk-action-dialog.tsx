"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface BulkActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  actionType: "delete" | "update" | "archive" | "approve" | "reject"
  selectedCount: number
  onConfirm: () => Promise<void>
  warningMessage?: string
  requireConfirmation?: boolean
}

export function BulkActionDialog({
  open,
  onOpenChange,
  title,
  description,
  actionType,
  selectedCount,
  onConfirm,
  warningMessage,
  requireConfirmation = true,
}: BulkActionDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const getActionColor = () => {
    switch (actionType) {
      case "delete":
        return "destructive"
      case "approve":
        return "default"
      case "reject":
        return "secondary"
      default:
        return "default"
    }
  }

  const getActionLabel = () => {
    switch (actionType) {
      case "delete":
        return "Удалить"
      case "update":
        return "Обновить"
      case "archive":
        return "Архивировать"
      case "approve":
        return "Утвердить"
      case "reject":
        return "Отклонить"
      default:
        return "Выполнить"
    }
  }

  const handleConfirm = async () => {
    if (requireConfirmation && !confirmed) {
      setError("Пожалуйста, подтвердите действие")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      await onConfirm()
      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        setSuccess(false)
        setConfirmed(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      onOpenChange(false)
      setConfirmed(false)
      setError(null)
      setSuccess(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {warningMessage && (
            <Alert variant={actionType === "delete" ? "destructive" : "default"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{warningMessage}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="text-sm font-medium">
              Выбрано элементов: <span className="text-lg font-bold">{selectedCount}</span>
            </p>
          </div>

          {requireConfirmation && (
            <div className="flex items-start space-x-2">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <Label htmlFor="confirm" className="text-sm leading-relaxed cursor-pointer">
                Я понимаю последствия этого действия и хочу продолжить
              </Label>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Операция успешно выполнена</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Отмена
          </Button>
          <Button
            variant={getActionColor() as any}
            onClick={handleConfirm}
            disabled={isProcessing || (requireConfirmation && !confirmed) || success}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Выполнение...
              </>
            ) : (
              getActionLabel()
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
