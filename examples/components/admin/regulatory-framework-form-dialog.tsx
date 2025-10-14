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
import { RegulatoryFrameworkBadge } from "@/components/ui/regulatory-framework-badge"
import type { RegulatoryFramework } from "@/types/domain/regulatory-framework"
import type { RegulatoryDocumentType } from "@/types/domain/regulatory-document-type"

interface RegulatoryFrameworkFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  framework?: RegulatoryFramework | null
  onSuccess: () => void
}

const BADGE_COLORS = [
  { value: "blue", label: "Синий", description: "Для Федеральных законов" },
  { value: "purple", label: "Фиолетовый", description: "Для специальных ФЗ" },
  { value: "orange", label: "Оранжевый", description: "Для приказов ФСТЭК" },
  { value: "red", label: "Красный", description: "Для приказов ФСБ" },
  { value: "green", label: "Зеленый", description: "Для ГОСТов" },
  { value: "secondary", label: "Серый", description: "По умолчанию" },
  { value: "outline", label: "Контурный", description: "Для неактивных" },
]

export function RegulatoryFrameworkFormDialog({
  open,
  onOpenChange,
  framework,
  onSuccess,
}: RegulatoryFrameworkFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    effectiveDate: "",
    badgeText: "",
    badgeColor: "secondary",
    documentTypeId: "",
  })
  const [documentTypes, setDocumentTypes] = useState<RegulatoryDocumentType[]>([])

  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        console.log("[v0] Fetching document types...")
        const response = await fetch("/api/admin/regulatory-document-types")

        console.log("[v0] Response status:", response.status)
        console.log("[v0] Response ok:", response.ok)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[v0] Failed to fetch document types - response not ok:", errorText)
          return
        }

        const data = await response.json()
        console.log("[v0] Document types fetched:", data)

        setDocumentTypes(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("[v0] Failed to fetch document types:", error)
      }
    }
    if (open) {
      fetchDocumentTypes()
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setFormData({
        code: framework?.code || "",
        name: framework?.name || "",
        description: framework?.description || "",
        effectiveDate: framework?.effectiveDate ? new Date(framework.effectiveDate).toISOString().split("T")[0] : "",
        badgeText: framework?.badgeText || "",
        badgeColor: framework?.badgeColor || "secondary",
        documentTypeId: framework?.documentTypeId || "",
      })
    }
  }, [framework, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = framework
        ? `/api/dictionaries/regulatory-frameworks/${framework.id}`
        : "/api/dictionaries/regulatory-frameworks"

      const method = framework ? "PUT" : "POST"

      console.log("[v0] Submitting framework:", { url, method, formData })

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          effectiveDate: formData.effectiveDate || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Failed to save framework:", errorData)
        throw new Error(errorData.error || "Failed to save framework")
      }

      console.log("[v0] Framework saved successfully")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Failed to save framework:", error)
      alert("Не удалось сохранить нормативный документ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{framework ? "Редактировать нормативный документ" : "Создать нормативный документ"}</DialogTitle>
          <DialogDescription>Заполните информацию о законе или нормативном акте</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Код документа *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="152-FZ"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Дата вступления в силу</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentTypeId">Вид нормативной документации *</Label>
            <Select
              value={formData.documentTypeId}
              onValueChange={(value) => setFormData({ ...formData, documentTypeId: value })}
              required
            >
              <SelectTrigger id="documentTypeId">
                <SelectValue placeholder="Выберите вид документации" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">Загрузка...</div>
                ) : (
                  documentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{type.name}</span>
                        {type.description && <span className="text-xs text-muted-foreground">{type.description}</span>}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Категория нормативного документа (Законодательные, Внутренние, СМК)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Название документа *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Федеральный закон №152-ФЗ «О персональных данных»"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Краткое описание документа и его области применения"
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-4">Настройки беджа</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="badgeText">Текст беджа</Label>
                <Input
                  id="badgeText"
                  value={formData.badgeText}
                  onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                  placeholder="152-ФЗ"
                />
                <p className="text-xs text-muted-foreground">Краткое название для отображения в таблицах</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="badgeColor">Цвет беджа</Label>
                <Select
                  value={formData.badgeColor}
                  onValueChange={(value) => setFormData({ ...formData, badgeColor: value })}
                >
                  <SelectTrigger id="badgeColor">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <RegulatoryFrameworkBadge
                            code={formData.code || "TEST"}
                            badgeText={color.label}
                            badgeColor={color.value}
                          />
                          <span className="text-xs text-muted-foreground">{color.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <Label className="text-xs text-muted-foreground mb-2 block">Превью беджа:</Label>
              <RegulatoryFrameworkBadge
                code={formData.code || "TEST"}
                badgeText={formData.badgeText || formData.code || "Пример"}
                badgeColor={formData.badgeColor}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Сохранение..." : framework ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
