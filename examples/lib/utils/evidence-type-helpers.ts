/**
 * @intent: Helper utilities for evidence type system
 * @llm-note: Provides type detection, validation, and UI helpers
 */

import type { EvidenceType } from "@/types/domain/evidence"

/**
 * Get allowed MIME types for evidence type
 */
export function getAllowedMimeTypes(evidenceType: EvidenceType): string[] {
  const mimeTypes: Record<EvidenceType, string[]> = {
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
    screenshot: ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"],
    log: ["text/plain", "text/log", "application/json"],
    certificate: ["application/x-x509-ca-cert", "application/x-pem-file", "application/pkcs12"],
    report: [
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    scan: ["application/pdf", "image/png", "image/jpeg", "image/jpg"],
    video: ["video/mp4", "video/avi", "video/quicktime"],
    audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
    archive: ["application/zip", "application/x-rar", "application/x-7z-compressed"],
    other: ["*/*"],
  }

  return mimeTypes[evidenceType] || mimeTypes.other
}

/**
 * Detect evidence type from MIME type
 */
export function detectEvidenceType(mimeType: string): EvidenceType {
  if (mimeType.startsWith("image/")) return "screenshot"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  if (mimeType.startsWith("text/")) return "log"

  if (["application/zip", "application/x-rar", "application/x-7z-compressed"].includes(mimeType)) {
    return "archive"
  }

  if (
    [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(mimeType)
  ) {
    return "document"
  }

  if (
    ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(mimeType)
  ) {
    return "report"
  }

  return "other"
}

/**
 * Get file extensions for evidence type
 */
export function getAllowedExtensions(evidenceType: EvidenceType): string[] {
  const extensions: Record<EvidenceType, string[]> = {
    document: [".pdf", ".doc", ".docx", ".txt"],
    screenshot: [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    log: [".txt", ".log", ".json"],
    certificate: [".cer", ".pem", ".p12", ".pfx"],
    report: [".pdf", ".xls", ".xlsx"],
    scan: [".pdf", ".png", ".jpg", ".jpeg"],
    video: [".mp4", ".avi", ".mov"],
    audio: [".mp3", ".wav", ".ogg"],
    archive: [".zip", ".rar", ".7z"],
    other: [".*"],
  }

  return extensions[evidenceType] || extensions.other
}

/**
 * Get display name for evidence type
 */
export function getEvidenceTypeLabel(evidenceType: EvidenceType): string {
  const labels: Record<EvidenceType, string> = {
    document: "Документ",
    screenshot: "Скриншот",
    log: "Лог",
    certificate: "Сертификат",
    report: "Отчет",
    scan: "Скан",
    video: "Видео",
    audio: "Аудио",
    archive: "Архив",
    other: "Прочее",
  }

  return labels[evidenceType] || labels.other
}

/**
 * Get icon name for evidence type (lucide-react)
 */
export function getEvidenceTypeIcon(evidenceType: EvidenceType): string {
  const icons: Record<EvidenceType, string> = {
    document: "FileText",
    screenshot: "Image",
    log: "FileCode",
    certificate: "Award",
    report: "FileSpreadsheet",
    scan: "ScanLine",
    video: "Video",
    audio: "Music",
    archive: "Archive",
    other: "File",
  }

  return icons[evidenceType] || icons.other
}

/**
 * Validate file type against evidence type
 */
export function validateFileType(mimeType: string, evidenceType: EvidenceType): boolean {
  const allowedTypes = getAllowedMimeTypes(evidenceType)

  if (allowedTypes.includes("*/*")) return true

  return allowedTypes.includes(mimeType)
}
