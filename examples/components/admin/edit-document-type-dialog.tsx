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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { RegulatoryDocumentType } from "@/types/domain/regulatory-document-type"

interface EditDocumentTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentType: RegulatoryDocumentType
  onSuccess: () => void
}

export function EditDocumentTypeDialog({ open, onOpenChange, documentType, onSuccess }: EditDocumentTypeDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: documentType.name,
    description: documentType.description || "",
    icon: documentType.icon || "scale",
    color: documentType.color || "blue",
    sortOrder: documentType.sortOrder,
    isActive: documentType.isActive,
  })

  useEffect(() => {
    setFormData({
      name: documentType.name,
      description: documentType.description || "",
      icon: documentType.icon || "scale",
      color: documentType.color || "blue",
      sortOrder: documentType.sortOrder,
      isActive: documentType.isActive,
    })
  }, [documentType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/regulatory-document-types/${documentType.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to update document type")
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating document type:", error)
      alert("Ошибка при обновлении вида документации")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Редактировать вид документации</DialogTitle>
            <DialogDescription>Изменить параметры вида нормативной документации</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={documentType.isSystem}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="icon">Иконка</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scale">Scale (Весы)</SelectItem>
                    <SelectItem value="building">Building (Здание)</SelectItem>
                    <SelectItem value="award">Award (Награда)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color">Цвет</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Синий</SelectItem>
                    <SelectItem value="purple">Фиолетовый</SelectItem>
                    <SelectItem value="green">Зеленый</SelectItem>
                    <SelectItem value="orange">Оранжевый</SelectItem>
                    <SelectItem value="red">Красный</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sortOrder">Порядок сортировки</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: Number.parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Активен</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
