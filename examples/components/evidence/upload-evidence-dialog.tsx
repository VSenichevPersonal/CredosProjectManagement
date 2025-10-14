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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, FileText, X, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface UploadEvidenceDialogProps {
  complianceId: string
  controlMeasureId?: string
  allowGeneralEvidence?: boolean
  onSuccess?: () => void
}

export function UploadEvidenceDialog({
  complianceId,
  controlMeasureId,
  allowGeneralEvidence = false,
  onSuccess,
}: UploadEvidenceDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [measures, setMeasures] = useState<any[]>([])
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>([])
  const [isLoadingMeasures, setIsLoadingMeasures] = useState(false)

  useEffect(() => {
    if (open && !controlMeasureId) {
      fetchMeasures()
    } else if (open && controlMeasureId) {
      setSelectedMeasures([controlMeasureId])
    }
  }, [open, controlMeasureId])

  const fetchMeasures = async () => {
    setIsLoadingMeasures(true)
    try {
      const response = await fetch(`/api/compliance/${complianceId}/measures?includeEvidenceTypes=true`)
      if (response.ok) {
        const data = await response.json()
        setMeasures(data.data || [])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch measures:", error)
    } finally {
      setIsLoadingMeasures(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError("Размер файла не должен превышать 50 МБ")
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const toggleMeasure = (measureId: string) => {
    setSelectedMeasures((prev) =>
      prev.includes(measureId) ? prev.filter((id) => id !== measureId) : [...prev, measureId],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Выберите файл для загрузки")
      return
    }

    if (selectedMeasures.length === 0 && !allowGeneralEvidence) {
      setError("Выберите хотя бы одну меру контроля")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("complianceId", complianceId)
      if (description) {
        formData.append("description", description)
      }
      formData.append("controlMeasureIds", JSON.stringify(selectedMeasures))

      const response = await fetch("/api/evidence", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Ошибка загрузки файла")
      }

      setOpen(false)
      setFile(null)
      setDescription("")
      setSelectedMeasures([])
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки файла")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Загрузить доказательство
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Загрузить доказательство</DialogTitle>
            <DialogDescription>
              {controlMeasureId
                ? "Загрузите файл для подтверждения выполнения меры контроля"
                : allowGeneralEvidence
                  ? "Загрузите файл и привяжите к мерам контроля или оставьте как общее доказательство"
                  : "Загрузите файл и привяжите его к мерам контроля"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">Файл</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                  className="cursor-pointer"
                />
              </div>
              {file && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} МБ</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Поддерживаемые форматы: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT (макс. 50 МБ)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Описание (опционально)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание документа..."
                rows={3}
              />
            </div>

            {!controlMeasureId && (
              <div className="grid gap-2">
                <Label>
                  Меры контроля
                  {allowGeneralEvidence && <span className="text-muted-foreground ml-1">(опционально)</span>}
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {allowGeneralEvidence
                    ? "Выберите меры, к которым относится это доказательство, или оставьте пустым для общего доказательства"
                    : "Выберите меры, к которым относится это доказательство"}
                </p>
                {isLoadingMeasures ? (
                  <div className="text-sm text-muted-foreground">Загрузка мер...</div>
                ) : measures.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 border rounded-md text-center">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Меры контроля еще не созданы
                  </div>
                ) : (
                  <div className="border rounded-md max-h-[200px] overflow-y-auto">
                    {measures.map((measure) => (
                      <div
                        key={measure.id}
                        className="flex items-start gap-3 p-3 hover:bg-muted/50 border-b last:border-b-0"
                      >
                        <Checkbox
                          id={`measure-${measure.id}`}
                          checked={selectedMeasures.includes(measure.id)}
                          onCheckedChange={() => toggleMeasure(measure.id)}
                        />
                        <div className="flex-1 space-y-1">
                          <label htmlFor={`measure-${measure.id}`} className="text-sm font-medium cursor-pointer">
                            {measure.title}
                          </label>
                          {measure.evidenceTypes && measure.evidenceTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {measure.evidenceTypes.map((type: any) => (
                                <Badge key={type.id} variant="outline" className="text-xs">
                                  {type.title}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={!file || (selectedMeasures.length === 0 && !allowGeneralEvidence) || isLoading}
            >
              {isLoading ? "Загрузка..." : "Загрузить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
