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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "lucide-react"

interface SetDeadlineDialogProps {
  complianceId: string
  currentDeadline?: Date | null
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function SetDeadlineDialog({ complianceId, currentDeadline, onSuccess, trigger }: SetDeadlineDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [deadline, setDeadline] = useState<string>(
    currentDeadline ? new Date(currentDeadline).toISOString().split("T")[0] : "",
  )
  const [loading, setLoading] = useState(false)

  const handleSetDeadline = async () => {
    if (!deadline) {
      toast({
        title: "Укажите дату",
        description: "Необходимо выбрать дату дедлайна",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/compliance/${complianceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextReviewDate: deadline,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to set deadline")
      }

      toast({
        title: "Дедлайн установлен",
        description: "Срок выполнения успешно установлен",
      })

      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to set deadline:", error)
      toast({
        title: "Ошибка установки дедлайна",
        description: "Не удалось установить срок выполнения",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Установить дедлайн
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Установить дедлайн</DialogTitle>
          <DialogDescription>Укажите срок, до которого требование должно быть выполнено</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deadline">Дата дедлайна</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {deadline && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                <strong>Выбранная дата:</strong>{" "}
                {new Date(deadline).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Осталось дней:{" "}
                {Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleSetDeadline} disabled={loading}>
            {loading ? "Установка..." : "Установить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
