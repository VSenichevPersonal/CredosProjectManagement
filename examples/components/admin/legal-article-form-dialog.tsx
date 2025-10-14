"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { LegalArticle } from "@/types/domain/legal-article"

interface LegalArticleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  article: LegalArticle | null
  regulatoryFrameworkId: string
  onSuccess: () => void
}

export function LegalArticleFormDialog({
  open,
  onOpenChange,
  article,
  regulatoryFrameworkId,
  onSuccess,
}: LegalArticleFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    articleNumber: "",
    part: "",
    paragraph: "",
    clause: "",
    subclause: "",
    fullReference: "",
    title: "",
    content: "",
    isActive: true,
    effectiveFrom: "",
    effectiveTo: "",
  })

  useEffect(() => {
    if (article) {
      setFormData({
        articleNumber: article.articleNumber || "",
        part: article.part || "",
        paragraph: article.paragraph || "",
        clause: article.clause || "",
        subclause: article.subclause || "",
        fullReference: article.fullReference,
        title: article.title || "",
        content: article.content || "",
        isActive: article.isActive,
        effectiveFrom: article.effectiveFrom || "",
        effectiveTo: article.effectiveTo || "",
      })
    } else {
      setFormData({
        articleNumber: "",
        part: "",
        paragraph: "",
        clause: "",
        subclause: "",
        fullReference: "",
        title: "",
        content: "",
        isActive: true,
        effectiveFrom: "",
        effectiveTo: "",
      })
    }
  }, [article, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = article ? `/api/legal-articles/${article.id}` : "/api/legal-articles"
      const method = article ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          regulatoryFrameworkId,
          effectiveFrom: formData.effectiveFrom || undefined,
          effectiveTo: formData.effectiveTo || undefined,
        }),
      })

      if (!response.ok) throw new Error("Failed to save article")

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Failed to save article:", error)
      alert("Не удалось сохранить пункт")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{article ? "Редактировать пункт" : "Добавить пункт"}</DialogTitle>
          <DialogDescription>
            Укажите структуру пункта документа (статья, часть, параграф, пункт) и его содержание
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="articleNumber">Номер статьи</Label>
                <Input
                  id="articleNumber"
                  placeholder="18.1"
                  value={formData.articleNumber}
                  onChange={(e) => setFormData({ ...formData, articleNumber: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="part">Часть</Label>
                <Input
                  id="part"
                  placeholder="1"
                  value={formData.part}
                  onChange={(e) => setFormData({ ...formData, part: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paragraph">Параграф</Label>
                <Input
                  id="paragraph"
                  placeholder="2"
                  value={formData.paragraph}
                  onChange={(e) => setFormData({ ...formData, paragraph: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clause">Пункт</Label>
                <Input
                  id="clause"
                  placeholder="а"
                  value={formData.clause}
                  onChange={(e) => setFormData({ ...formData, clause: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullReference">
                Полная ссылка <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullReference"
                placeholder="ч. 1 ст. 18.1 Закона №152-ФЗ"
                value={formData.fullReference}
                onChange={(e) => setFormData({ ...formData, fullReference: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Например: "ч. 1 ст. 18.1 Закона №152-ФЗ" или "п. 5 Приказа ФСТЭК №21"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Название пункта</Label>
              <Input
                id="title"
                placeholder="Назначение ответственного за обработку ПДн"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Содержание</Label>
              <Textarea
                id="content"
                placeholder="Полный текст статьи или пункта..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effectiveFrom">Дата вступления в силу</Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  value={formData.effectiveFrom}
                  onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveTo">Дата окончания действия</Label>
                <Input
                  id="effectiveTo"
                  type="date"
                  value={formData.effectiveTo}
                  onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Активен</Label>
                <p className="text-sm text-muted-foreground">Пункт доступен для использования в требованиях</p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Сохранение..." : article ? "Сохранить" : "Создать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
