import type { DatabaseProvider } from "@/providers/database-provider"
import type { DocumentVersion } from "@/types/domain/document"
import type { AddVersionDTO } from "@/types/dto/document-dto"
import { AppError } from "@/lib/errors"

export class DocumentVersionService {
  constructor(private db: DatabaseProvider) {}

  async getVersions(userId: string, documentId: string): Promise<DocumentVersion[]> {
    try {
      const versions = await this.db.documentVersions.findByDocument(documentId)
      return versions
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(`Failed to fetch versions: ${error.message}`, 500)
      }
      throw new AppError("Failed to fetch versions", 500)
    }
  }

  async getVersionById(userId: string, versionId: string): Promise<DocumentVersion> {
    try {
      const version = await this.db.documentVersions.findById(versionId)

      if (!version) {
        throw new AppError("Version not found", 404)
      }

      return version
    } catch (error) {
      if (error instanceof AppError) throw error
      if (error instanceof Error) {
        throw new AppError(`Failed to fetch version: ${error.message}`, 500)
      }
      throw new AppError("Failed to fetch version", 500)
    }
  }

  async addVersion(
    userId: string,
    data: Omit<AddVersionDTO, "file"> & {
      fileName: string
      fileUrl: string
      fileType: string
      fileSize: number
      storagePath: string
    },
  ): Promise<DocumentVersion> {
    try {
      // Get current version to calculate new version number
      const currentVersions = await this.db.documentVersions.findByDocument(data.documentId)
      const currentVersion = currentVersions.find((v) => v.isCurrent)

      if (!currentVersion) {
        throw new AppError("No current version found", 404)
      }

      // Calculate new version number
      let majorVersion = currentVersion.majorVersion
      let minorVersion = currentVersion.minorVersion

      if (data.versionType === "major") {
        majorVersion += 1
        minorVersion = 0
      } else {
        minorVersion += 1
      }

      const versionNumber = `v${majorVersion}.${minorVersion}`

      // Create new version
      const version = await this.db.documentVersions.create({
        documentId: data.documentId,
        versionNumber,
        majorVersion,
        minorVersion,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSize: data.fileSize,
        storagePath: data.storagePath,
        changeSummary: data.changeSummary,
        changeNotes: data.changeNotes,
        createdBy: userId,
        isCurrent: true, // This will trigger the function to unset other versions
      })

      return version
    } catch (error) {
      if (error instanceof AppError) throw error
      if (error instanceof Error) {
        throw new AppError(`Failed to add version: ${error.message}`, 500)
      }
      throw new AppError("Failed to add version", 500)
    }
  }

  async rollbackToVersion(userId: string, documentId: string, versionId: string): Promise<DocumentVersion> {
    try {
      // Verify version exists and belongs to document
      const version = await this.db.documentVersions.findById(versionId)

      if (!version || version.documentId !== documentId) {
        throw new AppError("Version not found", 404)
      }

      // Set this version as current
      await this.db.documentVersions.update(versionId, {
        isCurrent: true,
      })

      return await this.getVersionById(userId, versionId)
    } catch (error) {
      if (error instanceof AppError) throw error
      if (error instanceof Error) {
        throw new AppError(`Failed to rollback version: ${error.message}`, 500)
      }
      throw new AppError("Failed to rollback version", 500)
    }
  }

  async getCurrentVersion(userId: string, documentId: string): Promise<DocumentVersion | null> {
    try {
      const versions = await this.db.documentVersions.findByDocument(documentId)
      return versions.find((v) => v.isCurrent) || null
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(`Failed to fetch current version: ${error.message}`, 500)
      }
      throw new AppError("Failed to fetch current version", 500)
    }
  }
}
