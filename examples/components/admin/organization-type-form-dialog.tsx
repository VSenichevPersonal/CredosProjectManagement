"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { OrganizationType } from "@/types/domain/organization-type"

interface OrganizationTypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type?: OrganizationType
  onSuccess: () => void
}

export function OrganizationTypeFormDialog({ open, onOpenChange, type, onSuccess }: OrganizationTypeFormDialogProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    icon: "",
    sortOrder: 0,
    isActive: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (type) {
      setFormData({
        code: type.code,
        name: type.name,
        description: type.description || "",
        icon: type.icon || "",
        sortOrder: type.sortOrder,
        isActive: type.isActive,
      })
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
        icon: "",
        sortOrder: 0,
        isActive: true,
      })
    }
  }, [type, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = type ? `/api/dictionaries/organization-types/${type.id}` : "/api/dictionaries/organization-types"

      const response = await fetch(url, {
        method: type ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to save")
      }

      onSuccess()
    } catch (error) {
      console.error("Failed to save organization type:", error)
      alert("Не удалось сохранить тип организации")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{type ? "Редактировать тип организации" : "Создать тип организации"}</DialogTitle>
          <DialogDescription>Заполните информацию о типе организации</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Код *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="ministry"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Министерство"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Федеральное министерство"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Иконка (lucide-react)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Building2"
              />
              <p className="text-xs text-muted-foreground">Название иконки из библиотеки lucide-react</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Порядок сортировки</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: Number.parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Активен</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Сохранение..." : type ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
