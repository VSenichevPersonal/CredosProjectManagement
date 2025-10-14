/**
 * @intent: Drag-and-drop file upload zone with validation
 * @llm-note: Reusable upload component with preview
 */

"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, X, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { validateFile, formatFileSize, type FileValidationOptions } from "@/lib/utils/file-validation"
import type { EvidenceType } from "@/types/domain/evidence"

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  selectedFile: File | null
  evidenceType?: EvidenceType
  maxSizeMB?: number
  accept?: string
  disabled?: boolean
}

export function FileUploadZone({
  onFileSelect,
  onFileRemove,
  selectedFile,
  evidenceType,
  maxSizeMB = 50,
  accept,
  disabled = false,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleValidation = useCallback(
    (file: File) => {
      const options: FileValidationOptions = {
        maxSizeMB,
        evidenceType,
      }

      const result = validateFile(file, options)

      if (result.valid) {
        setValidationErrors([])
        onFileSelect(file)
      } else {
        setValidationErrors(result.errors)
      }
    },
    [maxSizeMB, evidenceType, onFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file && !disabled) {
        handleValidation(file)
      }
    },
    [disabled, handleValidation],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleValidation(file)
      }
    },
    [handleValidation],
  )

  const handleRemove = useCallback(() => {
    setValidationErrors([])
    onFileRemove()
  }, [onFileRemove])

  return (
    <div className="flex flex-col gap-2">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">Перетащите файл сюда или нажмите для выбора</p>
          <p className="text-xs text-muted-foreground mb-4">Максимальный размер: {maxSizeMB} МБ</p>
          <input
            type="file"
            onChange={handleFileChange}
            accept={accept}
            disabled={disabled}
            className="hidden"
            id="file-upload"
          />
          <Button type="button" variant="outline" size="sm" asChild disabled={disabled}>
            <label htmlFor="file-upload" className="cursor-pointer">
              Выбрать файл
            </label>
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
          <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={disabled}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            {validationErrors.map((error, index) => (
              <p key={index} className="text-sm">
                {error}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
