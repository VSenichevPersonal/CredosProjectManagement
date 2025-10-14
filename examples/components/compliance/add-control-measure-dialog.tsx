"use client"

import { useState } from "react"

import type React from "react"
import { useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface AddControlMeasureDialogProps {
  complianceRecordId: string
  requirementId: string
  onSuccess?: () => void
}

export function AddControlMeasureDialog({
  complianceRecordId,
  requirementId,
  onSuccess,
}: AddControlMeasureDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [evidenceTypes, setEvidenceTypes] = useState<any[]>([])
  const [selectedEvidenceTypes, setSelectedEvidenceTypes] = useState<string[]>([])
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "not_started" as const,
    deadline: "",
  })

  useEffect(() => {
    if (open) {
      fetchEvidenceTypes()
    }
  }, [open])

  const fetchEvidenceTypes = async () => {
    try {
      const response = await fetch("/api/dictionaries/evidence-types")
      const data = await response.json()
      setEvidenceTypes(Array.isArray(data) ? data : data.data || [])
    } catch (error) {
      console.error("[v0] Failed to fetch evidence types:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/control-measures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complianceRecordId,
          requirementId,
          ...formData,
          allowedEvidenceTypeIds: selectedEvidenceTypes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Ошибка создания меры")
      }

      toast({
        title: "Мера создана",
        description: "Мера контроля успешно добавлена",
      })

      setOpen(false)
      setFormData({
        title: "",
        description: "",
        status: "not_started",
        deadline: "",
      })
      setSelectedEvidenceTypes([])
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать меру",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Добавить меру
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Добавить меру контроля</DialogTitle>
            <DialogDescription>Создайте новую меру для выполнения требования</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Название меры *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Например: Настройка межсетевого экрана"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Подробное описание меры..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Статус</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Не начато</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="completed">Выполнено</SelectItem>
                    <SelectItem value="verified">Проверено</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deadline">Срок выполнения</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Требуемые типы доказательств</Label>
              <div className="flex flex-wrap gap-2">
                {evidenceTypes.map((type) => (
                  <Badge
                    key={type.id}
                    variant={selectedEvidenceTypes.includes(type.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedEvidenceTypes((prev) =>
                        prev.includes(type.id) ? prev.filter((id) => id !== type.id) : [...prev, type.id],
                      )
                    }}
                  >
                    {type.title}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Выберите типы доказательств, которые необходимы для подтверждения этой меры
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title}>
              {isLoading ? "Создание..." : "Создать меру"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
