/**
 * @intent: File validation utilities
 * @llm-note: Validates file size, type, and content
 */

import type { EvidenceType } from "@/types/domain/evidence"
import { getAllowedMimeTypes, getAllowedExtensions } from "./evidence-type-helpers"

export interface FileValidationResult {
  valid: boolean
  errors: string[]
}

export interface FileValidationOptions {
  maxSizeMB?: number
  allowedTypes?: string[]
  evidenceType?: EvidenceType
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, options: FileValidationOptions = {}): FileValidationResult {
  const errors: string[] = []

  // Validate file size
  const maxSizeMB = options.maxSizeMB || 50
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  if (file.size > maxSizeBytes) {
    errors.push(`Размер файла не должен превышать ${maxSizeMB} МБ`)
  }

  if (file.size === 0) {
    errors.push("Файл пустой")
  }

  // Validate file type
  if (options.evidenceType) {
    const allowedTypes = getAllowedMimeTypes(options.evidenceType)
    if (!allowedTypes.includes("*/*") && !allowedTypes.includes(file.type)) {
      const allowedExts = getAllowedExtensions(options.evidenceType).join(", ")
      errors.push(`Недопустимый тип файла. Разрешены: ${allowedExts}`)
    }
  } else if (options.allowedTypes && options.allowedTypes.length > 0) {
    if (!options.allowedTypes.includes(file.type)) {
      errors.push(`Недопустимый тип файла: ${file.type}`)
    }
  }

  // Validate file name
  if (!file.name || file.name.trim() === "") {
    errors.push("Имя файла не может быть пустым")
  }

  // Check for potentially dangerous file extensions
  const dangerousExtensions = [".exe", ".bat", ".cmd", ".sh", ".ps1", ".vbs", ".js", ".jar"]
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

  if (dangerousExtensions.includes(fileExtension)) {
    errors.push("Загрузка исполняемых файлов запрещена")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Get file extension
 */
export function getFileExtension(fileName: string): string {
  return fileName.substring(fileName.lastIndexOf(".")).toLowerCase()
}

/**
 * Check if file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/")
}

/**
 * Check if file is a PDF
 */
export function isPDFFile(mimeType: string): boolean {
  return mimeType === "application/pdf"
}

/**
 * Check if file is a document
 */
export function isDocumentFile(mimeType: string): boolean {
  const documentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ]
  return documentTypes.includes(mimeType)
}
