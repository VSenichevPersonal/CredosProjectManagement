"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Loader2 } from "lucide-react"

interface EvidenceUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  complianceRecordId?: string
  requirementId?: string
  controlId?: string
}

export function EvidenceUploadDialog({
  open,
  onOpenChange,
  onSuccess,
  complianceRecordId,
  requirementId,
  controlId,
}: EvidenceUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      alert("Пожалуйста, выберите файл")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (title) formData.append("title", title)
      if (description) formData.append("description", description)
      if (tags) formData.append("tags", tags)
      if (complianceRecordId) formData.append("complianceRecordId", complianceRecordId)
      if (requirementId) formData.append("requirementId", requirementId)
      if (controlId) formData.append("controlId", controlId)

      const response = await fetch("/api/evidence", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload evidence")
      }

      // Reset form
      setFile(null)
      setTitle("")
      setDescription("")
      setTags("")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to upload evidence:", error)
      alert("Не удалось загрузить доказательство")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Загрузить доказательство</DialogTitle>
          <DialogDescription>Добавьте файл доказательства соответствия требованию</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Файл *</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              disabled={isUploading}
            />
            {file && <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} МБ</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Краткое название доказательства"
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробное описание доказательства"
              rows={3}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Теги</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Теги через запятую (например: политика, процедура)"
              disabled={isUploading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
              Отмена
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Загрузить
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
