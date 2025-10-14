"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Loader2, FileText, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Document } from "@/types/domain/document"
import type { DocumentType } from "@/types/domain/document-type"

interface UploadDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (document: Document) => void
}

export function UploadDocumentDialog({ open, onOpenChange, onSuccess }: UploadDocumentDialogProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [validityDays, setValidityDays] = useState("")
  const [documentTypeId, setDocumentTypeId] = useState("")
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])

  useEffect(() => {
    const loadDocumentTypes = async () => {
      try {
        const response = await fetch("/api/document-types")
        if (response.ok) {
          const data = await response.json()
          setDocumentTypes(data.data || [])
        }
      } catch (error) {
        console.error("Failed to load document types:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить типы документов",
          variant: "destructive"
        })
      }
    }
    if (open) {
      loadDocumentTypes()
    }
  }, [open, toast])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file size
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast({
          title: "Ошибка",
          description: "Размер файла не должен превышать 50 МБ",
          variant: "destructive"
        })
        return
      }

      setFile(selectedFile)
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast({
        title: "Ошибка",
        description: "Выберите файл",
        variant: "destructive"
      })
      return
    }

    if (!documentTypeId) {
      toast({
        title: "Ошибка",
        description: "Выберите вид документации",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    try {
      console.log("[v0] Uploading file to storage...")
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const uploadResponse = await fetch("/api/documents/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || "Failed to upload file")
      }

      const { data: uploadData } = await uploadResponse.json()
      console.log("[v0] File uploaded:", uploadData)

      console.log("[v0] Creating document record...")
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: uploadData.fileName,
          fileUrl: uploadData.fileUrl,
          fileType: uploadData.fileType,
          fileSize: uploadData.fileSize,
          storagePath: uploadData.storagePath,
          title: title || uploadData.fileName,
          description,
          documentTypeId,
          validityPeriodDays: validityDays ? Number.parseInt(validityDays) : undefined,
          versionNumber: "v1.0",
          changeSummary: "Первая версия документа",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create document")
      }

      const { data } = await response.json()
      console.log("[v0] Document created:", data)

      toast({
        title: "✅ Документ загружен",
        description: `"${title || file.name}" успешно добавлен в библиотеку`,
      })
      
      onSuccess(data)
      onOpenChange(false)
      handleReset()
      onOpenChange(false)
    } catch (error) {
      console.error("[Upload Document] Error:", error)
      toast({
        title: "❌ Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить документ",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setTitle("")
    setDescription("")
    setValidityDays("")
    setDocumentTypeId("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Загрузить документ</DialogTitle>
          <DialogDescription>Загрузите новый документ с автоматическим версионированием</DialogDescription>
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
            {file && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1">{file.name}</span>
                <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} МБ</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null)
                    setTitle("")
                  }}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Поддерживаемые форматы: PDF, DOC, DOCX, TXT (макс. 50 МБ)</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="documentType">Вид документации *</Label>
            <Select value={documentTypeId} onValueChange={setDocumentTypeId} disabled={isUploading} required>
              <SelectTrigger>
                <SelectValue placeholder="Выберите вид документации" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Обязательное поле. Определяет категорию документа (законодательный, внутренний, СМК)
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название документа"
              disabled={isUploading}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание документа"
              rows={3}
              disabled={isUploading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="validity">Срок действия (дней)</Label>
            <Input
              id="validity"
              type="number"
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              placeholder="365"
              disabled={isUploading}
              min="1"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleReset()
                onOpenChange(false)
              }}
              disabled={isUploading}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isUploading || !file || !documentTypeId} className="flex-1">
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
