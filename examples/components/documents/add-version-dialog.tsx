"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { DocumentVersion } from "@/types/domain/document"

interface AddVersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  onSuccess: (version: DocumentVersion) => void
}

export function AddVersionDialog({ open, onOpenChange, documentId, onSuccess }: AddVersionDialogProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [versionType, setVersionType] = useState<"major" | "minor">("minor")
  const [changeSummary, setChangeSummary] = useState("")
  const [changeNotes, setChangeNotes] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error("Выберите файл")
      return
    }

    if (!changeSummary) {
      toast.error("Укажите краткое описание изменений")
      return
    }

    setIsUploading(true)

    try {
      // TODO: Upload file to storage
      const fileUrl = `/uploads/${file.name}` // Placeholder
      const storagePath = `documents/${documentId}/${Date.now()}-${file.name}`

      const response = await fetch(`/api/documents/${documentId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileUrl,
          fileType: file.type,
          fileSize: file.size,
          storagePath,
          versionType,
          changeSummary,
          changeNotes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add version")
      }

      const { data } = await response.json()

      toast.success("Версия успешно добавлена")
      onSuccess(data)
      handleReset()
    } catch (error) {
      console.error("[Add Version] Error:", error)
      toast.error("Не удалось добавить версию")
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setVersionType("minor")
    setChangeSummary("")
    setChangeNotes("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить новую версию</DialogTitle>
          <DialogDescription>Загрузите новую версию документа с описанием изменений</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="file">Файл</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
              disabled={isUploading}
            />
            {file && <p className="text-sm text-muted-foreground">{file.name}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Тип версии</Label>
            <RadioGroup value={versionType} onValueChange={(value) => setVersionType(value as "major" | "minor")}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="major" id="major" />
                <Label htmlFor="major" className="font-normal cursor-pointer">
                  Мажорная (v2.0) - значительные изменения
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="minor" id="minor" />
                <Label htmlFor="minor" className="font-normal cursor-pointer">
                  Минорная (v1.1) - небольшие изменения
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="summary">Краткое описание изменений *</Label>
            <Input
              id="summary"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="Обновлены требования к паролям"
              disabled={isUploading}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Подробное описание</Label>
            <Textarea
              id="notes"
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              placeholder="Детальное описание всех изменений..."
              rows={4}
              disabled={isUploading}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isUploading || !file || !changeSummary} className="flex-1">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Добавить
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
