"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Loader2, FileText, Trash2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useEffect } from "react"

interface UploadEvidenceForMeasureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  complianceId: string
  controlMeasureId: string
  requirementId?: string
  evidenceTypeMode?: 'strict' | 'flexible'
  allowedEvidenceTypeIds?: string[]
  onSuccess?: () => void
}

export function UploadEvidenceForMeasureDialog({
  open,
  onOpenChange,
  complianceId,
  controlMeasureId,
  requirementId,
  evidenceTypeMode = 'flexible',
  allowedEvidenceTypeIds = [],
  onSuccess,
}: UploadEvidenceForMeasureDialogProps) {
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [selectedEvidenceTypeId, setSelectedEvidenceTypeId] = useState<string>("")
  
  // Reset при открытии диалога
  useEffect(() => {
    if (open) {
      setSelectedEvidenceTypeId("")  // Сброс при открытии
      setFile(null)
      setTitle("")
      setDescription("")
      setTags("")
      setValidityDays("")
    }
  }, [open])
  const [evidenceTypes, setEvidenceTypes] = useState<any[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [tags, setTags] = useState("")
  const [validityDays, setValidityDays] = useState("")
  const { toast } = useToast()
  
  // Загрузить типы доказательств
  useEffect(() => {
    if (open) {
      fetchEvidenceTypes()
    }
  }, [open])
  
  const fetchEvidenceTypes = async () => {
    setLoadingTypes(true)
    try {
      const response = await fetch('/api/dictionaries/evidence-types')
      const data = await response.json()
      
      console.log('[Upload Evidence] Evidence types loaded:', data.data?.length || 0)
      console.log('[Upload Evidence] Mode:', evidenceTypeMode, 'Allowed:', allowedEvidenceTypeIds)
      
      // Если strict режим - фильтруем только allowed
      if (evidenceTypeMode === 'strict' && allowedEvidenceTypeIds.length > 0) {
        const filtered = (data.data || []).filter((et: any) => 
          allowedEvidenceTypeIds.includes(et.id)
        )
        console.log('[Upload Evidence] Filtered types:', filtered.length)
        setEvidenceTypes(filtered)
        
        // Если только один тип - выбираем автоматически
        if (filtered.length === 1) {
          setSelectedEvidenceTypeId(filtered[0].id)
        }
      } else {
        setEvidenceTypes(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch evidence types:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить типы доказательств",
        variant: "destructive"
      })
    } finally {
      setLoadingTypes(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Auto-fill title from filename
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      setFile(droppedFile)
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите файл",
        variant: "destructive",
      })
      return
    }
    
    if (!complianceId) {
      toast({
        title: "Ошибка",
        description: "Не указан ID записи соответствия",
        variant: "destructive",
      })
      return
    }
    
    // Валидация типа доказательства в strict режиме
    if (evidenceTypeMode === 'strict' && !selectedEvidenceTypeId) {
      toast({
        title: "Ошибка",
        description: "Требование в строгом режиме. Необходимо выбрать тип доказательства.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      // 1. Upload file to Supabase Storage
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title || file.name)
      formData.append("description", description)
      
      // Проверяем что complianceId это UUID
      if (complianceId && complianceId.length > 0) {
        formData.append("complianceRecordId", complianceId)
      }
      
      // Передаем evidenceTypeId (обязательно в strict режиме)
      console.log('[Upload Dialog] Selected evidence type:', {
        selectedEvidenceTypeId,
        length: selectedEvidenceTypeId?.length,
        hasValue: selectedEvidenceTypeId && selectedEvidenceTypeId.length > 0,
        evidenceTypeMode,
        allowedTypes: allowedEvidenceTypeIds
      })
      
      // Передаем ТОЛЬКО если не пустая строка
      if (selectedEvidenceTypeId && selectedEvidenceTypeId.trim().length > 0) {
        formData.append("evidence_type_id", selectedEvidenceTypeId)
        formData.append("evidenceTypeId", selectedEvidenceTypeId)
        console.log('[Upload Dialog] ✅ Added to FormData:', {
          evidence_type_id: selectedEvidenceTypeId,
          evidenceTypeId: selectedEvidenceTypeId
        })
      } else {
        console.warn('[Upload Dialog] ❌ NO evidenceTypeId (empty string)!', {
          selectedEvidenceTypeId,
          evidenceTypeMode,
          isStrict: evidenceTypeMode === 'strict',
          shouldFail: evidenceTypeMode === 'strict'
        })
      }
      
      // Дополнительные поля
      if (tags) {
        formData.append("tags", tags)
      }
      
      if (validityDays) {
        formData.append("validityPeriodDays", validityDays)
      }

      const uploadResponse = await fetch("/api/evidence", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        console.error("[Upload Error] Response:", errorData)
        
        // Красиво форматируем ошибку валидации
        if (errorData.error && typeof errorData.error === 'object') {
          const validationErrors = JSON.stringify(errorData.error, null, 2)
          throw new Error(`Ошибка валидации:\n${validationErrors}`)
        }
        
        throw new Error(errorData.error || errorData.message || "Failed to upload evidence")
      }

      const uploadData = await uploadResponse.json()
      const evidenceId = uploadData.data?.id

      if (!evidenceId) {
        throw new Error("No evidence ID returned from upload")
      }

      // 2. Link evidence to measure
      const linkResponse = await fetch("/api/evidence-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidenceId: evidenceId,
          controlMeasureId: controlMeasureId,
          relevanceScore: 5,  // По умолчанию
        }),
      })

      if (!linkResponse.ok) {
        const errorData = await linkResponse.json()
        throw new Error(errorData.error || "Failed to link evidence to measure")
      }

      toast({
        title: "Успешно загружено",
        description: `Доказательство "${title || file.name}" привязано к мере`,
      })

      // Reset form
      setFile(null)
      setTitle("")
      setDescription("")
      setSelectedEvidenceTypeId("")
      setTags("")
      setValidityDays("")
      onOpenChange(false)
      
      // Notify parent
      onSuccess?.()

    } catch (error) {
      console.error("[v0] Upload failed:", error)
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить доказательство",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Загрузить доказательство
          </DialogTitle>
          
          {/* Индикатор режима */}
          {evidenceTypeMode === 'strict' && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-900">
                🔒 Строгий режим
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Для этой меры разрешены только определенные типы доказательств.
                {allowedEvidenceTypeIds.length > 0 && (
                  <span> Доступно типов: {allowedEvidenceTypeIds.length}</span>
                )}
              </p>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* File input with drag & drop */}
          <div className="space-y-2">
            <Label htmlFor="file">
              Файл <span className="text-destructive">*</span>
            </Label>
            
            {!file ? (
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                  isDragging 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  required
                  disabled={uploading}
                  className="hidden"
                />
                <label htmlFor="file" className="cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">Нажмите для выбора файла</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    или перетащите файл сюда
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Поддерживаются: PDF, Word, Excel, изображения
                  </p>
                </label>
              </div>
            ) : (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-green-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} КБ • {file.type}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                    disabled={uploading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Evidence Type Selection - ВСЕГДА ПОКАЗЫВАЕМ */}
          <div className="space-y-2">
            <Label htmlFor="evidenceType" className="flex items-center gap-2">
              Тип доказательства
              {evidenceTypeMode === 'strict' ? (
                <span className="text-destructive">*</span>
              ) : (
                <span className="text-xs text-muted-foreground font-normal">(опционально)</span>
              )}
            </Label>
            
            {loadingTypes ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                Загрузка типов...
              </div>
            ) : evidenceTypes.length === 0 ? (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Не удалось загрузить типы доказательств
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Select
                  value={selectedEvidenceTypeId}
                  onValueChange={setSelectedEvidenceTypeId}
                  disabled={uploading || (evidenceTypeMode === 'strict' && evidenceTypes.length === 1)}
                  required={evidenceTypeMode === 'strict'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      evidenceTypeMode === 'strict' 
                        ? "Выберите тип из разрешенных" 
                        : "Не выбрано (определится автоматически)"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {evidenceTypeMode === 'flexible' && (
                      <SelectItem value="">Автоматическое определение</SelectItem>
                    )}
                    {evidenceTypes.map((et) => (
                      <SelectItem key={et.id} value={et.id}>
                        {et.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {evidenceTypeMode === 'strict' ? (
                  <Alert className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      🔒 Строгий режим: Разрешено только {evidenceTypes.length} {evidenceTypes.length === 1 ? 'тип' : 'типов'} доказательств
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    💡 Если не выбрано, тип определится автоматически по формату файла
                  </p>
                )}
              </>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Приказ о внедрении 2FA"
              disabled={uploading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Описание (опционально)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Дополнительная информация о документе"
              rows={2}
              disabled={uploading}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Теги (опционально)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="КИИ, политика, обучение (через запятую)"
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground">
              Для удобного поиска и категоризации
            </p>
          </div>

          {/* Validity Days */}
          <div className="space-y-2">
            <Label htmlFor="validityDays">Срок действия (дней)</Label>
            <Input
              id="validityDays"
              type="number"
              min="1"
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              placeholder="365 (для года)"
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground">
              Через сколько дней доказательство нужно обновить
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={uploading || !file}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? "Загрузка..." : "Загрузить и привязать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

