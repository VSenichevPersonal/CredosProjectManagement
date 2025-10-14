/**
 * @intent: Unified storage service for file operations
 * @llm-note: Abstracts Supabase Storage operations with ExecutionContext
 * @architecture: Service layer for file management
 */

import type { ExecutionContext } from "@/lib/context/execution-context"
import { createServerClient } from "@/lib/supabase/server"
import { ensureEvidenceBucket } from "@/lib/storage/ensure-bucket"
import { validateFile, type FileValidationOptions } from "@/lib/utils/file-validation"
import type { EvidenceType } from "@/types/domain/evidence"

export interface UploadFileOptions {
  file: File
  folder?: string
  evidenceType?: EvidenceType
  maxSizeMB?: number
  generateSignedUrl?: boolean
  signedUrlExpirySeconds?: number
}

export interface UploadFileResult {
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  storagePath: string
}

export interface DeleteFileOptions {
  storagePath: string
}

export class StorageService {
  private static readonly BUCKET_NAME = "evidence-files"
  private static readonly DEFAULT_SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365 // 1 year

  /**
   * @intent: Upload file to storage
   * @precondition: ctx.user is authenticated, file is valid
   * @postcondition: file uploaded, URL generated
   */
  static async uploadFile(ctx: ExecutionContext, options: UploadFileOptions): Promise<UploadFileResult> {
    ctx.logger.info("[v0] StorageService.uploadFile", { fileName: options.file.name })

    // Validate file
    const validationOptions: FileValidationOptions = {
      maxSizeMB: options.maxSizeMB || 50,
      evidenceType: options.evidenceType,
    }

    const validation = validateFile(options.file, validationOptions)
    if (!validation.valid) {
      throw new Error(`File validation failed: ${validation.errors.join(", ")}`)
    }

    // Ensure bucket exists
    await ensureEvidenceBucket()

    // Generate unique file name
    const timestamp = Date.now()
    const sanitizedName = options.file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const folder = options.folder || "uploads"
    const userId = ctx.user!.id
    const storagePath = `${folder}/${userId}/${timestamp}-${sanitizedName}`

    ctx.logger.info("[v0] Uploading to storage", { storagePath })

    // Get Supabase client
    const supabase = await createServerClient()

    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(StorageService.BUCKET_NAME)
      .upload(storagePath, options.file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      ctx.logger.error("[v0] Upload failed", { error: uploadError })
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Generate signed URL if requested
    let fileUrl: string

    if (options.generateSignedUrl !== false) {
      const expirySeconds = options.signedUrlExpirySeconds || StorageService.DEFAULT_SIGNED_URL_EXPIRY

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(StorageService.BUCKET_NAME)
        .createSignedUrl(storagePath, expirySeconds)

      if (signedUrlError || !signedUrlData) {
        ctx.logger.error("[v0] Signed URL generation failed", { error: signedUrlError })
        throw new Error("Failed to generate file URL")
      }

      fileUrl = signedUrlData.signedUrl
    } else {
      // Get public URL
      const { data: publicUrlData } = supabase.storage.from(StorageService.BUCKET_NAME).getPublicUrl(storagePath)

      fileUrl = publicUrlData.publicUrl
    }

    // Audit log
    await ctx.audit.log({
      eventType: "file_uploaded",
      userId: ctx.user!.id,
      resourceType: "storage",
      resourceId: storagePath,
      metadata: {
        fileName: options.file.name,
        fileSize: options.file.size,
        fileType: options.file.type,
      },
    })

    ctx.logger.info("[v0] File uploaded successfully", { storagePath, fileUrl })

    return {
      fileName: options.file.name,
      fileUrl,
      fileType: options.file.type,
      fileSize: options.file.size,
      storagePath,
    }
  }

  /**
   * @intent: Delete file from storage
   * @precondition: ctx.user is authenticated
   * @postcondition: file deleted from storage
   */
  static async deleteFile(ctx: ExecutionContext, options: DeleteFileOptions): Promise<void> {
    ctx.logger.info("[v0] StorageService.deleteFile", { storagePath: options.storagePath })

    const supabase = await createServerClient()

    const { error } = await supabase.storage.from(StorageService.BUCKET_NAME).remove([options.storagePath])

    if (error) {
      ctx.logger.error("[v0] Delete failed", { error })
      throw new Error(`Failed to delete file: ${error.message}`)
    }

    // Audit log
    await ctx.audit.log({
      eventType: "file_deleted",
      userId: ctx.user!.id,
      resourceType: "storage",
      resourceId: options.storagePath,
    })

    ctx.logger.info("[v0] File deleted successfully", { storagePath: options.storagePath })
  }

  /**
   * @intent: Delete multiple files from storage
   * @precondition: ctx.user is authenticated
   * @postcondition: files deleted from storage
   */
  static async deleteFiles(ctx: ExecutionContext, storagePaths: string[]): Promise<void> {
    ctx.logger.info("[v0] StorageService.deleteFiles", { count: storagePaths.length })

    const supabase = await createServerClient()

    const { error } = await supabase.storage.from(StorageService.BUCKET_NAME).remove(storagePaths)

    if (error) {
      ctx.logger.error("[v0] Bulk delete failed", { error })
      throw new Error(`Failed to delete files: ${error.message}`)
    }

    // Audit log
    await ctx.audit.log({
      eventType: "files_deleted",
      userId: ctx.user!.id,
      resourceType: "storage",
      metadata: { count: storagePaths.length, paths: storagePaths },
    })

    ctx.logger.info("[v0] Files deleted successfully", { count: storagePaths.length })
  }

  /**
   * @intent: Generate new signed URL for existing file
   * @precondition: file exists in storage
   * @postcondition: new signed URL generated
   */
  static async refreshSignedUrl(ctx: ExecutionContext, storagePath: string, expirySeconds?: number): Promise<string> {
    ctx.logger.info("[v0] StorageService.refreshSignedUrl", { storagePath })

    const supabase = await createServerClient()

    const expiry = expirySeconds || StorageService.DEFAULT_SIGNED_URL_EXPIRY

    const { data, error } = await supabase.storage.from(StorageService.BUCKET_NAME).createSignedUrl(storagePath, expiry)

    if (error || !data) {
      ctx.logger.error("[v0] Signed URL refresh failed", { error })
      throw new Error("Failed to refresh signed URL")
    }

    ctx.logger.info("[v0] Signed URL refreshed", { storagePath })

    return data.signedUrl
  }

  /**
   * @intent: Get file metadata from storage
   * @precondition: file exists in storage
   * @postcondition: metadata returned
   */
  static async getFileMetadata(ctx: ExecutionContext, storagePath: string): Promise<any> {
    ctx.logger.info("[v0] StorageService.getFileMetadata", { storagePath })

    const supabase = await createServerClient()

    const { data, error } = await supabase.storage.from(StorageService.BUCKET_NAME).list(storagePath)

    if (error) {
      ctx.logger.error("[v0] Get metadata failed", { error })
      throw new Error("Failed to get file metadata")
    }

    return data
  }

  /**
   * @intent: Download file content from storage
   * @precondition: file exists in storage
   * @postcondition: file content returned as string
   */
  static async downloadFileContent(storagePath: string): Promise<string> {
    const supabase = await createServerClient()

    const { data, error } = await supabase.storage.from(StorageService.BUCKET_NAME).download(storagePath)

    if (error || !data) {
      throw new Error(`Failed to download file: ${error?.message || "Unknown error"}`)
    }

    // Convert blob to text
    const text = await data.text()
    return text
  }
}
